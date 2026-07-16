import type { Metadata } from "next";

import { PlanExperience } from "@/components/my-path/PlanExperience";
import { isAnonymousUser } from "@/lib/supabase/auth";
import { resolvePlanEntry } from "@/lib/my-path/entries";
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
    "สำรวจเส้นทางอาชีพจากหลักฐานจริง เปรียบเทียบสิ่งที่ต้องเลือกแลก และเลือกก้าวเล็กๆ เพื่อรู้จักตัวเองมากขึ้น",
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string; resume?: string }>;
}) {
  const params = await searchParams;
  const entry = resolvePlanEntry(params.entry);
  const supabase = await createClient();
  const registrySlugs = Object.keys(planningRegistry);

  const [fieldsResult, authResult] = await Promise.all([
    supabase
      .from("radar_fields")
      .select(
        "id, slug, name_th, name_en, tagline_th, emoji, color, squad_url, research"
      )
      .eq("is_published", true)
      .in("slug", registrySlugs),
    supabase.auth.getUser(),
  ]);

  if (fieldsResult.error) {
    console.error("My Path could not load published Radar fields:", fieldsResult.error);
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

  const user = authResult.data.user;
  const isSignedIn = Boolean(user && !isAnonymousUser(user));
  const persistedState = isSignedIn
    ? await loadPersistedMyPath(supabase as unknown as MyPathReadClient)
    : null;

  return (
    <PlanExperience
      entry={entry}
      careers={careers}
      isSignedIn={isSignedIn}
      initialDraft={persistedState?.draft ?? null}
      initialEvidence={persistedState?.evidence ?? []}
      hasPersistedPath={persistedState?.hasPersistedPath ?? false}
      resumeRequested={params.resume === "1"}
    />
  );
}
