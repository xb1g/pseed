import type { Metadata } from "next";
import { PartnerNav } from "@/components/pathlab/partner/PartnerNav";
import { PartnerHero } from "@/components/pathlab/partner/PartnerHero";
import { PartnerGoal } from "@/components/pathlab/partner/PartnerGoal";
import { PartnerModes } from "@/components/pathlab/partner/PartnerModes";
import { PartnerProof } from "@/components/pathlab/partner/PartnerProof";
import { PartnerMap } from "@/components/pathlab/partner/PartnerMap";
import { PartnerExchange } from "@/components/pathlab/partner/PartnerExchange";
import { PartnerContact } from "@/components/pathlab/partner/PartnerContact";
import { PartnerDmFab } from "@/components/pathlab/partner/PartnerDmFab";
import { PARTNER_MARQUEE } from "@/lib/content/pathlab-partner";

export const metadata: Metadata = {
  title: "ร่วมสร้าง PathLab | PassionSeed สำหรับผู้เชี่ยวชาญ",
  description:
    "เปลี่ยนคอร์สที่คุณสอน งานที่คุณทำจริง หรือเคสที่มีแค่คุณเล่าได้ ให้กลายเป็น PathLab ที่นักเรียนลงมือทำได้ โดยยังมีชื่อและเสียงของคุณอยู่กับผลงาน",
};

/**
 * The universal expert invitation, on the cream /pathlab canvas: same nav,
 * marquee, Kodchasan headings, terracotta accents and highlighter margin
 * notes as the student-facing page, so the forwarded link feels like part
 * of the same product the expert would be co-creating. Any field enters
 * through the same flow; the primary CTA starts the real expert interview.
 */
export default function PathlabPartnerPage() {
  return (
    <main className="pathlab-page min-h-screen antialiased">
      <PartnerNav />

      {/* Marquee strip, same construction as /pathlab. */}
      <div className="talent-marquee" aria-hidden="true">
        <div className="talent-marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="talent-marquee__group">
              {Array.from({ length: 4 }).flatMap((_, rep) =>
                PARTNER_MARQUEE.map((phrase) => (
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

      <PartnerHero />
      <PartnerGoal />
      <PartnerModes />
      <PartnerProof />
      <PartnerMap />
      <PartnerExchange />
      <PartnerContact />
      <PartnerDmFab />
    </main>
  );
}
