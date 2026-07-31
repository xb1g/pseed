import type { Metadata } from "next";

import { DawnAtmosphere } from "@/components/projectseed/DawnAtmosphere";
import { HubNav } from "@/components/projectseed/HubNav";

export const metadata: Metadata = {
  title: "ProjectSeed Hub",
  description:
    "เลือกโปรเจกต์ อธิบายมัน และบอกว่าคุณเข้าห้องเสียงได้เวลาไหน — ห้องของ ProjectSeed",
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnAtmosphere />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <header className="ps-hub-header">
          <p className="dawn-eyebrow">ProjectSeed</p>
          <hr className="dawn-rule ps-hub-header__rule" />
          <HubNav />
        </header>

        <main className="mt-8 flex flex-col gap-10">{children}</main>
      </div>
    </div>
  );
}
