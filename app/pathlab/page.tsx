import type { Metadata } from "next";
import { PathlabHero } from "@/components/pathlab/PathlabHero";
import { PathlabPortfolio } from "@/components/pathlab/PathlabPortfolio";
import { MARQUEE_PHRASES } from "@/lib/content/pathlab-page";

export const metadata: Metadata = {
  title: "Pathlab — ทำ Project จริงกับผู้เชี่ยวชาญ",
  description:
    "ทดสอบว่าทางนี้ใช่ทางของคุณไหม และเริ่มต้นเรียนรู้พื้นฐานของสายต่างๆ ผ่านการทำ Project ที่ออกแบบร่วมกับผู้เชี่ยวชาญ ภายในเวลา 4-5 วัน",
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
    </main>
  );
}
