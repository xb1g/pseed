import type { Metadata } from "next";
import { Suspense } from "react";

import { TechseedSignup } from "@/components/techseed/techseed-signup";
import gallery from "@/lib/content/techseed-gallery.json";

export const metadata: Metadata = {
  title: "TechSeed รุ่น 6 | PassionSeed",
  description:
    "ค่ายออนไลน์หลายสัปดาห์: ทีม (squad) + แผนการเรียนส่วนตัว (plan) + คอมมูนิตี้ ทำโปรเจกต์จริง มีพี่ ๆ ดูแล ชวนเพื่อน 1 คนลด 150฿",
};

// Curate a spread of final projects so the marquee stays light: at most 18
// tiles sampled evenly across every cohort.
const images = gallery.filter((g) => g.kind === "image");
const sampleStep = Math.max(1, Math.floor(images.length / 18));
const curated = images.filter((_, i) => i % sampleStep === 0).slice(0, 18);
const columns = [0, 1, 2].map((c) => curated.filter((_, i) => i % 3 === c));
const columnDuration = ["61s", "83s", "71s"]; // prime-ish, never sync

export default function TechseedPage() {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      {/* Dawn atmosphere: base gradient + cloud blobs + horizon glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.20) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, rgba(254, 217, 92, 0.12) 0%, transparent 60%)",
          filter: "blur(52px)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-12 sm:px-6">
        <Suspense fallback={null}>
          <TechseedSignup />
        </Suspense>
      </main>

      {/* Student work gallery: slow vertical marquee, tall on purpose */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6">
        <div className="text-center">
          <p className="dawn-eyebrow">Proof of Work</p>
          <h2 className="font-kodchasan mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            ชิ้นงานจริงจากรุ่นพี่ TechSeed
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300/80">
            ทุกชิ้นคือ final project ที่น้องลงมือทำเองและปล่อยสู่โลกจริงภายใน 5
            วัน ตั้งแต่เกม 3D model ไปจนถึง AI
          </p>
        </div>

        <div className="ts-marquee mt-12 grid h-[110vh] grid-cols-2 gap-4 overflow-hidden sm:grid-cols-3 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]">
          {columns.map((col, c) => (
            <div
              key={c}
              className={`ts-marquee__col ${c === 1 ? "ts-marquee__col--reverse" : ""}`}
              style={
                { "--ts-marquee-duration": columnDuration[c] } as React.CSSProperties
              }
            >
              {/* duplicated once so the -50% loop is seamless */}
              {[...col, ...col].map((item, i) => (
                <figure
                  key={`${item.url}-${i}`}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* no lazy loading: the reverse-animated column confuses
                      Chrome's lazy-load intersection check and never loads */}
                  <img
                    src={item.url}
                    alt={`TechSeed #${item.cohort} final project`}
                    className="w-full"
                  />
                  <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-amber-200 backdrop-blur-sm">
                    TechSeed #{item.cohort}
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Final Projects · TechSeed #3, #4 & #5 · Shared with student permission
        </p>
      </section>
    </div>
  );
}
