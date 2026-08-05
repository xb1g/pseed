import type { Metadata } from "next";
import { getTalentProfiles } from "@/lib/talent";
import { TalentCategories } from "@/components/talent/TalentCategories";
import { TalentHero } from "@/components/talent/TalentHero";
import { TalentGrid } from "@/components/talent/TalentGrid";
import { ProjectBriefForm } from "@/components/talent/TalentForms";
import { TalentWorkShowcase } from "@/components/talent/TalentWork";
import { TalentWhy } from "@/components/talent/TalentWhy";
import { TalentLegal } from "@/components/talent/TalentLegal";
import { TalentHiring } from "@/components/talent/TalentHiring";

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
          Five tracks so far — more as students turn up
        </p>

        <div className="mt-12 sm:mt-16">
          <TalentCategories profiles={profiles} />
        </div>
      </section>

      {/* ── Actual work already shipped ── */}
      <section
        id="actual-work"
        className="talent-anchor mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"
      >
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Actual Work
        </h2>
        <p className="mt-1 text-lg" style={{ color: "#524746" }}>
          Shipped, public, and theirs — not mockups
        </p>

        <div className="mt-12 sm:mt-16">
          <TalentWorkShowcase profiles={profiles} />
        </div>
      </section>

      {/* ── Hiring interns: the vetting pitch ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Hiring an Intern?
        </h2>
        <p className="mt-1 text-lg" style={{ color: "#524746" }}>
          We verify the skills before you ever see the name
        </p>

        <div className="mt-12 sm:mt-16">
          <TalentHiring />
        </div>
      </section>

      {/* ── Why we do this ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Why We Do This
        </h2>
        <p className="mt-1 text-lg" style={{ color: "#524746" }}>
          What students keep asking us for
        </p>

        <div className="mt-12 sm:mt-16">
          <TalentWhy />
        </div>
      </section>

      {/* ── Legal footing ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <h2
          className="font-radar-title text-4xl sm:text-5xl md:text-6xl"
          style={{ color: "#C43E1D" }}
        >
          Legal Footing
        </h2>
        <p className="mt-1 text-lg" style={{ color: "#524746" }}>
          Prize awards, not employment — so age 12 can start
        </p>

        <div className="mt-12 sm:mt-16">
          <TalentLegal />
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
      <section
        id="interest"
        className="talent-anchor mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8"
      >
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
