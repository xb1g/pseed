import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCachedSkillIndex } from "@/lib/radar/territory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ทักษะ | Radar",
  description: "งานเปลี่ยนชื่อได้ ทักษะไม่เปลี่ยน ดูว่าทักษะหนึ่งอันไปโผล่ที่งานไหนบ้าง",
};

export default async function RadarSkillsPage() {
  const skills = await getCachedSkillIndex();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:pt-16">
      <header>
        <Link
          href="/radar"
          className="inline-flex min-h-11 items-center text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← Radar
        </Link>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">ทักษะ</h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg">
          อาชีพไม่ใช่ตำแหน่ง มันคือชุดทักษะที่ใช้ในสถานการณ์หนึ่ง
          ทักษะเดียวกันไปโผล่ในงานที่คุณไม่เคยคิดว่าเกี่ยวกัน
        </p>
      </header>

      {skills.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-neutral-400">
          ยังไม่มีทักษะที่เผยแพร่ ลองกลับมาใหม่เร็วๆ นี้
        </p>
      ) : (
        <ul className="mt-10 space-y-3">
          {skills.map((skill) => (
            <li key={skill.id}>
              <Link
                href={`/radar/skills/${skill.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white">{skill.name_th}</h2>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {skill.name_en}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                </div>

                {skill.description_th && (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                    {skill.description_th}
                  </p>
                )}

                {skill.professions.length > 0 && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-300">
                    <span className="text-neutral-500">โผล่ที่:</span>
                    {skill.professions.map((profession) => (
                      <span key={profession.slug} className="whitespace-nowrap">
                        <span aria-hidden>{profession.emoji}</span> {profession.name_th}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
