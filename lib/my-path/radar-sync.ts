import { z } from "zod";

import { planningRegistry } from "./registry";
import type { JourneyEventType } from "./types";

export const RADAR_MY_PATH_QUEUE_KEY = "my_path_pending_radar_events_v1";

export const radarFieldIntentSchema = z.enum([
  "opened",
  "interested",
  "saved",
  "not_interested",
  "dismissed",
]);

export type RadarFieldIntent = z.infer<typeof radarFieldIntentSchema>;
export type RadarIntentScope = "start-option" | "field";

export const radarMyPathEventSchema = z.object({
  clientEventId: z
    .string()
    .min(6)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/),
  careerSlug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  intent: radarFieldIntentSchema,
  occurredAt: z.string().datetime({ offset: true }),
});

export type RadarMyPathEvent = z.infer<typeof radarMyPathEventSchema>;

export interface RadarQueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface RadarAuthUser {
  id: string;
  is_anonymous?: boolean;
  email?: string | null;
  aud?: string;
  app_metadata?: { provider?: unknown };
  identities?: Array<{ provider?: string }> | null;
}

interface CreateRadarMyPathEventOptions {
  createId?: () => string;
  now?: () => string;
}

export function mapRadarFieldIntent(intent: RadarFieldIntent): JourneyEventType {
  switch (intent) {
    case "opened":
      return "radar_profile_opened";
    case "interested":
    case "saved":
      return "career_saved";
    case "not_interested":
    case "dismissed":
      return "career_removed";
  }
}

export function routeRadarCardIntent({
  scope,
  buttonLabel,
  recordAnalytics,
  recordCanonical,
}: {
  scope?: RadarIntentScope;
  buttonLabel?: string;
  recordAnalytics: () => void;
  recordCanonical: (intent: RadarFieldIntent) => void;
}) {
  recordAnalytics();
  if (scope !== "field") return;

  const intent = radarFieldIntentSchema.safeParse(
    buttonLabel?.replace("-", "_")
  );
  if (intent.success) recordCanonical(intent.data);
}

function createClientEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `radar:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function createRadarMyPathEvent(
  input: { careerSlug: string; intent: RadarFieldIntent },
  options: CreateRadarMyPathEventOptions = {}
): RadarMyPathEvent | null {
  if (!planningRegistry[input.careerSlug]) return null;

  return {
    clientEventId: (options.createId ?? createClientEventId)(),
    careerSlug: input.careerSlug,
    intent: input.intent,
    occurredAt: (options.now ?? (() => new Date().toISOString()))(),
  };
}

function readQueue(storage: RadarQueueStorage): RadarMyPathEvent[] {
  try {
    const raw = storage.getItem(RADAR_MY_PATH_QUEUE_KEY);
    if (!raw) return [];
    const parsed = z.array(radarMyPathEventSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function writeQueue(storage: RadarQueueStorage, events: RadarMyPathEvent[]) {
  storage.setItem(RADAR_MY_PATH_QUEUE_KEY, JSON.stringify(events));
}

export function enqueueRadarMyPathEvent(
  storage: RadarQueueStorage,
  event: RadarMyPathEvent
) {
  const queue = readQueue(storage);
  if (queue.some((pending) => pending.clientEventId === event.clientEventId)) {
    return;
  }
  writeQueue(storage, [...queue, event]);
}

export function isAuthenticatedRadarUser(
  user: RadarAuthUser | null | undefined
): user is RadarAuthUser {
  if (!user) return false;

  const providers = new Set<string>();
  if (typeof user.app_metadata?.provider === "string") {
    providers.add(user.app_metadata.provider);
  }
  user.identities?.forEach((identity) => {
    if (typeof identity.provider === "string") providers.add(identity.provider);
  });

  const hasDurableCredential = Boolean(user.email?.trim());
  const hasDurableProvider = [...providers].some(
    (provider) => provider !== "anonymous"
  );
  if (hasDurableCredential || hasDurableProvider) return true;

  return !(
    user.is_anonymous === true ||
    providers.has("anonymous") ||
    user.aud === "anonymous"
  );
}

export async function flushRadarMyPathEvents({
  storage,
  isAuthenticated,
  postEvent,
}: {
  storage: RadarQueueStorage;
  isAuthenticated: () => Promise<boolean>;
  postEvent: (event: RadarMyPathEvent) => Promise<boolean>;
}): Promise<{ synced: number; remaining: number }> {
  if (!(await isAuthenticated())) {
    return { synced: 0, remaining: readQueue(storage).length };
  }

  let synced = 0;
  for (const event of readQueue(storage)) {
    let accepted = false;
    try {
      accepted = await postEvent(event);
    } catch {
      break;
    }
    if (!accepted) continue;

    const latestQueue = readQueue(storage);
    writeQueue(
      storage,
      latestQueue.filter(
        (pending) => pending.clientEventId !== event.clientEventId
      )
    );
    synced += 1;
  }

  return { synced, remaining: readQueue(storage).length };
}

function browserStorage(): RadarQueueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let browserSyncInFlight: Promise<{ synced: number; remaining: number }> | null =
  null;

export async function syncPendingRadarMyPathEvents(): Promise<{
  synced: number;
  remaining: number;
}> {
  if (browserSyncInFlight) return browserSyncInFlight;

  const storage = browserStorage();
  if (!storage) return { synced: 0, remaining: 0 };

  browserSyncInFlight = flushRadarMyPathEvents({
    storage,
    async isAuthenticated() {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return !error && isAuthenticatedRadarUser(user);
    },
    async postEvent(event) {
      const response = await fetch("/api/my-path/radar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });
      return response.ok;
    },
  }).finally(() => {
    browserSyncInFlight = null;
  });

  return browserSyncInFlight;
}

export function recordRadarMyPathIntent(input: {
  careerSlug: string;
  intent: RadarFieldIntent;
}): RadarMyPathEvent | null {
  const storage = browserStorage();
  if (!storage) return null;

  const event = createRadarMyPathEvent(input);
  if (!event) return null;
  enqueueRadarMyPathEvent(storage, event);
  void syncPendingRadarMyPathEvents();
  return event;
}
