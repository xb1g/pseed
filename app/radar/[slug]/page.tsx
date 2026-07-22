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

  const [cardsResult, sourcesResult] = await Promise.all([
    supabase
      .from("radar_cards")
      .select("*")
      .eq("field_id", field.id)
      .eq("is_hidden", false)
      .order("position", { ascending: true }),
    supabase
      .from("radar_sources")
      .select("ref, title, publisher, url")
      .eq("field_id", field.id)
      .order("ref", { ascending: true }),
  ]);

  const { data: cards, error: cardsError } = cardsResult;

  if (cardsError) {
    console.error("Error loading Radar cards:", cardsError);
    throw new Error("Radar request failed");
  }

  const { data: sources, error: sourcesError } = sourcesResult;

  if (sourcesError) {
    console.error("Error loading Radar sources:", sourcesError);
  }

  // TODO: Enable when radar_skills FK relationship is set up
  const initialSkills: never[] = [];

  // Inject score card at position 2 from field-level score/tier + research metrics
  const allCards = [...(cards || [])] as RadarCard[];
  const research = field.research as Record<string, unknown> | null;
  if (field.score != null && research?.metrics) {
    const scoreCard = {
      id: "__score__",
      field_id: field.id,
      kind: "careerSurvival",
      position: -1,
      content_th: {
        title: "แนวโน้มอาชีพนี้เป็นอย่างไร?",
        metrics: research.metrics,
        global_metrics: research.global_metrics,
        metric_details: research.metric_details,
        global_metric_details: research.global_metric_details,
        tier: field.tier,
        reasoning: research.reasoning,
      },
      content_en: null,
      image_url: null,
      image_prompt: null,
      image_credit: null,
      image_license: null,
      image_alt_th: null,
      image_alt_en: null,
      created_at: field.created_at,
      updated_at: field.updated_at,
    } as unknown as RadarCard;
    const insertIdx = allCards.length > 0 ? 1 : 0;
    allCards.splice(insertIdx, 0, scoreCard);
  }

  return (
    <RadarFieldPageClient
      initialField={field as RadarField}
      initialCards={allCards}
      fieldSources={sources ?? []}
      initialSkills={initialSkills as never}
    />
  );
}
