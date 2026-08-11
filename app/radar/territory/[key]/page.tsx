import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RadarTerritoryExperience } from "@/components/radar/RadarTerritoryExperience";
import { getCachedTerritory } from "@/lib/radar/territory";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const territory = await getCachedTerritory(key);
  if (!territory) return { title: "Radar | PassionSeed" };

  return {
    title: `${territory.label_th} | Radar`,
    description: `${territory.professions.length} อาชีพที่ทำให้ธุรกิจเดินได้ ส่วนใหญ่ไม่เคยมีใครเล่าให้ฟัง`,
  };
}

export default async function RadarTerritoryPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const territory = await getCachedTerritory(key);

  if (!territory || territory.professions.length === 0) notFound();

  return <RadarTerritoryExperience territory={territory} />;
}
