"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: "exact" | "prefix";
};

const NAV: NavItem[] = [
  { href: "/projectseed/hub", label: "ภาพรวม", match: "exact" },
  { href: "/projectseed/hub/project", label: "โปรเจกต์", match: "prefix" },
  { href: "/projectseed/hub/schedule", label: "เวลา", match: "prefix" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * ProjectSeed hub section rail — ภาพรวม / โปรเจกต์ / เวลา.
 * Active state is path-driven; styles live under `.ps-hub-nav` in globals.css.
 */
export function HubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="ProjectSeed hub" className="ps-hub-nav">
      <ul className="ps-hub-nav__list">
        {NAV.map((item, index) => {
          const active = isActive(pathname, item);

          return (
            <li key={item.href} className="ps-hub-nav__item">
              <Link
                href={item.href}
                className="ps-hub-nav__link"
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : undefined}
              >
                <span className="ps-hub-nav__glow" aria-hidden="true" />
                <span className="ps-hub-nav__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="ps-hub-nav__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
