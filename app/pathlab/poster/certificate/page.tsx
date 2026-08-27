import type { Metadata } from "next";
import Link from "next/link";
import { PosterScaler } from "@/components/plans/PosterScaler";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";

export const metadata: Metadata = {
  title: "Techseed Certificate — Passion Seed",
  /** A downloadable certificate tool, not a landing page. */
  robots: { index: false, follow: false },
};

/**
 * Techseed Certificate of Completion — landscape 2100×1500 px canvas,
 * styled after the original Techseed[3] certificate. Edit the constants
 * below to print certificates for other graduates.
 */

const CERTIFICATE = {
  program: "Techseed[3]",
  recipient: "Sorawat Promsorn",
  intro: "THIS CERTIFICATE RECOGNIZES THE ACHIEVEMENT OF",
  body: "FOR SUCCESSFULLY COMPLETING THE TECHSEED PROGRAM. IT RECOGNIZES OUTSTANDING EFFORT, CREATIVITY, AND EMERGING SKILLS IN THE FIELD OF TECHNOLOGY. WE HONOR YOUR DEDICATION AND COURAGE TO EXPLORE, CREATE, AND GROW IN YOUR TECH JOURNEY.",
  signatures: [
    {
      mark: "Juthalun",
      title: "Founder of Social Enterprise",
      org: "PassionSeed.org",
    },
    {
      mark: "JTL",
      title: "Founder of Homeschool network",
      org: "& Coderdojo Thailand",
    },
  ],
};

export default function CertificatePage() {
  return (
    <main className="pathlab-certificate-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Techseed Certificate
        </span>
        <span className="pathlab-ig-nav__divider" aria-hidden="true" />
        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          A4 Print
        </Link>
        <Link href="/pathlab/poster/tech" className="pathlab-ig-nav__link">
          Tech A4
        </Link>
        <Link href="/pathlab/poster/social" className="pathlab-ig-nav__link">
          Social Card
        </Link>
      </nav>

      <PosterScaler designWidth={2100} className="pathlab-certificate-scaler">
        <article
          id="pathlab-certificate"
          className="pathlab-certificate"
          aria-label="Techseed Certificate of Completion"
        >
          {/* Decorative diagonal bands that give the original its depth. */}
          <div className="pathlab-certificate__band pathlab-certificate__band--1" aria-hidden="true" />
          <div className="pathlab-certificate__band pathlab-certificate__band--2" aria-hidden="true" />
          <div className="pathlab-certificate__band pathlab-certificate__band--3" aria-hidden="true" />

          {/* Top-center brand lockup: flame icon inside a dark circular badge. */}
          <header className="pathlab-certificate__brand">
            <div className="pathlab-certificate__logo-ring">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/passionseed-logo.svg"
                alt="Passion Seed"
                className="pathlab-certificate__logo"
              />
            </div>
            <p className="pathlab-certificate__wordmark">
              <span className="pathlab-certificate__wordmark-bold">passion</span>
              <span className="pathlab-certificate__wordmark-light">seed</span>
            </p>
          </header>

          {/* Program name and certificate title. */}
          <div className="pathlab-certificate__program">
            <span className="pathlab-certificate__program-tech">Tech</span>
            <span className="pathlab-certificate__program-seed">seed</span>
            <span className="pathlab-certificate__program-batch">[3]</span>
          </div>

          <h1 className="pathlab-certificate__title">
            Certificate of Completion
          </h1>

          {/* Recipient block. */}
          <p className="pathlab-certificate__intro">{CERTIFICATE.intro}</p>
          <p className="pathlab-certificate__recipient">
            {CERTIFICATE.recipient}
          </p>
          <p className="pathlab-certificate__body">{CERTIFICATE.body}</p>

          {/* Signature row. */}
          <footer className="pathlab-certificate__signatures">
            {CERTIFICATE.signatures.map((sig) => (
              <div key={sig.mark} className="pathlab-certificate__signature">
                <p className="pathlab-certificate__signature-mark">{sig.mark}</p>
                <div className="pathlab-certificate__signature-line" aria-hidden="true" />
                <p className="pathlab-certificate__signature-title">{sig.title}</p>
                <p className="pathlab-certificate__signature-org">{sig.org}</p>
              </div>
            ))}
          </footer>
        </article>
      </PosterScaler>

      <SocialCardDownload
        targetId="pathlab-certificate"
        fileName="techseed-certificate"
        width={2100}
        height={1500}
        scale={2}
        label="ดาวน์โหลด PNG (2100×1500)"
      />
    </main>
  );
}
