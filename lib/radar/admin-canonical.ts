import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export class RadarCanonicalReadError extends Error {}

export async function listCanonicalRadarFields(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("radar_fields")
    .select("id, slug, name_th, name_en, tagline_th, tagline_en, emoji, color, tags, is_published, updated_at")
    .order("sort_order", { ascending: true });

  if (error) throw new RadarCanonicalReadError(error.message);
  return data ?? [];
}

export async function loadCanonicalRadarField(
  supabase: SupabaseClient,
  fieldId: string
) {
  const [fieldResult, cardsResult] = await Promise.all([
    supabase.from("radar_fields").select("*").eq("id", fieldId).maybeSingle(),
    supabase
      .from("radar_cards")
      .select("*")
      .eq("field_id", fieldId)
      .order("position", { ascending: true }),
  ]);

  if (fieldResult.error) {
    throw new RadarCanonicalReadError(fieldResult.error.message);
  }
  if (cardsResult.error) {
    throw new RadarCanonicalReadError(cardsResult.error.message);
  }
  if (!fieldResult.data) return null;

  return { field: fieldResult.data, cards: cardsResult.data ?? [] };
}
