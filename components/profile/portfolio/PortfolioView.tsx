import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Link2,
  Wrench,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  OwnerPortfolio,
  PortfolioIdentity,
  PublicPortfolio,
} from "@/lib/profile/portfolio";
import { PortfolioEditor } from "./PortfolioEditor";
import { OwnerProjectsSection, ProjectsLayout } from "./OwnerProjectsSection";
import { TouchSurfaceObserver } from "./TouchSurfaceObserver";

const TRACK_LABELS: Record<string, string> = {
  dev: "Developer",
  video: "Video",
  strategy: "Strategy",
  design: "Design",
  other: "Other",
};

const SEEKING_LABELS: Record<string, string> = {
  internship: "Open to internships",
  freelance: "Open to freelance",
  collaboration: "Open to collaboration",
  "not-looking": "Not looking right now",
};

export function PortfolioView({
  portfolio,
  isOwner,
}: {
  portfolio: OwnerPortfolio | PublicPortfolio;
  isOwner: boolean;
}) {
  const { identity, cards } = portfolio;

  return (
    <div className="dawn-theme profile-dashboard-surface relative min-h-screen overflow-hidden bg-[#020617] text-slate-200">
      <PortfolioAtmosphere />
      {isOwner ? <TouchSurfaceObserver /> : null}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {isOwner && !identity.isPublic ? (
          <div className="mb-6 rounded-[22px] border border-amber-300/25 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            Your portfolio is private. Only you can see this page — publish it
            from the edit panel to share the link.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <IdentityCard identity={identity} isOwner={isOwner} />
            <TalentCard identity={identity} />
          </aside>

          <main className="space-y-6">
            <section className="ei-card rounded-[28px] border border-white/10 p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Projects
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-libre-franklin)] text-2xl font-semibold tracking-tight text-white">
                    Built and explored
                  </h2>
                </div>
                <span className="text-sm text-slate-400">
                  {cards.length} {cards.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <div className="mt-6">
                {portfolio.kind === "owner" ? (
                  <OwnerProjectsSection
                    cards={cards}
                    curation={portfolio.curation}
                    userId={identity.userId}
                  />
                ) : (
                  <ProjectsLayout cards={cards} />
                )}
              </div>

              {cards.length === 0 ? (
                <EmptyProjects isOwner={isOwner} />
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function IdentityCard({
  identity,
  isOwner,
}: {
  identity: PortfolioIdentity;
  isOwner: boolean;
}) {
  return (
    <section className="ei-card rounded-[28px] border border-white/10 p-6">
      <div className="flex flex-col items-start gap-4">
        <Avatar className="h-24 w-24 border border-white/15 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <AvatarImage src={identity.avatarUrl ?? undefined} alt="Profile picture" />
          <AvatarFallback className="bg-white/10 text-2xl text-white">
            {identity.fullName?.charAt(0) || identity.username.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="font-[family-name:var(--font-libre-franklin)] text-2xl font-semibold tracking-tight text-white">
            {identity.fullName || identity.username}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            @{identity.handle ?? identity.username}
          </p>
        </div>

        {identity.headline ? (
          <p className="text-sm leading-7 text-slate-300">{identity.headline}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {identity.track ? (
            <Chip>{TRACK_LABELS[identity.track] ?? identity.track}</Chip>
          ) : null}
          {identity.seeking ? (
            <Chip tone="accent">
              {SEEKING_LABELS[identity.seeking] ?? identity.seeking}
            </Chip>
          ) : null}
        </div>

        {identity.memberSince ? (
          <p className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            Member since{" "}
            {new Date(identity.memberSince).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
        ) : null}

        {isOwner ? <PortfolioEditor identity={identity} /> : null}
      </div>
    </section>
  );
}

function TalentCard({ identity }: { identity: PortfolioIdentity }) {
  const hasTools = identity.tools.length > 0;
  const hasLinks = identity.portfolioLinks.length > 0;
  if (!hasTools && !hasLinks) {
    return null;
  }

  return (
    <section className="ei-card ei-card--static rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      {hasTools ? (
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Wrench className="h-3.5 w-3.5" />
            Tools
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {identity.tools.map((tool) => (
              <Chip key={tool}>{tool}</Chip>
            ))}
          </div>
        </div>
      ) : null}

      {hasLinks ? (
        <div className={hasTools ? "mt-5" : ""}>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            Links
          </p>
          <div className="mt-3 space-y-2">
            {identity.portfolioLinks.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 truncate rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-white/[0.06]"
              >
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EmptyProjects({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-300">
      {isOwner ? (
        <>
          Nothing here yet. Start a{" "}
          <Link href="/seeds" className="font-semibold text-white hover:opacity-80">
            PathLab journey
          </Link>{" "}
          or build with{" "}
          <Link href="/projectseed" className="font-semibold text-white hover:opacity-80">
            ProjectSeed
          </Link>{" "}
          and your work will show up on this page.
        </>
      ) : (
        "No public projects yet."
      )}
    </div>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        tone === "accent"
          ? "border-blue-300/25 bg-blue-400/10 text-blue-100"
          : "border-white/10 bg-white/5 text-slate-200"
      }`}
    >
      {children}
    </span>
  );
}

function PortfolioAtmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
        }}
      />
      <div
        className="absolute rounded-full opacity-40 blur-[90px]"
        style={{
          width: "34vw",
          height: "34vw",
          left: "-4%",
          top: "12%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full opacity-32 blur-[90px]"
        style={{
          width: "40vw",
          height: "36vw",
          right: "-8%",
          top: "-6%",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.26) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-80 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(254, 217, 92, 0.18) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}
