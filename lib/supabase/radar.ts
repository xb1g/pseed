import { createClient } from "@/utils/supabase/client";
import { isAnonymousUser } from "@/lib/supabase/auth";
import type { Database } from "./database.types";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];
type RadarReflectionInsert = Database["public"]["Tables"]["radar_reflections"]["Insert"];

const RADAR_SESSION_KEY = "radar_session_id";
const RADAR_PENDING_REFLECTIONS_KEY = "radar_pending_reflections";
let radarReflectionSyncInFlight: Promise<{ synced: number; remaining: number }> | null = null;

// ── Collections ────────────────────────────────────────────────

export async function getRadarCollections(): Promise<RadarCollection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("radar_collections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching radar collections:", error);
    throw new Error("Radar request failed");
  }

  return data || [];
}

// ── Fields ───────────────────────────────────────────────────────

export async function getRadarFields(
  filter?: { collectionTag?: string; search?: string }
): Promise<RadarField[]> {
  const supabase = createClient();

  let query = supabase
    .from("radar_fields")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (filter?.collectionTag) {
    query = query.contains("tags", [filter.collectionTag]);
  }

  if (filter?.search) {
    // Strip PostgREST filter meta-characters + LIKE wildcards so the user's
    // search term can never be parsed as filter syntax (injection guard).
    const safe = filter.search.replace(/[,.()*:%\\"]/g, " ").trim().slice(0, 64);
    if (safe) {
      query = query.or(
        `name_th.ilike.%${safe}%,name_en.ilike.%${safe}%,tagline_th.ilike.%${safe}%,tagline_en.ilike.%${safe}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching radar fields:", error);
    throw new Error("Failed to fetch radar fields");
  }

  return data || [];
}

export async function getRadarField(slug: string): Promise<RadarField | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("radar_fields")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching radar field:", error);
    throw new Error("Radar request failed");
  }

  return data;
}

// ── Cards ────────────────────────────────────────────────────────

export async function getRadarCards(fieldId: string): Promise<RadarCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("radar_cards")
    .select("*")
    .eq("field_id", fieldId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching radar cards:", error);
    throw new Error("Radar request failed");
  }

  return data || [];
}

// ── Sources ──────────────────────────────────────────────────────

export async function getRadarSources(fieldId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("radar_sources")
    .select("*")
    .eq("field_id", fieldId)
    .order("ref", { ascending: true });

  if (error) {
    console.error("Error fetching radar sources:", error);
    throw new Error("Radar request failed");
  }

  return data || [];
}

// ── Reflections ──────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(RADAR_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(RADAR_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export interface RadarReflectionData {
  fieldSlug: string;
  chapterKey?: string;
  wantToTry?: number | null;
  tags?: string[];
  responseText?: string;
  lang?: string;
}

export interface PendingRadarReflection extends RadarReflectionData {
  id: string;
  sessionId: string;
  createdAt: string;
}

function readPendingRadarReflections(): PendingRadarReflection[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(RADAR_PENDING_REFLECTIONS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PendingRadarReflection =>
        typeof item?.id === "string" &&
        typeof item?.sessionId === "string" &&
        typeof item?.fieldSlug === "string" &&
        typeof item?.createdAt === "string" &&
        (typeof item?.wantToTry === "number" ||
          item?.wantToTry === null ||
          typeof item?.wantToTry === "undefined")
    );
  } catch {
    return [];
  }
}

function writePendingRadarReflections(items: PendingRadarReflection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RADAR_PENDING_REFLECTIONS_KEY, JSON.stringify(items));
}

function toRadarReflectionInsert(
  reflection: PendingRadarReflection,
  userId: string
): RadarReflectionInsert {
  const wantToTry =
    typeof reflection.wantToTry === "number" &&
    reflection.wantToTry >= 1 &&
    reflection.wantToTry <= 5
      ? reflection.wantToTry
      : null;

  return {
    user_id: userId,
    session_id: reflection.sessionId,
    field_slug: reflection.fieldSlug,
    chapter_key: reflection.chapterKey || null,
    want_to_try: wantToTry,
    tags: reflection.tags || [],
    response_text: reflection.responseText?.slice(0, 500) || null,
    lang: reflection.lang || "th",
    created_at: reflection.createdAt,
  };
}

export function saveRadarReflectionLocally(
  data: RadarReflectionData
): PendingRadarReflection {
  const reflection: PendingRadarReflection = {
    ...data,
    id: crypto.randomUUID(),
    sessionId: getOrCreateSessionId(),
    createdAt: new Date().toISOString(),
  };

  writePendingRadarReflections([...readPendingRadarReflections(), reflection]);
  return reflection;
}

export async function syncPendingRadarReflections(): Promise<{
  synced: number;
  remaining: number;
}> {
  if (radarReflectionSyncInFlight) {
    return radarReflectionSyncInFlight;
  }

  radarReflectionSyncInFlight = syncPendingRadarReflectionsOnce().finally(() => {
    radarReflectionSyncInFlight = null;
  });

  return radarReflectionSyncInFlight;
}

async function syncPendingRadarReflectionsOnce(): Promise<{
  synced: number;
  remaining: number;
}> {
  const pending = readPendingRadarReflections();
  if (pending.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || isAnonymousUser(user)) {
    return { synced: 0, remaining: pending.length };
  }

  const syncedIds = new Set<string>();

  for (const reflection of pending) {
    const { error } = await supabase
      .from("radar_reflections")
      .insert(toRadarReflectionInsert(reflection, user.id));

    if (error) {
      console.error("Error submitting radar reflection:", error);
      continue;
    }

    syncedIds.add(reflection.id);
  }

  const remaining = readPendingRadarReflections().filter(
    (reflection) => !syncedIds.has(reflection.id)
  );
  writePendingRadarReflections(remaining);
  return { synced: syncedIds.size, remaining: remaining.length };
}

export async function submitRadarReflection(
  data: RadarReflectionData
): Promise<void> {
  saveRadarReflectionLocally(data);
  void syncPendingRadarReflections();
}
