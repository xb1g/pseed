import type { Metadata } from "next";
import Link from "next/link";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";
import { POSTER, PRICE_TIERS } from "@/lib/content/pathlab-page";

export const metadata: Metadata = {
  title: "Pathlab Tech Poster — Passion Seed",
  robots: { index: false, follow: false },
};

/**
 * Tech-focused A4 print sheet, sharing the handmade vocabulary of the main
 * poster: marker frame, logo lockup, washi-taped project photos, hand-placed
 * tilts, a squiggle underline, sparkles, a rubber-stamp badge and a deal
 * panel that mirrors the base poster's. Numbers still come from PRICE_TIERS
 * so the promo can't drift from the site.
 */

const PROJECTS = [
  {
    path: "Web Dev",
    title: "Learning Flashcard",
    body: "สร้างเว็บ Flashcard ทบทวนบทเรียนที่เพื่อนเอาไปใช้อ่านสอบจริง",
    image: "/pathlab/field-webdev.webp",
  },
  {
    path: "Game Dev",
    title: "สร้างเกมแนว FPS",
    body: "ออกแบบระบบเกม ยิง เดิน และเอาตัวรอด แล้วทำให้คนอื่นกดเล่นได้จริง",
    image: "/pathlab/field-gamedev.webp",
  },
];

/* Two projects, two tilts: each marker swipe sits at its own angle so the
   row looks highlighted by hand, not stamped from a mould. */
const PROJECT_TILTS = [
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
] as const;

/** A four-point sparkle tossed into the quiet corners of the sheet. Purely
    decorative, so hidden from assistive tech. */
function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.5c.9 6.1 4 9.4 10.5 10.5-6.5 1.1-9.6 4.4-10.5 10.5-.9-6.1-4-9.4-10.5-10.5C8 10.9 11.1 7.6 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A tiny check chip rendered inline before each perk. Green is the second
    accent on the sheet (orange wordmarks + green ✓), so the check reads as
    "included" without competing with the wordmarks. */
function CheckMark() {
  return (
    <span className="pathlab-tech-poster__check" aria-hidden="true">
      <svg viewBox="0 0 16 16" focusable="false">
        <path
          d="M3.5 8.4 6.6 11.5 12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Computes the percent discount between the original and the promo price so
 * the "ลด 57%" chip can never drift away from the actual numbers. Returns
 * null when the inputs are missing or malformed, so the chip disappears
 * rather than printing a lie like "ลด NaN%".
 */
function discountPercent(
  original: string | undefined,
  promo: string | undefined,
): number | null {
  if (!original || !promo) return null;
  const o = Number(original);
  const p = Number(promo);
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0)
    return null;
  if (p >= o) return null;
  return Math.round(((o - p) / o) * 100);
}

export default function TechPosterPage() {
  /* Featured tier from the shared price list: the deal panel renders the
     same money question + value answer as the base poster, so the promo
     can never drift away from the live site. */
  const featured = PRICE_TIERS.find((tier) => tier.tone === "featured");
  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  return (
    <main className="pathlab-tech-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Tech A4
        </span>
        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          โปสเตอร์เดิม
        </Link>
        <Link href="/pathlab/poster/social/tech" className="pathlab-ig-nav__link">
          Tech Social
        </Link>
        <Link href="/pathlab/poster/certificate" className="pathlab-ig-nav__link">
          Certificate
        </Link>
      </nav>

      <article
        id="pathlab-tech-poster"
        className="pathlab-tech-poster"
        aria-label="โปสเตอร์ Pathlab Tech"
      >
        {/* Marker frame just inside the edge: slightly uneven corners keep
            it hand-drawn rather than machined. Drawn in CSS via
            .pathlab-tech-poster::before. */}

        {/* Logo + big wordmark sit on a single centred lockup so the title
            IS the brand. The plain <img> keeps the html-to-image export
            reliable. */}
        <header className="pathlab-tech-poster__lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/passion-seed-logo.png"
            alt="Passion Seed"
            className="pathlab-tech-poster__lockup-logo"
          />
          <h1 className="pathlab-tech-poster__title">Tech Path</h1>
        </header>

        <p className="pathlab-tech-poster__kicker">PASSION SEED · PATHLAB</p>

        {/* The hero aside reuses the global .pathlab-note marker look. */}
        <p className="pathlab-tech-poster__note">
          <span className="pathlab-note pathlab-note--tilt-r">
            ไม่ใช่คอร์สดูคลิปนะ ได้ลงมือทำจริง
          </span>
        </p>

        <h2 className="pathlab-tech-poster__headline">{POSTER.headline}</h2>
        <p className="pathlab-tech-poster__subline">
          ทำ Project จริง เพื่อรู้ว่าสาย Tech นี้ใช่ไหม
        </p>

        {/* Rubber-stamp badge beside the hero: the number-one worry,
            answered. Soft warm wash + faint drop shadow makes the ink read
            as pressed into the paper. */}
        <div className="pathlab-tech-poster__stamp">
          <span>ไม่ต้องมี พื้นฐาน</span>
        </div>

        <Sparkle className="pathlab-tech-poster__sparkle pathlab-tech-poster__sparkle--hero-l" />
        <Sparkle className="pathlab-tech-poster__sparkle pathlab-tech-poster__sparkle--hero-r" />
        <Sparkle className="pathlab-tech-poster__sparkle pathlab-tech-poster__sparkle--projects-r" />
        <Sparkle className="pathlab-tech-poster__sparkle pathlab-tech-poster__sparkle--deal-l" />

        <section className="pathlab-tech-poster__projects">
          <h2 className="pathlab-tech-poster__projects-heading">
            Project จริงที่น้อง ๆ จะได้ทำ
          </h2>
          {/* Hand-drawn wavy underline under the projects heading. */}
          <svg
            className="pathlab-tech-poster__squiggle"
            viewBox="0 0 122 12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 8.5 Q 13 3.5, 23 7.5 T 43 7.5 T 63 7.5 T 83 7.5 T 103 7.5 T 119 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <ul className="pathlab-tech-poster__projects-list">
            {PROJECTS.map((project, i) => (
              <li
                key={project.path}
                className="pathlab-tech-poster__project"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt=""
                  className="pathlab-tech-poster__project-img"
                />
                {/* Washi tape across a top corner so the photo reads as
                    physically stuck onto the sheet. */}
                <span
                  className={`pathlab-tech-poster__project-tape pathlab-tech-poster__project-tape--${
                    i % 2 === 0 ? "l" : "r"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`pathlab-note ${PROJECT_TILTS[i % PROJECT_TILTS.length]}`}
                >
                  {project.path}
                </span>
                <p className="pathlab-tech-poster__project-title">
                  {project.title}
                </p>
                <p className="pathlab-tech-poster__project-body">
                  {project.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {featured ? (
          <section className="pathlab-tech-poster__deal">
            <div className="pathlab-tech-poster__deal-head">
              <h2 className="pathlab-tech-poster__deal-title">
                {featured.label}
              </h2>
              {featured.chip ? (
                <span className="pathlab-tech-poster__deal-chip">
                  {featured.chip}
                </span>
              ) : null}
            </div>

            {/* Price on the left, perks on the right: the money question
                and the value answer sit side by side, separated by a dashed
                rule, instead of stacking into one tall wall. */}
            <div className="pathlab-tech-poster__deal-body">
              <div className="pathlab-tech-poster__deal-main">
                <div className="pathlab-tech-poster__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-tech-poster__deal-original">
                      <span className="pathlab-tech-poster__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span
                    className="pathlab-tech-poster__deal-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <span className="pathlab-tech-poster__deal-promo">
                    <span className="pathlab-tech-poster__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>

                {discount !== null ? (
                  <span className="pathlab-tech-poster__deal-discount">
                    ลด {discount}%
                  </span>
                ) : null}

                <p className="pathlab-tech-poster__deal-unit">
                  {featured.unit}
                </p>

                {featured.blurb ? (
                  <p className="pathlab-tech-poster__deal-blurb">
                    {featured.blurb}
                  </p>
                ) : null}
              </div>

              {featured.perks && featured.perks.length > 0 ? (
                <ul className="pathlab-tech-poster__perks">
                  {featured.perks.map((perk) => (
                    <li
                      key={perk}
                      className="pathlab-tech-poster__perk"
                    >
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="pathlab-tech-poster__schedule">
              {POSTER.schedule}
            </p>
          </section>
        ) : null}

        <footer className="pathlab-tech-poster__footer">
          รับเพียง 4 คนต่อกลุ่ม · ทักมาจองรอบได้เลย
        </footer>
      </article>

      <SocialCardDownload
        targetId="pathlab-tech-poster"
        fileName="pathlab-tech-poster-a4"
        scale={2}
        label="ดาวน์โหลด PNG (Tech A4)"
      />
    </main>
  );
}
