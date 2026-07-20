import type { Metadata } from "next";

import { PlanWizard } from "@/components/my-path/wizard/PlanWizard";
import { isAnonymousUser } from "@/lib/supabase/auth";
import { resolvePlanEntry } from "@/lib/my-path/entries";
import type { SeedPathlab } from "@/lib/my-path/pathlab-match";
import {
  buildCareerPreview,
  type RadarPreviewCard,
  type RadarPreviewField,
} from "@/lib/my-path/radar-content";
import { planningRegistry } from "@/lib/my-path/registry";
import {
  loadPersistedMyPath,
  type MyPathReadClient,
} from "@/lib/my-path/server-read";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Path | PassionSeed",
  description:
    "ออกแบบชีวิตของคุณใน 2–4 เดือน — โปรเจคชูโรงใส่พอร์ต งานแข่งใส่พอร์ต งานเพื่อสังคม และเรื่องเล่าที่เทคนิคสอบสัมภาษณ์ เพื่อมหาวิทยาลัยในไทม์ไลน์ของคุณ",
};

interface SeedRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: { name: string | null } | Array<{ name: string | null }> | null;
  path: { total_days: number | null } | Array<{ total_days: number | null }> | null;
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string; resume?: string }>;
}) {
  const params = await searchParams;
  const entry = resolvePlanEntry(params.entry);
  const supabase = await createClient();
  const registrySlugs = Object.keys(planningRegistry);

  const [fieldsResult, seedsResult, authResult] = await Promise.all([
    supabase
      .from("radar_fields")
      .select(
        "id, slug, name_th, name_en, tagline_th, emoji, color, squad_url, research"
      )
      .eq("is_published", true)
      .in("slug", registrySlugs),
    supabase
      .from("seeds")
      .select(
        "id, title, description, cover_image_url, category:seed_categories(name), path:paths(total_days)"
      )
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (fieldsResult.error) {
    console.error("My Path could not load published Radar fields:", fieldsResult.error);
  }

  if (seedsResult.error) {
    console.error("My Path could not load PathLab seeds:", seedsResult.error);
  }

  const fields = (fieldsResult.data ?? []) as Array<RadarPreviewField & { id: string }>;
  const cardsResult = fields.length
    ? await supabase
        .from("radar_cards")
        .select("field_id, kind, content_th")
        .in(
          "field_id",
          fields.map((field) => field.id)
        )
        .in("kind", [
          "dayInLife",
          "fantasyReality",
          "risks",
          "aiImpact",
          "entryRoutes",
        ])
        .eq("is_hidden", false)
    : { data: [], error: null };

  if (cardsResult.error) {
    console.error("My Path could not load Radar preview cards:", cardsResult.error);
  }

  const cardsByField = new Map<string, RadarPreviewCard[]>();
  for (const card of cardsResult.data ?? []) {
    const current = cardsByField.get(card.field_id) ?? [];
    current.push({ kind: card.kind, content_th: card.content_th });
    cardsByField.set(card.field_id, current);
  }

  const entryOrder = new Map(
    entry.initialSlugs.map((slug, index) => [slug, index])
  );
  const careers = fields
    .map((field) => buildCareerPreview(field, cardsByField.get(field.id) ?? []))
    .sort((a, b) => {
      const entryA = entryOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const entryB = entryOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      return entryA - entryB || a.titleTh.localeCompare(b.titleTh, "th");
    });

  // Supabase joins can return a single object or an array depending on the relation.
  const seeds = ((seedsResult.data ?? []) as SeedRow[]).map((row): SeedPathlab => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    const path = Array.isArray(row.path) ? row.path[0] : row.path;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      categoryName: category?.name ?? null,
      totalDays: path?.total_days ?? null,
    };
  });

  const user = authResult.data.user;
  const isSignedIn = Boolean(user && !isAnonymousUser(user));
  const persistedState = isSignedIn
    ? await loadPersistedMyPath(supabase as unknown as MyPathReadClient)
    : null;

  return (
    <PlanWizard
      careers={careers}
      seeds={seeds}
      isSignedIn={isSignedIn}
      initialDraft={persistedState?.draft ?? null}
      hasPersistedPath={persistedState?.hasPersistedPath ?? false}
    />
  );
}
