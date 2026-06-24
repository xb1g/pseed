import { createClient } from "@/utils/supabase/client";
import type { Database } from "./database.types";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];
type RadarReflectionInsert = Database["public"]["Tables"]["radar_reflections"]["Insert"];

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
    throw new Error(error.message);
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
    query = query.or(
      `name_th.ilike.%${filter.search}%,name_en.ilike.%${filter.search}%,tagline_th.ilike.%${filter.search}%,tagline_en.ilike.%${filter.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching radar fields:", error);
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return data || [];
}

// ── Reflections ──────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("radar_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("radar_session_id", sessionId);
  }
  return sessionId;
}

export interface RadarReflectionData {
  fieldSlug: string;
  chapterKey?: string;
  wantToTry: number;
  tags?: string[];
  responseText?: string;
  lang?: string;
}

export async function submitRadarReflection(
  data: RadarReflectionData
): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionId = getOrCreateSessionId();

  const payload: RadarReflectionInsert = {
    user_id: user?.id || "",
    session_id: sessionId,
    field_slug: data.fieldSlug,
    chapter_key: data.chapterKey || null,
    want_to_try: data.wantToTry,
    tags: data.tags || null,
    response_text: data.responseText || null,
    lang: data.lang || "th",
  };

  const { error } = await supabase.from("radar_reflections").insert(payload);

  if (error) {
    console.error("Error submitting radar reflection:", error);
    throw new Error(error.message);
  }
}
