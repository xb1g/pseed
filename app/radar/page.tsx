import { RadarPageClient } from "@/components/radar/RadarPageClient";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/utils/supabase/server";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const supabase = await createClient();

  const [fieldsResult, collectionsResult] = await Promise.all([
    supabase
      .from("radar_fields")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("radar_collections")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const error = fieldsResult.error || collectionsResult.error;
  if (error) {
    console.error("Error loading Radar page:", error);
  }

  return (
    <RadarPageClient
      initialFields={(fieldsResult.data || []) as RadarField[]}
      initialCollections={(collectionsResult.data || []) as RadarCollection[]}
      initialError={error ? "Radar request failed" : null}
    />
  );
}
