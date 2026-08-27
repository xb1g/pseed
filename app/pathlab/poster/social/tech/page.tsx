import type { Metadata } from "next";
import Link from "next/link";
import { PosterScaler } from "@/components/plans/PosterScaler";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";
import { POSTER, PRICE_TIERS } from "@/lib/content/pathlab-page";

export const metadata: Metadata = {
  title: "Pathlab Tech Social Card — Passion Seed",
  robots: { index: false, follow: false },
};

/**
 * 1200x630 share card for the Tech Path. Recomposes the tech A4 vocabulary
 * (marker frame, washi-taped project photos, hand-placed tilts, sparkles,
 * rubber stamp, deal panel) into a landscape share format. Numbers still
 * come from PRICE_TIERS so the promo can't drift from the site.
 */

const PROJECTS = [
  {
    path: "Web Dev",
    title: "Learning Flashcard",
    body: "เว็บ Flashcard ที่เพื่อนเอาไปอ่านสอบจริง",
    image: "/pathlab/field-webdev.webp",
  },
  {
    path: "Game Dev",
    title: "เกมแนว FPS",
    body: "ยิง เดิน เอาตัวรอด คนอื่นกดเล่นได้จริง",
    image: "/pathlab/field-gamedev.webp",
  },
];

/* Two projects, two tilts: each marker swipe sits at its own angle so the
   column doesn't look stamped from a mould. "" keeps the base .pathlab-note
   tilt. */
const PROJECT_TILTS = [
  "",
  "pathlab-note--tilt-r",
] as const;

/** A four-point sparkle tossed into the quiet corners. Purely decorative,
    so hidden from assistive tech. */
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
    accent on the card (orange wordmarks + green ✓), so the check reads as
    "included" without competing with the wordmarks. */
function CheckMark() {
  return (
    <span className="pathlab-tech-social__check" aria-hidden="true">
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

export default function TechSocialPosterPage() {
  /* Featured tier from the shared price list: the deal panel renders the
     same money question + value answer as the A4 poster, so the promo
     can never drift away from the live site. */
  const featured = PRICE_TIERS.find((tier) => tier.tone === "featured");
  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  /* Perks live in the deal panel; cap at three so the card fits a 1200x630
     share format without crowding. */
  const perks = (featured?.perks ?? []).slice(0, 3);

  return (
    <main className="pathlab-tech-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Tech Social
        </span>
        <Link href="/pathlab/poster/tech" className="pathlab-ig-nav__link">
          Tech A4
        </Link>
        <Link
          href="/pathlab/poster/social"
          className="pathlab-ig-nav__link"
        >
          Social เดิม
        </Link>
        <Link href="/pathlab/poster/certificate" className="pathlab-ig-nav__link">
          Certificate
        </Link>
      </nav>

      <PosterScaler designWidth={1200} className="pathlab-tech-social-scaler">
        <article
          id="pathlab-tech-social"
          className="pathlab-tech-social"
          aria-label="การ์ดแชร์ Pathlab Tech ขนาด 1200x630"
        >
          {/* Marker frame just inside the edge: slightly uneven corners keep
              it hand-drawn rather than machined. Drawn in CSS via
              .pathlab-tech-social::before. */}

          <Sparkle className="pathlab-tech-social__sparkle pathlab-tech-social__sparkle--hero-l" />
          <Sparkle className="pathlab-tech-social__sparkle pathlab-tech-social__sparkle--hero-r" />
          <Sparkle className="pathlab-tech-social__sparkle pathlab-tech-social__sparkle--projects-r" />

          {/* Rubber-stamp badge tucked beside the hero, hidden on the
              left edge so it sits high without crowding the wordmark. */}
          <div className="pathlab-tech-social__stamp">
            <span>ไม่ต้องมี พื้นฐาน</span>
          </div>

          <section className="pathlab-tech-social__hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/passion-seed-logo.png"
              alt="Passion Seed"
              className="pathlab-tech-social__lockup-logo"
            />
            <p className="pathlab-tech-social__kicker">
              PASSION SEED · PATHLAB
            </p>
            <h1 className="pathlab-tech-social__title">Tech Path</h1>
            <p className="pathlab-tech-social__note">
              <span className="pathlab-note pathlab-note--tilt-r">
                ไม่ใช่คอร์สดูคลิปนะ ได้ลงมือทำจริง
              </span>
            </p>
            <p className="pathlab-tech-social__lead">
              ทำ Project จริงให้รู้ว่าสาย Tech ใช่ไหม
            </p>
          </section>

          <section className="pathlab-tech-social__projects" aria-label="Project ที่น้อง ๆ จะได้ทำ">
            {PROJECTS.map((project, i) => (
              <article
                key={project.path}
                className={`pathlab-tech-social__project pathlab-tech-social__project--${
                  i % 2 === 0 ? "top" : "bottom"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt=""
                  className="pathlab-tech-social__project-img"
                />
                {/* Washi tape across a top corner so the photo reads as
                    physically stuck onto the card. Alternates by position. */}
                <span
                  className={`pathlab-tech-social__project-tape pathlab-tech-social__project-tape--${
                    i % 2 === 0 ? "l" : "r"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`pathlab-note ${PROJECT_TILTS[i % PROJECT_TILTS.length]}`}
                >
                  {project.path}
                </span>
                <h2 className="pathlab-tech-social__project-title">
                  {project.title}
                </h2>
                <p className="pathlab-tech-social__project-body">
                  {project.body}
                </p>
              </article>
            ))}
          </section>

          {featured ? (
            <section className="pathlab-tech-social__deal">
              <div className="pathlab-tech-social__deal-main">
                <div className="pathlab-tech-social__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-tech-social__deal-original">
                      <span className="pathlab-tech-social__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span
                    className="pathlab-tech-social__deal-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <span className="pathlab-tech-social__deal-promo">
                    <span className="pathlab-tech-social__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>
                <div className="pathlab-tech-social__deal-meta">
                  {discount !== null ? (
                    <span className="pathlab-tech-social__deal-discount">
                      ลด {discount}%
                    </span>
                  ) : null}
                  <span className="pathlab-tech-social__deal-unit">
                    ต่อคน · รอบ 4-6 วัน
                  </span>
                </div>
              </div>

              {perks.length > 0 ? (
                <ul className="pathlab-tech-social__perks">
                  {perks.map((perk) => (
                    <li key={perk} className="pathlab-tech-social__perk">
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="pathlab-tech-social__schedule">
                <span className="pathlab-tech-social__schedule-lead">
                  รอบถัดไป
                </span>
                <span className="pathlab-tech-social__schedule-dates">
                  {POSTER.schedule}
                </span>
              </p>
            </section>
          ) : null}

          <footer className="pathlab-tech-social__footer">
            รับเพียง 4 คนต่อกลุ่ม · ทักมาจองรอบได้เลย
          </footer>
        </article>
      </PosterScaler>

      <SocialCardDownload
        targetId="pathlab-tech-social"
        fileName="pathlab-tech-social-1200x630"
        width={1200}
        height={630}
        label="ดาวน์โหลด PNG (Tech Social)"
      />
    </main>
  );
}
