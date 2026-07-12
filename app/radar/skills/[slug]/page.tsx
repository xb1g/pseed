import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  RadarSkillExperience,
  type RadarSkillSummary,
} from "@/components/radar/RadarSkillExperience";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function RadarSkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const radarData = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string | boolean) => {
          eq: (column: string, value: string | boolean) => {
            maybeSingle: () => Promise<{
              data: Record<string, unknown> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };

  const { data: skill, error } = await radarData
    .from("radar_skills")
    .select(
      "id, slug, name_th, name_en, description_th, description_en, radar_field_skills(is_primary, radar_fields(id, slug, name_th, emoji, is_published)), radar_skill_start_options(id, kind, title_th, summary_th, provider, destination_url, destination_ref, metadata, sort_order, is_published)"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw new Error("Radar skill request failed");
  if (!skill) notFound();

  const startOptions = Array.isArray(skill.radar_skill_start_options)
    ? skill.radar_skill_start_options.filter(
        (option) => (option as Record<string, unknown>).is_published === true
      )
    : [];
  const relatedFields = Array.isArray(skill.radar_field_skills)
    ? skill.radar_field_skills
        .map((relation) => (relation as Record<string, unknown>).radar_fields)
        .filter(
          (field): field is Record<string, unknown> =>
            !!field && (field as Record<string, unknown>).is_published === true
        )
    : [];
  const summary: RadarSkillSummary = {
    id: String(skill.id),
    slug: String(skill.slug),
    name_th: String(skill.name_th),
    name_en: String(skill.name_en),
    description_th:
      typeof skill.description_th === "string" ? skill.description_th : null,
    is_primary: true,
    start_options: startOptions as RadarSkillSummary["start_options"],
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/radar"
          className="inline-flex min-h-12 items-center gap-2 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไป Career Radar
        </Link>
        <header className="mt-8">
          <p className="text-sm font-semibold text-sky-300">Skill focus</p>
          <h1 className="mt-2 text-4xl font-bold">{String(skill.name_th)}</h1>
          <p className="mt-1 text-neutral-500">{String(skill.name_en)}</p>
          {typeof skill.description_th === "string" && (
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-neutral-300">
              {skill.description_th}
            </p>
          )}
        </header>
        {relatedFields.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">งานที่ใช้ทักษะนี้</h2>
            <div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 px-4">
              {relatedFields.map((field) => (
                <Link
                  key={String(field.id)}
                  href={`/radar/${String(field.slug)}`}
                  className="flex min-h-16 items-center justify-between py-3"
                >
                  <span className="font-semibold">
                    {String(field.emoji ?? "◌")} {String(field.name_th)}
                  </span>
                  <span className="text-sm text-sky-300">ดูอาชีพ</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        {startOptions.length > 0 && (
          <div className="mt-10">
            <RadarSkillExperience skills={[summary]} accent="#7dd3fc" />
          </div>
        )}
      </div>
    </main>
  );
}
