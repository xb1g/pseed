import type { Metadata } from "next";
import {
  AppWindow,
  Briefcase,
  PencilRuler,
  ShieldPlus,
  Video,
} from "lucide-react";
import { getTalentProfiles } from "@/lib/talent";
import { TalentHero } from "@/components/talent/TalentHero";
import { TalentGrid } from "@/components/talent/TalentGrid";
import { ProjectBriefForm } from "@/components/talent/TalentForms";

export const metadata: Metadata = {
  title: "Youth Talent — Pre-Vetted Thai Builders",
  description:
    "Access skilled Gen-Z creators and developers for high-impact, 48-hour turnaround projects.",
};

const MARQUEE_PHRASES = [
  "Empower student",
  "Enable Growth",
  "Inspire Confidence",
  "Fuel Ambition",
] as const;

const TALENT_CATEGORIES = [
  { label: "/Design", Icon: PencilRuler },
  { label: "/Software-Developer", Icon: AppWindow },
  { label: "/Video-Editor", Icon: Video },
  { label: "/Pen-Test", Icon: ShieldPlus },
  { label: "/Business-Strategy", Icon: Briefcase },
] as const;

export default async function TalentPage() {
  const profiles = await getTalentProfiles();

  return (
    <main className="talent-page min-h-screen font-radar-body antialiased">
      {/* ── Marquee strip ── */}
      <div className="talent-marquee" aria-hidden="true">
        <div className="talent-marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="talent-marquee__group">
              {Array.from({ length: 4 }).flatMap((_, rep) =>
                MARQUEE_PHRASES.map((phrase) => (
                  <span key={`${rep}-${phrase}`} className="talent-marquee__item">
                    {phrase}
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero (typed intro, fills the first viewport) ── */}
      <TalentHero />

      {/* ── Talent categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Our Student Talents
        </h2>
        <p className="mt-1 text-lg" style={{ color: "#524746" }}>
          [for now]
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-x-14 gap-y-10 sm:mt-16">
          {TALENT_CATEGORIES.map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-4">
              <div
                className="flex h-52 w-40 items-center justify-center rounded-2xl sm:h-60 sm:w-48"
                style={{ backgroundColor: "#524746" }}
              >
                <Icon
                  className="h-16 w-16 sm:h-20 sm:w-20"
                  style={{ color: "#FDF3E6" }}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-lg sm:text-xl" style={{ color: "#524746" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Student Profiles from the database + intake form ── */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Student Profile
        </h2>

        <div className="mt-8">
          <TalentGrid profiles={profiles} />
        </div>
      </section>

      {/* ── Project brief intake ── */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Interest?
        </h2>
        <p className="mt-2 mb-10 text-lg sm:text-xl" style={{ color: "#524746" }}>
          Contact us to implement student passion into your project
        </p>
        <ProjectBriefForm />
      </section>
    </main>
  );
}
