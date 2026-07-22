import { getRegistryItem } from "./registry";
import type {
  JourneyEvent,
  JourneyEventType,
  MyPathDraft,
  PossibilityState,
} from "./types";

export interface MyPathEvidence {
  id: string;
  careerSlug: string;
  label: string;
  detail: string;
  createdAt: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DRAFT_ID_PATTERN = /^[A-Za-z0-9._:-]{6,128}$/;

/** Build a draftId that always satisfies the sync RPC / Zod safeId contract. */
export function durableDraftId(
  lastImportKey: string | null | undefined,
  createdAt: string
): string {
  if (lastImportKey && DRAFT_ID_PATTERN.test(lastImportKey)) {
    return lastImportKey;
  }
  // PostgREST timestamps often use "+00:00"; "+" is not allowed in draftId.
  const stamp = createdAt.replace(/[^A-Za-z0-9._:-]/g, "-");
  const candidate = `persisted-${stamp}`.slice(0, 128);
  return DRAFT_ID_PATTERN.test(candidate)
    ? candidate
    : `persisted-${Date.now()}`;
}

interface PersistedSnapshot {
  path: {
    entry_key: string;
    direction_hypothesis: string | null;
    last_import_key: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  possibilities?: Array<{
    radar_slug: string;
    state: PossibilityState;
    opened_count: number;
    meaningful_open: boolean;
    radar_opened: boolean;
    compared: boolean;
    saved_at: string | null;
    removal_reason: string | null;
    last_interaction_at: string;
  }>;
  questions?: Array<{
    client_question_id: string;
    question_text: string;
    career_slugs: string[];
    status: "open" | "answered";
  }>;
  events?: Array<{
    client_event_id: string;
    event_type: JourneyEventType;
    career_slug: string | null;
    payload: Record<string, unknown> | null;
    occurred_at: string;
  }>;
  reflections?: Array<{
    id: string;
    field_slug: string | null;
    chapter_key: string | null;
    response_text: string | null;
    tags: string[] | null;
    want_to_try: number | null;
    created_at: string | null;
  }>;
}

export interface PersistedMyPathState {
  draft: MyPathDraft;
  evidence: MyPathEvidence[];
  hasPersistedPath: true;
}

export type PersistedMyPathReadResult =
  | { status: "ready"; state: PersistedMyPathState | null }
  | { status: "error"; state: null };

export interface MyPathReadClient {
  rpc(
    name: "get_my_path_journey"
  ): Promise<{ data: unknown; error: { message: string } | null }>;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }
  return value;
}

function eventFromRow(row: NonNullable<PersistedSnapshot["events"]>[number]): JourneyEvent {
  const payload = row.payload ?? {};
  const comparisonSlugs = stringArray(payload.comparisonSlugs);
  return {
    id: row.client_event_id,
    type: row.event_type,
    occurredAt: row.occurred_at,
    careerSlug: row.career_slug ?? undefined,
    comparisonSlugs:
      comparisonSlugs?.length === 2
        ? (comparisonSlugs as [string, string])
        : undefined,
    questionId: typeof payload.questionId === "string" ? payload.questionId : undefined,
    answerId: typeof payload.answerId === "string" ? payload.answerId : undefined,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
    stepId: typeof payload.stepId === "string" ? payload.stepId : undefined,
    metadata:
      payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
        ? (payload.metadata as JourneyEvent["metadata"])
        : undefined,
  };
}

function reflectionDetail(
  reflection: NonNullable<PersistedSnapshot["reflections"]>[number]
): string | null {
  const response = reflection.response_text?.trim();
  if (response) return response;
  if (reflection.tags?.length) return reflection.tags.join(" · ");
  if (reflection.want_to_try != null) {
    return `ความอยากลอง ${reflection.want_to_try}/5`;
  }
  return null;
}

export function hydratePersistedMyPath(
  snapshot: PersistedSnapshot | null
): PersistedMyPathState | null {
  if (!snapshot?.path) return null;

  const events = (snapshot.events ?? []).map(eventFromRow);
  const directionEdit = [...events]
    .reverse()
    .find((event) => event.type === "direction_edited" && event.reason);
  const answers = Object.fromEntries(
    events
      .filter(
        (event) =>
          event.type === "question_answered" && event.questionId && event.answerId
      )
      .map((event) => [event.questionId!, event.answerId!])
  );

  const updatedAt = snapshot.path.updated_at;
  const draft: MyPathDraft = {
    version: 1,
    draftId: durableDraftId(
      snapshot.path.last_import_key,
      snapshot.path.created_at
    ),
    entryKey: snapshot.path.entry_key,
    createdAt: snapshot.path.created_at,
    updatedAt,
    expiresAt: new Date(new Date(updatedAt).getTime() + THIRTY_DAYS_MS).toISOString(),
    directionOverride: directionEdit?.reason,
    rejectedDirections: events
      .filter((event) => event.type === "direction_rejected" && event.reason)
      .map((event) => event.reason!),
    answers,
    skippedQuestions: events
      .filter((event) => event.type === "question_skipped" && event.questionId)
      .map((event) => event.questionId!),
    savedQuestions: (snapshot.questions ?? []).map((question) => ({
      id: question.client_question_id,
      text: question.question_text,
      careerSlugs: question.career_slugs,
      status: question.status,
    })),
    possibilities: Object.fromEntries(
      (snapshot.possibilities ?? []).map((possibility) => [
        possibility.radar_slug,
        {
          slug: possibility.radar_slug,
          state: possibility.state,
          openedCount: possibility.opened_count,
          meaningfulOpen: possibility.meaningful_open,
          radarOpened: possibility.radar_opened,
          compared: possibility.compared,
          savedAt: possibility.saved_at ?? undefined,
          removedReason: possibility.removal_reason ?? undefined,
          updatedAt: possibility.last_interaction_at,
        },
      ])
    ),
    events,
  };

  const evidence = (snapshot.reflections ?? []).flatMap((reflection) => {
    if (!reflection.field_slug) return [];
    const detail = reflectionDetail(reflection);
    if (!detail) return [];
    const career = getRegistryItem(reflection.field_slug);
    return [{
      id: reflection.id,
      careerSlug: reflection.field_slug,
      label: `Radar Reflection · ${career?.titleTh ?? reflection.field_slug}`,
      detail,
      createdAt: reflection.created_at ?? updatedAt,
    }];
  });

  return { draft, evidence, hasPersistedPath: true };
}

export async function loadPersistedMyPath(
  client: MyPathReadClient
): Promise<PersistedMyPathState | null> {
  const result = await loadPersistedMyPathResult(client);
  return result.state;
}

export async function loadPersistedMyPathResult(
  client: MyPathReadClient
): Promise<PersistedMyPathReadResult> {
  const { data, error } = await client.rpc("get_my_path_journey");
  if (error) {
    console.error("My Path could not restore the signed-in journey:", error.message);
    return { status: "error", state: null };
  }
  return {
    status: "ready",
    state: hydratePersistedMyPath(data as PersistedSnapshot | null),
  };
}
