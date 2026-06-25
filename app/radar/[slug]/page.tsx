import { notFound } from "next/navigation";
import { RadarFieldPageClient } from "@/components/radar/RadarFieldPageClient";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/utils/supabase/server";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];

export const dynamic = "force-dynamic";

export default async function RadarFieldPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: field, error: fieldError } = await supabase
    .from("radar_fields")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (fieldError) {
    console.error("Error loading Radar field:", fieldError);
    throw new Error("Radar request failed");
  }

  if (!field) {
    notFound();
  }

  const { data: cards, error: cardsError } = await supabase
    .from("radar_cards")
    .select("*")
    .eq("field_id", field.id)
    .order("position", { ascending: true });

  if (cardsError) {
    console.error("Error loading Radar cards:", cardsError);
    throw new Error("Radar request failed");
  }

  return (
    <RadarFieldPageClient
      initialField={field as RadarField}
      initialCards={(cards || []) as RadarCard[]}
    />
  );
}
