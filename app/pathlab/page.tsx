import type { Metadata } from "next";
import { PathlabNav } from "@/components/pathlab/PathlabNav";
import { PathlabHero } from "@/components/pathlab/PathlabHero";
import { PathlabPortfolio } from "@/components/pathlab/PathlabPortfolio";
import { PathlabJourney } from "@/components/pathlab/PathlabJourney";
import { PathlabStats } from "@/components/pathlab/PathlabStats";
import { PathlabOffer } from "@/components/pathlab/PathlabOffer";
import { PathlabFields } from "@/components/pathlab/PathlabFields";
import { PathlabPrice } from "@/components/pathlab/PathlabPrice";
import { PathlabContact } from "@/components/pathlab/PathlabContact";
import { MARQUEE_PHRASES } from "@/lib/content/pathlab-page";

const PATHLAB_TITLE = "Pathlab — ทำ Project จริงกับผู้เชี่ยวชาญ";
const PATHLAB_DESCRIPTION =
  "ทดสอบว่าทางนี้ใช่ทางของคุณไหม และเริ่มต้นเรียนรู้พื้นฐานของสายต่างๆ ผ่านการทำ Project ที่ออกแบบร่วมกับผู้เชี่ยวชาญ ภายในเวลา 4-5 วัน";

export const metadata: Metadata = {
  title: PATHLAB_TITLE,
  description: PATHLAB_DESCRIPTION,
  openGraph: {
    type: "website",
    title: PATHLAB_TITLE,
    description: PATHLAB_DESCRIPTION,
    siteName: "Passion Seed",
    images: [
      {
        url: "/og-pathlab.jpg",
        width: 1200,
        height: 630,
        alt: "Pathlab — Passion Seed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PATHLAB_TITLE,
    description: PATHLAB_DESCRIPTION,
    images: ["/og-pathlab.jpg"],
  },
};

export default function PathlabPage() {
  return (
    <main className="pathlab-page min-h-screen antialiased">
      <PathlabNav />

      {/* Marquee strip, same construction as /talent */}
      <div className="talent-marquee" aria-hidden="true">
        <div className="talent-marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="talent-marquee__group">
              {Array.from({ length: 4 }).flatMap((_, rep) =>
                MARQUEE_PHRASES.map((phrase) => (
                  <span
                    key={`${rep}-${phrase}`}
                    className="talent-marquee__item"
                  >
                    {phrase}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <PathlabHero />
      <PathlabPortfolio />
      <PathlabJourney />
      <PathlabStats />
      <PathlabOffer />
      <PathlabFields />
      <PathlabPrice />
      <PathlabContact />
    </main>
  );
}
