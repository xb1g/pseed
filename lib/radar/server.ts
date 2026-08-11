import "server-only";

import { unstable_cache } from "next/cache";
import {
  isRadarPreview,
  radarReadClient,
  wherePublished,
} from "@/lib/radar/preview";
import type { Database } from "@/lib/supabase/database.types";

async function loadPublishedRadarField(slug: string) {
  const supabase = radarReadClient<Database>();
  const { data, error } = await wherePublished(
    supabase
      .from("radar_fields")
      .select("*, radar_cards(*), radar_sources(ref, title, publisher, url)")
      .eq("slug", slug)
  )
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
  // v6 invalidates entries created before the Jul 2026 P0/P1 content pass
  // (salary reconciliation, source cleanup, AI-impact scores, jargon glosses)
  // and the CTA card resource links.
  ["published-radar-field-v6", String(isRadarPreview())],
  { revalidate: 300, tags: ["published-radar-fields"] }
);
