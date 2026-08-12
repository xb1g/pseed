import type { Metadata } from "next";
import { PathlabHero } from "@/components/pathlab/PathlabHero";
import { PathlabPortfolio } from "@/components/pathlab/PathlabPortfolio";
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
  // Stated explicitly so a shared link shows this page's own title rather than
  // the site default. The image is inherited from the root layout.
  openGraph: {
    type: "website",
    title: PATHLAB_TITLE,
    description: PATHLAB_DESCRIPTION,
    siteName: "Passion Seed",
    images: [
      {
        url: "/og-passionseed.jpg",
        width: 1200,
        height: 630,
        alt: "Passion Seed",
      },
    ],
  },
};

export default function PathlabPage() {
  return (
    <main className="pathlab-page min-h-screen antialiased">
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
      <PathlabStats />
      <PathlabOffer />
      <PathlabFields />
      <PathlabPrice />
      <PathlabContact />
    </main>
  );
}
