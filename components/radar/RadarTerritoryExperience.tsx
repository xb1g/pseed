"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { recordRadarPathIntent } from "@/lib/supabase/radar";
import type {
  Territory,
  TerritoryProfession,
  TerritorySkillRef,
  TerritoryStartOption,
} from "@/lib/radar/territory";

type Reaction = "interested" | "not-for-me";

const REACTION_LABEL: Record<Reaction, string> = {
  interested: "อยากรู้เพิ่ม",
  "not-for-me": "ไม่ใช่แนวเรา",
};

function SkillChips({ skills, accent }: { skills: TerritorySkillRef[]; accent: string }) {
  if (skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Link
          key={skill.id}
          href={`/radar/skills/${skill.slug}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-neutral-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {skill.is_primary && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} aria-hidden />
          )}
          {skill.name_th}
        </Link>
      ))}
    </div>
  );
}

function FantasyReality({
  fantasy,
  reality,
  accent,
}: {
  fantasy: string | null;
  reality: string | null;
  accent: string;
}) {
  if (!fantasy && !reality) return null;

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
      {fantasy && (
        <div className="bg-neutral-950/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            ภาพที่คิดไว้
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">{fantasy}</p>
        </div>
      )}
      {reality && (
        <div className="bg-neutral-950/80 p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            งานจริง
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-200">{reality}</p>
        </div>
      )}
    </div>
  );
}

function ReactionRow({
  profession,
  territoryKey,
  accent,
}: {
  profession: TerritoryProfession;
  territoryKey: string;
  accent: string;
}) {
  const [recorded, setRecorded] = useState<Reaction | null>(null);

  const react = useCallback(
    async (reaction: Reaction) => {
      setRecorded(reaction);
      try {
        const result = await recordRadarPathIntent({
          fieldSlug: profession.slug,
          fieldId: profession.id,
          pathSlug: `territory:${territoryKey}:${reaction}`,
          buttonLabel: REACTION_LABEL[reaction],
        });
        if (result === "failed") setRecorded(null);
      } catch (error) {
        console.error("Error recording radar territory reaction:", error);
        setRecorded(null);
      }
    },
    [profession.id, profession.slug, territoryKey]
  );

  if (recorded) {
    return (
      <p className="inline-flex min-h-12 items-center gap-2 text-sm text-neutral-400">
        <Check className="h-4 w-4" style={{ color: accent }} />
        {recorded === "interested" ? "บันทึกว่าสนใจแล้ว" : "บันทึกแล้ว จะไม่ดันงานแนวนี้ให้อีก"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void react("interested")}
        className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        style={{ background: accent }}
      >
        {REACTION_LABEL.interested}
      </button>
      <button
        type="button"
        onClick={() => void react("not-for-me")}
        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {REACTION_LABEL["not-for-me"]}
      </button>
    </div>
  );
}

/**
 * One profession, collapsed to a scannable row and expanded on demand.
 *
 * Density is the message here: the payload of this territory is "look how many
 * jobs exist that you have never heard of", which only lands if many are
 * visible at once. So the collapsed row carries just enough to spark — emoji,
 * name, and the one-line hook from `tagline_th` — and everything else waits
 * behind a tap.
 */
function ProfessionRow({
  profession,
  index,
  territoryKey,
  isOpen,
  onToggle,
}: {
  profession: TerritoryProfession;
  index: number;
  territoryKey: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const accent = profession.color;
  const panelId = `profession-panel-${profession.slug}`;

  return (
    <article
      className="overflow-hidden rounded-xl border bg-white/[0.03] transition-colors"
      style={{ borderColor: isOpen ? `${accent}66` : "rgba(255,255,255,0.10)" }}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span className="text-2xl leading-none" aria-hidden>
            {profession.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-neutral-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate font-bold text-white">{profession.name_th}</span>
            </span>
            {profession.tagline_th && (
              <span className="mt-0.5 block text-sm leading-snug text-neutral-400">
                {profession.tagline_th}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color: isOpen ? accent : "#737373" }}
            aria-hidden
          />
        </button>
      </h3>

      {isOpen && (
        <div id={panelId} className="border-t border-white/10 p-4 sm:p-5">
          <p className="text-lg leading-relaxed text-white">{profession.copy.reveal_th}</p>

          <div className="mt-4">
            <FantasyReality
              fantasy={profession.copy.fantasy_th}
              reality={profession.copy.reality_th}
              accent={accent}
            />
          </div>

          {profession.copy.sits_th && (
            <p
              className="mt-4 border-l-2 pl-3 text-sm leading-relaxed text-neutral-400"
              style={{ borderColor: accent }}
            >
              {profession.copy.sits_th}
            </p>
          )}

          {profession.skills.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                เก่งจากทักษะอะไร
              </p>
              <SkillChips skills={profession.skills} accent={accent} />
            </div>
          )}

          <div className="mt-4">
            <ReactionRow profession={profession} territoryKey={territoryKey} accent={accent} />
          </div>
        </div>
      )}
    </article>
  );
}

function CompositeCard({
  profession,
  territoryKey,
  partCount,
}: {
  profession: TerritoryProfession;
  territoryKey: string;
  partCount: number;
}) {
  const accent = profession.color;

  return (
    <article
      className="rounded-2xl border p-5 sm:p-7"
      style={{ borderColor: `${accent}55`, background: `${accent}0d` }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
        แล้ว &ldquo;{profession.name_th}&rdquo; อยู่ตรงไหน
      </p>
      <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
        <span aria-hidden>{profession.emoji}</span>
        {profession.name_th}
      </h3>

      <p className="mt-4 text-lg leading-relaxed text-white sm:text-xl">
        {profession.copy.reveal_th}
      </p>

      <div className="mt-5">
        <FantasyReality
          fantasy={profession.copy.fantasy_th}
          reality={profession.copy.reality_th}
          accent={accent}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-300">
        ไม่ใช่ตำแหน่งที่สมัครได้ มันคือการที่ {partCount} งานข้างบนไม่มีใครทำแทน
        เลยต้องเรียนรู้ทั้งหมดจากการลงมือ ไม่ใช่จากการอ่าน
      </p>

      {profession.skills.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            ทักษะที่ต้องมีครบ
          </p>
          <SkillChips skills={profession.skills} accent={accent} />
        </div>
      )}

      <div className="mt-5">
        <ReactionRow profession={profession} territoryKey={territoryKey} accent={accent} />
      </div>
    </article>
  );
}

function StartHere({
  options,
  accent,
}: {
  options: TerritoryStartOption[];
  accent: string;
}) {
  if (options.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold text-white">อยากลองของจริง</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
        อ่านจบแล้วยังไม่รู้ว่าชอบไหม เป็นเรื่องปกติ รู้ได้จากการลงมือเท่านั้น
      </p>
      <div className="mt-5 space-y-3">
        {options.map((option) => {
          const external = Boolean(option.destination_url);
          const href = option.destination_url ?? option.destination_ref;
          if (!href) return null;

          const body = (
            <>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                {option.provider ?? option.kind}
              </span>
              <span className="mt-1 block text-lg font-bold text-white">{option.title_th}</span>
              {option.summary_th && (
                <span className="mt-1 block text-sm leading-relaxed text-neutral-400">
                  {option.summary_th}
                </span>
              )}
            </>
          );

          const className =
            "flex min-h-16 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

          return external ? (
            <a
              key={option.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              <span className="min-w-0">{body}</span>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: accent }} />
            </a>
          ) : (
            <Link key={option.id} href={href} className={className}>
              <span className="min-w-0">{body}</span>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: accent }} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RadarTerritoryExperience({ territory }: { territory: Territory }) {
  const { professions, composite, skills, startOptions } = territory;
  const terminusAccent = composite?.color ?? professions[0]?.color ?? "#f59e0b";
  // Single-open accordion: two expanded rows push the rest off-screen and the
  // list stops being scannable, which is the only reason this layout exists.
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:pt-16">
      <header>
        <Link
          href="/radar"
          className="inline-flex min-h-11 items-center text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← Radar
        </Link>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
          {territory.label_th}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg">
          {professions.length} งานที่ทำให้ธุรกิจมีเงินเข้า ส่วนใหญ่คุณไม่เคยได้ยินชื่อ
          แตะอันที่สะดุดตาเพื่อดูว่างานจริงเป็นยังไง
        </p>
      </header>

      <section className="mt-8 space-y-2">
        {professions.map((profession, index) => (
          <ProfessionRow
            key={profession.id}
            profession={profession}
            index={index}
            territoryKey={territory.key}
            isOpen={openSlug === profession.slug}
            onToggle={() =>
              setOpenSlug((current) => (current === profession.slug ? null : profession.slug))
            }
          />
        ))}
      </section>

      {composite && (
        <section className="mt-10">
          <CompositeCard
            profession={composite}
            territoryKey={territory.key}
            partCount={professions.length}
          />
        </section>
      )}

      <StartHere options={startOptions} accent={terminusAccent} />

      {skills.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white">ทักษะที่วิ่งข้ามทุกงานข้างบน</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            งานเปลี่ยนชื่อได้ ทักษะไม่เปลี่ยน เลือกหนึ่งอันแล้วดูว่ามันไปโผล่ที่ไหนอีกบ้าง
          </p>
          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {skills.map((skill) => (
              <li key={skill.id}>
                <Link
                  href={`/radar/skills/${skill.slug}`}
                  className="flex min-h-16 items-center gap-3 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{skill.name_th}</h3>
                    {skill.description_th && (
                      <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                        {skill.description_th}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-500" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
