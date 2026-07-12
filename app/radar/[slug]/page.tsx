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
    .eq("is_hidden", false)
    .order("position", { ascending: true });

  if (cardsError) {
    console.error("Error loading Radar cards:", cardsError);
    throw new Error("Radar request failed");
  }

  const { data: sources } = await supabase
    .from("radar_sources")
    .select("ref, title, publisher, url")
    .eq("field_id", field.id)
    .order("ref", { ascending: true });

  const radarData = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: fieldSkills, error: skillsError } = await radarData
    .from("radar_field_skills")
    .select(
      "is_primary, sort_order, radar_skills!inner(id, slug, name_th, name_en, description_th, is_published, radar_skill_start_options(id, kind, title_th, summary_th, provider, destination_url, destination_ref, metadata, sort_order, is_published))"
    )
    .eq("field_id", field.id);

  if (skillsError) {
    console.error("Error loading Radar skills:", skillsError);
  }

  const initialSkills = (fieldSkills ?? [])
    .map((relation) => {
      const skill = relation.radar_skills as Record<string, unknown> | undefined;
      if (!skill || skill.is_published !== true) return null;
      const options = Array.isArray(skill.radar_skill_start_options)
        ? skill.radar_skill_start_options
            .filter((option) => (option as Record<string, unknown>).is_published === true)
            .sort(
              (a, b) =>
                Number((a as Record<string, unknown>).sort_order ?? 0) -
                Number((b as Record<string, unknown>).sort_order ?? 0)
            )
        : [];
      return {
        id: String(skill.id),
        slug: String(skill.slug),
        name_th: String(skill.name_th),
        name_en: String(skill.name_en),
        description_th:
          typeof skill.description_th === "string" ? skill.description_th : null,
        is_primary: relation.is_primary === true,
        start_options: options,
        sort_order: Number(relation.sort_order ?? 0),
      };
    })
    .filter((skill): skill is NonNullable<typeof skill> => skill !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

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
