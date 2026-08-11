import { notFound, redirect } from "next/navigation";
import { RadarFieldPageClient } from "@/components/radar/RadarFieldPageClient";
import type { RadarSkillSummary } from "@/components/radar/RadarSkillExperience";
import type { Database } from "@/lib/supabase/database.types";
import { getCachedPublishedRadarField } from "@/lib/radar/server";
import {
  isTerritoryIndex,
  loadSkillsByField,
  loadStartOptionsBySkill,
  territoryKeyOf,
} from "@/lib/radar/territory";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];

export const revalidate = 300;

/**
 * Skill rail for a legacy field page. Both loads fail soft, so a field whose
 * skills are unmapped renders exactly as it did before.
 */
async function loadFieldSkills(fieldId: string): Promise<RadarSkillSummary[]> {
  const skills = (await loadSkillsByField([fieldId])).get(fieldId) ?? [];
  if (skills.length === 0) return [];

  const startOptions = await loadStartOptionsBySkill(skills.map((skill) => skill.id));

  return skills.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    name_th: skill.name_th,
    name_en: skill.name_en,
    description_th: skill.description_th,
    is_primary: skill.is_primary,
    start_options: startOptions.get(skill.id) ?? [],
  }));
}

export default async function RadarFieldPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ slug }, { from }] = await Promise.all([params, searchParams]);
  const fieldResult = await getCachedPublishedRadarField(slug);

  if (!fieldResult) {
    notFound();
  }

  const {
    radar_cards: cards,
    radar_sources: sources,
    ...field
  } = fieldResult;

  // Two routes into a territory: its grid tile, and any profession deep-linked
  // from outside. Professions are 30-second discovery units with no cards of
  // their own, so both land on the deck that can actually render them.
  const territoryKey = territoryKeyOf(field.research);
  if (territoryKey && (isTerritoryIndex(field.research) || (cards ?? []).length === 0)) {
    redirect(`/radar/territory/${territoryKey}`);
  }

  const initialSkills = await loadFieldSkills(field.id);

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
      initialSkills={initialSkills}
      fromPlan={from === "plan"}
    />
  );
}
