import type { Metadata } from "next";
import Link from "next/link";

import { DawnAtmosphere } from "@/components/projectseed/DawnAtmosphere";

export const metadata: Metadata = {
  title: "ProjectSeed Hub",
  description:
    "เลือกโปรเจกต์ อธิบายมัน และบอกว่าคุณเข้าห้องเสียงได้เวลาไหน — ห้องของ ProjectSeed",
};

const NAV = [
  { href: "/projectseed/hub", label: "ภาพรวม" },
  { href: "/projectseed/hub/project", label: "โปรเจกต์" },
  { href: "/projectseed/hub/schedule", label: "เวลา" },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnAtmosphere />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
            ProjectSeed
          </p>

          <nav aria-label="ProjectSeed hub">
            <ul className="flex flex-wrap gap-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full border border-white/12 px-4 py-1.5 text-sm text-slate-200 transition-colors hover:border-white/30 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="mt-8 flex flex-col gap-10">{children}</main>
      </div>
    </div>
  );
}
