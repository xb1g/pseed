import "server-only";

import { unstable_cache } from "next/cache";
import { isRadarPreview, radarReadClient, wherePublished } from "@/lib/radar/preview";

/**
 * A territory is a `radar_collections` key. Professions are `radar_fields`
 * carrying that key in `tags[]`, and their discovery copy lives in
 * `radar_fields.research->'territory'`.
 *
 * Professions are deliberately thin: a reveal, a fantasy/reality pair, and the
 * durable skills underneath. Day-in-life, salary and entry-route depth belongs
 * to the paid PathLab, not to a free browse surface.
 */

export type TerritoryCopy = {
  collection: string | null;
  /** True for the grid tile that stands in for the whole territory. */
  is_index: boolean;
  reveal_th: string;
  fantasy_th: string | null;
  reality_th: string | null;
  sits_th: string | null;
  is_composite: boolean;
};

export type TerritoryStartOption = {
  id: string;
  kind: "youtube" | "resource" | "course" | "pathlab" | "project" | "community";
  title_th: string;
  summary_th: string | null;
  provider: string | null;
  destination_url: string | null;
  destination_ref: string | null;
  metadata: Record<string, unknown>;
};

export type TerritorySkillRef = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  is_primary: boolean;
};

export type TerritoryProfession = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  tagline_th: string;
  emoji: string;
  color: string;
  copy: TerritoryCopy;
  skills: TerritorySkillRef[];
};

export type Territory = {
  key: string;
  label_th: string;
  label_en: string;
  professions: TerritoryProfession[];
  composite: TerritoryProfession | null;
  skills: TerritorySkillRef[];
  /**
   * Where the territory sends someone who is interested. Deduped across the
   * spine's skills, because one PathLab covers the whole territory rather than
   * one skill at a time.
   */
  startOptions: TerritoryStartOption[];
};


export function readTerritoryCopy(research: unknown): TerritoryCopy | null {
  if (!research || typeof research !== "object") return null;
  const territory = (research as Record<string, unknown>).territory;
  if (!territory || typeof territory !== "object") return null;

  const raw = territory as Record<string, unknown>;
  const reveal = typeof raw.reveal_th === "string" ? raw.reveal_th.trim() : "";
  if (!reveal) return null;

  const optional = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : null;

  return {
    collection: optional(raw.collection),
    is_index: raw.is_index === true,
    reveal_th: reveal,
    fantasy_th: optional(raw.fantasy_th),
    reality_th: optional(raw.reality_th),
    sits_th: optional(raw.sits_th),
    is_composite: raw.is_composite === true,
  };
}

/**
 * The territory key a profession belongs to, or null if it is a legacy
 * encyclopedia-style field. Used to route thin professions away from the
 * card renderer, which has nothing to render for them.
 */
export function territoryKeyOf(research: unknown): string | null {
  return readTerritoryCopy(research)?.collection ?? null;
}

/**
 * True for a profession that belongs to a territory. These are reachable
 * through the territory deck, never as their own tile on the Radar grid: the
 * reveal is the whole payload and a tile cannot carry it, and the composite
 * closer must not be met before the jobs it is made of.
 */
export function isTerritoryMember(research: unknown): boolean {
  const copy = readTerritoryCopy(research);
  return copy !== null && !copy.is_index;
}

/** True for the single grid tile that stands in for a whole territory. */
export function isTerritoryIndex(research: unknown): boolean {
  return readTerritoryCopy(research)?.is_index === true;
}

/**
 * Published start options per skill. Fails soft for the same reason as
 * loadSkillsByField: a missing terminus degrades the page, it must not kill it.
 */
export async function loadStartOptionsBySkill(
  skillIds: string[]
): Promise<Map<string, TerritoryStartOption[]>> {
  const bySkill = new Map<string, TerritoryStartOption[]>();
  if (skillIds.length === 0) return bySkill;

  const { data, error } = await wherePublished(
    radarReadClient()
      .from("radar_skill_start_options")
      .select(
        "id, skill_id, kind, title_th, summary_th, provider, destination_url, destination_ref, metadata, sort_order"
      )
      .in("skill_id", skillIds)
  ).order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading radar start options:", error);
    return bySkill;
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const skillId = String(row.skill_id);
    const list = bySkill.get(skillId) ?? [];
    list.push({
      id: String(row.id),
      kind: row.kind as TerritoryStartOption["kind"],
      title_th: String(row.title_th),
      summary_th: typeof row.summary_th === "string" ? row.summary_th : null,
      provider: typeof row.provider === "string" ? row.provider : null,
      destination_url:
        typeof row.destination_url === "string" ? row.destination_url : null,
      destination_ref:
        typeof row.destination_ref === "string" ? row.destination_ref : null,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    });
    bySkill.set(skillId, list);
  }

  return bySkill;
}

/**
 * Skills per profession. Fails soft: a territory that renders without its skill
 * spine is degraded, but a territory that 500s is gone.
 */
export async function loadSkillsByField(
  fieldIds: string[]
): Promise<Map<string, TerritorySkillRef[]>> {
  const byField = new Map<string, TerritorySkillRef[]>();
  if (fieldIds.length === 0) return byField;

  const { data, error } = await radarReadClient()
    .from("radar_field_skills")
    .select(
      "field_id, is_primary, sort_order, radar_skills(id, slug, name_th, name_en, description_th, is_published)"
    )
    .in("field_id", fieldIds)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading radar field skills:", error);
    return byField;
  }

  for (const row of data ?? []) {
    const link = row as Record<string, unknown>;
    const skill = link.radar_skills as Record<string, unknown> | null;
    if (!skill) continue;
    if (!isRadarPreview() && skill.is_published !== true) continue;

    const fieldId = String(link.field_id);
    const list = byField.get(fieldId) ?? [];
    list.push({
      id: String(skill.id),
      slug: String(skill.slug),
      name_th: String(skill.name_th),
      name_en: String(skill.name_en),
      description_th:
        typeof skill.description_th === "string" ? skill.description_th : null,
      is_primary: link.is_primary === true,
    });
    byField.set(fieldId, list);
  }

  return byField;
}

async function loadTerritory(key: string): Promise<Territory | null> {
  const supabase = radarReadClient();

  const [collectionResult, fieldsResult] = await Promise.all([
    supabase
      .from("radar_collections")
      .select("key, label_th, label_en")
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle(),
    wherePublished(
      supabase
        .from("radar_fields")
        .select("id, slug, name_th, name_en, tagline_th, emoji, color, research")
        .contains("tags", [key])
    ).order("sort_order", { ascending: true }),
  ]);

  if (collectionResult.error) {
    console.error("Error loading radar territory:", collectionResult.error);
    throw new Error("Radar territory request failed");
  }
  if (!collectionResult.data) return null;

  if (fieldsResult.error) {
    console.error("Error loading radar territory fields:", fieldsResult.error);
    throw new Error("Radar territory request failed");
  }

  const rows = (fieldsResult.data ?? []) as Record<string, unknown>[];
  const withCopy = rows
    .map((row) => ({ row, copy: readTerritoryCopy(row.research) }))
    .filter(
      (entry): entry is { row: Record<string, unknown>; copy: TerritoryCopy } =>
        entry.copy !== null
    );

  const skillsByField = await loadSkillsByField(
    withCopy.map((entry) => String(entry.row.id))
  );

  const all: TerritoryProfession[] = withCopy.map(({ row, copy }) => ({
    id: String(row.id),
    slug: String(row.slug),
    name_th: String(row.name_th),
    name_en: String(row.name_en),
    tagline_th: String(row.tagline_th ?? ""),
    emoji: String(row.emoji ?? "✨"),
    color: String(row.color ?? "#f59e0b"),
    copy,
    skills: skillsByField.get(String(row.id)) ?? [],
  }));

  // The composite (e.g. Founder) is the closer, not a peer. It is pulled out of
  // the deck so it can never be met before the parts it is made of.
  const composite = all.find((profession) => profession.copy.is_composite) ?? null;
  const professions = all.filter((profession) => !profession.copy.is_composite);

  const skills = new Map<string, TerritorySkillRef>();
  for (const profession of all) {
    for (const skill of profession.skills) {
      const existing = skills.get(skill.slug);
      if (!existing || (skill.is_primary && !existing.is_primary)) {
        skills.set(skill.slug, skill);
      }
    }
  }

  const spine = [...skills.values()];
  const optionsBySkill = await loadStartOptionsBySkill(spine.map((skill) => skill.id));
  const startOptions: TerritoryStartOption[] = [];
  const seenDestinations = new Set<string>();
  for (const list of optionsBySkill.values()) {
    for (const option of list) {
      const destination = option.destination_url ?? option.destination_ref ?? option.id;
      if (seenDestinations.has(destination)) continue;
      seenDestinations.add(destination);
      startOptions.push(option);
    }
  }

  const collection = collectionResult.data as Record<string, unknown>;

  return {
    key,
    label_th: String(collection.label_th ?? key),
    label_en: String(collection.label_en ?? key),
    professions,
    composite,
    skills: spine,
    startOptions,
  };
}

export const getCachedTerritory = unstable_cache(
  loadTerritory,
  ["radar-territory-v1", String(isRadarPreview())],
  {
    revalidate: 300,
    tags: ["radar-territories"],
  }
);

export type SkillIndexEntry = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  professions: { slug: string; name_th: string; emoji: string }[];
};

/**
 * Every published skill plus the professions it runs. This is the answer to
 * "a job is a skillset": one skill, many jobs, most of them unfamiliar.
 */
async function loadSkillIndex(): Promise<SkillIndexEntry[]> {
  const supabase = radarReadClient();

  const { data: skillRows, error: skillError } = await wherePublished(
    supabase.from("radar_skills").select("id, slug, name_th, name_en, description_th")
  ).order("slug", { ascending: true });

  // Soft-fail: /radar/skills is a static route, so a throw here would take down
  // the whole production build. The page renders its empty state instead.
  if (skillError) {
    console.error("Error loading radar skill index:", skillError);
    return [];
  }

  const skills = (skillRows ?? []) as Record<string, unknown>[];
  if (skills.length === 0) return [];

  const { data: hopRows, error: hopError } = await supabase
    .from("radar_skill_jobs")
    .select("skill_id, sort_order, radar_fields(slug, name_th, emoji, is_published)")
    .in("skill_id", skills.map((skill) => String(skill.id)))
    .order("sort_order", { ascending: true });

  if (hopError) {
    console.error("Error loading radar skill jobs:", hopError);
  }

  const bySkill = new Map<string, SkillIndexEntry["professions"]>();
  for (const row of (hopRows ?? []) as Record<string, unknown>[]) {
    const field = row.radar_fields as Record<string, unknown> | null;
    if (!field) continue;
    if (!isRadarPreview() && field.is_published !== true) continue;

    const skillId = String(row.skill_id);
    const list = bySkill.get(skillId) ?? [];
    list.push({
      slug: String(field.slug),
      name_th: String(field.name_th),
      emoji: String(field.emoji ?? "✨"),
    });
    bySkill.set(skillId, list);
  }

  return skills.map((skill) => ({
    id: String(skill.id),
    slug: String(skill.slug),
    name_th: String(skill.name_th),
    name_en: String(skill.name_en),
    description_th:
      typeof skill.description_th === "string" ? skill.description_th : null,
    professions: bySkill.get(String(skill.id)) ?? [],
  }));
}

export const getCachedSkillIndex = unstable_cache(
  loadSkillIndex,
  ["radar-skill-index-v1", String(isRadarPreview())],
  {
    revalidate: 300,
    tags: ["radar-territories"],
  }
);
