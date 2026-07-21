import { buildDirectionHypothesis, selectNextStep } from "./recommendations";
import { planningRegistry } from "./registry";
import {
  isAuthenticatedRadarUser,
  mapRadarFieldIntent,
  radarMyPathEventSchema,
} from "./radar-sync";
import {
  anonymousEventSchema,
  myPathMutationSchema,
} from "./validation";

interface RpcError {
  code?: string;
  message: string;
}

export interface MyPathRpcClient {
  auth: {
    getUser(): Promise<{
      data: {
        user: {
          id: string;
          is_anonymous?: boolean;
          email?: string | null;
          aud?: string;
          app_metadata?: { provider?: unknown };
          identities?: Array<{ provider?: string }> | null;
        } | null;
      };
      error: RpcError | null;
    }>;
  };
  rpc(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown; error: RpcError | null }>;
}

export interface MutationResult {
  status: number;
  body: Record<string, unknown>;
}

export async function persistMyPathMutation(
  client: MyPathRpcClient,
  input: unknown
): Promise<MutationResult> {
  const parsed = myPathMutationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: "invalid_request", issues: parsed.error.flatten() },
    };
  }

  const auth = await client.auth.getUser();
  if (auth.error || !auth.data.user) {
    return { status: 401, body: { error: "authentication_required" } };
  }

  const direction = buildDirectionHypothesis(parsed.data.draft, planningRegistry);
  const nextStep = selectNextStep(parsed.data.draft, planningRegistry);
  const { data, error } = await client.rpc("sync_my_path_journey", {
    p_draft: parsed.data.draft,
    p_direction: direction,
    p_next_step: nextStep,
  });

  if (error?.code === "23514") {
    return {
      status: 409,
      body: { error: "active_path_limit", message: error.message },
    };
  }
  if (error) {
    console.error("My Path persistence failed:", error.code ?? "unknown");
    return { status: 500, body: { error: "persistence_failed" } };
  }
  return {
    status: 200,
    body: { data, operation: parsed.data.operation },
  };
}

export async function recordAnonymousMyPathEvent(
  client: Pick<MyPathRpcClient, "rpc">,
  input: unknown
): Promise<MutationResult> {
  const parsed = anonymousEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: "invalid_request", issues: parsed.error.flatten() },
    };
  }
  const value = parsed.data;
  const { error } = await client.rpc("record_anonymous_my_path_event", {
    p_session_id: value.sessionId,
    p_event_type: value.eventType,
    p_career_slug: value.careerSlug ?? null,
    p_metadata: value.metadata,
  });
  if (error?.code === "54000") {
    return { status: 429, body: { error: "rate_limited" } };
  }
  if (error) {
    console.error("Anonymous My Path analytics failed:", error.code ?? "unknown");
    return { status: 500, body: { error: "analytics_failed" } };
  }
  return { status: 202, body: { accepted: true } };
}

export async function recordAuthenticatedRadarMyPathEvent(
  client: MyPathRpcClient,
  input: unknown
): Promise<MutationResult> {
  const parsed = radarMyPathEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: "invalid_request", issues: parsed.error.flatten() },
    };
  }

  const auth = await client.auth.getUser();
  if (auth.error || !isAuthenticatedRadarUser(auth.data.user)) {
    return { status: 401, body: { error: "authentication_required" } };
  }
  if (!planningRegistry[parsed.data.careerSlug]) {
    return { status: 400, body: { error: "unknown_career" } };
  }

  const { data, error } = await client.rpc("apply_my_path_radar_event", {
    p_client_event_id: parsed.data.clientEventId,
    p_event_type: mapRadarFieldIntent(parsed.data.intent),
    p_career_slug: parsed.data.careerSlug,
    p_occurred_at: parsed.data.occurredAt,
  });
  if (error) {
    console.error("Radar My Path persistence failed:", error.code ?? "unknown");
    return { status: 500, body: { error: "persistence_failed" } };
  }

  return { status: 202, body: { accepted: true, data } };
}
