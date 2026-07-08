"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Flame,
  Globe2,
  Mail,
  MessageSquareWarning,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

type LinkIcon = "calendar" | "warning" | "sparkles" | "users" | "globe";

export type LinkItem = {
  label: string;
  href: string;
  description: string;
  icon: LinkIcon;
};

const iconMap = {
  calendar: CalendarDays,
  warning: MessageSquareWarning,
  sparkles: Sparkles,
  users: UsersRound,
  globe: Globe2,
};

function isExternalHref(href: string) {
  return href.startsWith("http");
}

function LinkIcon({ icon }: { icon: LinkIcon }) {
  const Icon = iconMap[icon];
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

export function LinkPageClient({ links }: { links: LinkItem[] }) {
  const [primaryLink, ...secondaryLinks] = links;

  useEffect(() => {
    const elements = document.querySelectorAll(".ei-card, .ei-button-dusk");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("in-view"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      {
        rootMargin: "-18% 0px -34%",
        threshold: 0.16,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="dusk-theme relative isolate min-h-[100svh] overflow-hidden bg-[#06000f] px-5 py-10 text-white sm:px-8">
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 108%, rgba(251, 146, 60, 0.26) 0%, rgba(251, 146, 60, 0.12) 22%, transparent 54%), radial-gradient(circle at 16% 18%, rgba(147, 51, 234, 0.32) 0%, transparent 36%), radial-gradient(circle at 84% 16%, rgba(190, 24, 93, 0.22) 0%, transparent 34%), linear-gradient(180deg, #06000f 0%, #1a0336 36%, #3b0764 66%, #4a1230 100%)",
        }}
      />
      <div
        className="absolute left-[-18%] top-[10%] -z-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"
        style={{ animation: "dusk-cloud-a 17011ms ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-16%] top-[4%] -z-20 h-80 w-80 rounded-full bg-pink-700/20 blur-3xl"
        style={{ animation: "dusk-cloud-b 23003ms ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[-15%] left-1/2 -z-20 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
        style={{ animation: "sun-rise 29009ms cubic-bezier(0.05, 0.7, 0.35, 0.99) infinite" }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-52 bg-gradient-to-t from-orange-500/12 to-transparent" />

      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="pointer-events-none absolute bottom-8 h-1 w-1 rounded-full bg-orange-200/60 shadow-[0_0_18px_rgba(251,146,60,0.72)]"
          style={{
            left: `${18 + index * 15}%`,
            animation: `ember-rise ${[8317, 11003, 13007, 15101, 19001][index]}ms ease-in-out ${
              index * 640
            }ms infinite`,
          }}
          aria-hidden="true"
        />
      ))}

      <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-orange-200/20 bg-white/[0.055] shadow-[0_0_0_1px_rgba(251,146,60,0.16),0_18px_54px_rgba(0,0,0,0.36),0_0_80px_rgba(251,146,60,0.18)] backdrop-blur-xl">
            <div className="absolute inset-2 rounded-full bg-gradient-to-b from-orange-200/16 to-transparent" />
            <Image
              src="/passionseed-logo.svg"
              alt="Passion Seed"
              width={58}
              height={58}
              priority
              className="relative drop-shadow-[0_0_20px_rgba(251,195,62,0.34)]"
            />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200/15 bg-orange-200/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-orange-100/70">
            <Flame className="h-3 w-3" aria-hidden="true" />
            Dusk links
          </div>

          <h1 className="font-bai-jamjuree text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Passion Seed
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-200/68">
            Rethink education and careers through real projects, sharper direction, and people who can help.
          </p>
        </div>

        <Link
          href={primaryLink.href}
          target={isExternalHref(primaryLink.href) ? "_blank" : undefined}
          rel={isExternalHref(primaryLink.href) ? "noopener noreferrer" : undefined}
          className="ei-button-dusk mb-4 w-full justify-center px-5 py-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {primaryLink.label}
          </span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <div className="grid gap-3">
          {secondaryLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={isExternalHref(link.href) ? "_blank" : undefined}
              rel={isExternalHref(link.href) ? "noopener noreferrer" : undefined}
              className="ei-card group flex items-center gap-4 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06000f]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-200/12 bg-orange-100/8 text-orange-100/80 transition-colors duration-200 group-hover:border-orange-200/24 group-hover:bg-orange-100/12">
                <LinkIcon icon={link.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{link.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-200/58">
                  {link.description}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-orange-100/36 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-100/70" />
            </Link>
          ))}
        </div>

        <a
          href="mailto:help@passionseed.org"
          className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-200/45 transition-colors hover:text-orange-100/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          help@passionseed.org
        </a>
      </section>
    </main>
  );
}
