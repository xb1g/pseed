import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

async function loadPublishedRadarField(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("radar_fields")
    .select("*, radar_cards(*), radar_sources(ref, title, publisher, url)")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("radar_cards.is_hidden", false)
    .order("position", { referencedTable: "radar_cards", ascending: true })
    .order("ref", { referencedTable: "radar_sources", ascending: true })
    .maybeSingle();

  if (error) {
    console.error("Error loading Radar field:", error);
    throw new Error("Radar request failed");
  }

  return data;
}

export const getCachedPublishedRadarField = unstable_cache(
  loadPublishedRadarField,
  // Keep this version aligned with material backfills to published card JSON.
  // v5 invalidates entries created before the market ticket, faculty-route,
  // and locale-specific field-name backfills were synchronized.
  ["published-radar-field-v5"],
  { revalidate: 300, tags: ["published-radar-fields"] }
);
