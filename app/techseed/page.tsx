import type { Metadata } from "next";
import { Suspense } from "react";

import { TechseedSignup } from "@/components/techseed/techseed-signup";

export const metadata: Metadata = {
  title: "TechSeed รุ่น 6 | PassionSeed",
  description:
    "ค่ายออนไลน์หลายสัปดาห์: ทีม (squad) + แผนการเรียนส่วนตัว (plan) + คอมมูนิตี้ ทำโปรเจกต์จริง มีพี่ ๆ ดูแล ชวนเพื่อน 1 คนลด 150฿",
};

export default function TechseedPage() {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      {/* Dawn atmosphere: base gradient + cloud blobs + horizon glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.20) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, rgba(254, 217, 92, 0.12) 0%, transparent 60%)",
          filter: "blur(52px)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-12 sm:px-6">
        <Suspense fallback={null}>
          <TechseedSignup />
        </Suspense>
      </main>
    </div>
  );
}
