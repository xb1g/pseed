import type { Metadata } from "next";
import { getTalentProfiles } from "@/lib/talent";
import { TalentGrid } from "@/components/talent/TalentGrid";

export const metadata: Metadata = {
  title: "Youth Talent — Pre-Vetted Thai Builders",
  description:
    "Access skilled Gen-Z creators and developers for high-impact, 48-hour turnaround projects.",
};

const EMBERS = [
  { left: "8%", bottom: "12%", delay: "0s", dur: "6.5s" },
  { left: "18%", bottom: "8%", delay: "1.4s", dur: "8s" },
  { left: "29%", bottom: "15%", delay: "0.6s", dur: "7s" },
  { left: "41%", bottom: "5%", delay: "2.3s", dur: "5.8s" },
  { left: "53%", bottom: "18%", delay: "0.9s", dur: "7.5s" },
  { left: "63%", bottom: "10%", delay: "1.8s", dur: "6s" },
  { left: "74%", bottom: "14%", delay: "3.1s", dur: "5.2s" },
  { left: "83%", bottom: "7%", delay: "0.3s", dur: "8.5s" },
] as const;

function StatTally({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-1 sm:px-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-3xl font-black leading-none text-white">{value}</span>
    </div>
  );
}

export default async function TalentPage() {
  const profiles = await getTalentProfiles();

  const trackCounts = {
    total: profiles.length,
    tracks: new Set(profiles.map((p) => p.track)).size,
  };

  return (
    <main
      className="min-h-screen font-sans antialiased relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(to bottom, #06000f 0%, #1a0336 28%, #3b0764 58%, #4a1230 82%, #2a0818 100%)",
      }}
    >
      {/* ── Dusk atmosphere layer ── */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
        aria-hidden
      >
        {/* Cloud A — amber, top-left */}
        <div
          style={{
            position: "absolute",
            top: "-5%",
            left: "-10%",
            width: 640,
            height: 640,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.38) 0%, rgba(234,88,12,0.18) 45%, transparent 70%)",
            filter: "blur(72px)",
            animation: "dusk-cloud-a 14s ease-in-out infinite",
          }}
        />

        {/* Cloud B — rose/magenta, top-right */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            right: "-14%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(190,24,93,0.42) 0%, rgba(157,23,77,0.20) 45%, transparent 70%)",
            filter: "blur(64px)",
            animation: "dusk-cloud-b 18s ease-in-out infinite",
          }}
        />

        {/* Cloud C — deep violet with warm core, center-low */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "18%",
            width: 700,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(249,115,22,0.28) 0%, rgba(124,58,237,0.18) 50%, transparent 72%)",
            filter: "blur(80px)",
            animation: "dusk-cloud-c 22s ease-in-out infinite",
          }}
        />

        {/* Horizon warm glow */}
        <div
          style={{
            position: "absolute",
            bottom: "22%",
            left: "0%",
            right: "0%",
            height: 220,
            background:
              "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(251,146,60,0.32) 0%, rgba(234,88,12,0.14) 45%, transparent 100%)",
            filter: "blur(52px)",
            animation: "sun-rise 48s ease-in-out infinite",
          }}
        />

        {/* Dot grid — stars in the upper sky */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.07 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="talent-dusk-grid"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="50%" fill="url(#talent-dusk-grid)" />
        </svg>

        {/* Rising embers */}
        {EMBERS.map((e, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: e.left,
              bottom: e.bottom,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: "50%",
              background:
                i % 2 === 0 ? "rgba(251,146,60,0.9)" : "rgba(249,115,22,0.85)",
              boxShadow: "0 0 4px rgba(251,146,60,0.8)",
              animation: `ember-rise ${e.dur} ease-in-out ${e.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24">
        {/* Hero */}
        <div className="mb-16 flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
            Youth Talent Platform
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Pre-Vetted Thai Youth Builders
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Access skilled Gen-Z creators and developers for high-impact, 48-hour turnaround
            projects. Every builder has been verified for their track.
          </p>
        </div>

        {/* Stats bar */}
        <section className="mb-12 grid grid-cols-3 gap-y-6 rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/8 sm:divide-x sm:divide-white/8">
          <StatTally label="Builders" value={String(trackCounts.total)} />
          <StatTally label="Tracks" value={String(trackCounts.tracks)} />
          <StatTally label="Turnaround" value="48-72hr" />
        </section>

        {/* Talent grid */}
        <TalentGrid profiles={profiles} />

        {/* LINE OA CTA */}
        <section className="mt-20 flex flex-col items-center gap-6 rounded-2xl bg-slate-950/60 p-8 text-center ring-1 ring-white/8 sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Submit Your Project Brief</h2>
          <p className="max-w-lg text-slate-300">
            Scan the QR code below to submit your project brief via LINE. We&apos;ll match you
            with the right builder within 24 hours.
          </p>
          <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">LINE OA QR</p>
          </div>
          <p className="text-sm text-slate-500">
            Or search <span className="font-semibold text-amber-300">@passionseed</span> on LINE
          </p>
        </section>
      </div>
    </main>
  );
}
