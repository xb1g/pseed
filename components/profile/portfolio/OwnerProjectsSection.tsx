"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lightbulb, Pencil, Star } from "lucide-react";
import { toast } from "sonner";

import type {
  PortfolioCuration,
  ProjectCard,
} from "@/lib/profile/portfolio";
import { buildGapHints } from "@/lib/profile/portfolio";
import { createClient } from "@/utils/supabase/client";
import { ProjectCardBase } from "./ProjectCardBase";

export function OwnerProjectsSection({
  cards,
  curation,
  userId,
}: {
  cards: ProjectCard[];
  curation: PortfolioCuration;
  userId: string;
}) {
  const hints = buildGapHints(cards);

  return (
    <div className="space-y-5">
      {hints.length > 0 ? (
        <div className="space-y-2 rounded-[22px] border border-blue-300/20 bg-blue-400/[0.08] p-4">
          {hints.map((hint) => (
            <p
              key={hint.id}
              className="flex items-start gap-2.5 text-sm leading-6 text-blue-100"
            >
              <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-blue-200" />
              {hint.message}
            </p>
          ))}
        </div>
      ) : null}

      <ProjectsLayout
        cards={cards}
        renderActions={(card) => (
          <CardActions card={card} curation={curation} userId={userId} />
        )}
      />
    </div>
  );
}

export function ProjectsLayout({
  cards,
  renderActions,
}: {
  cards: ProjectCard[];
  renderActions?: (card: ProjectCard) => React.ReactNode;
}) {
  const hero = cards.find((card) => card.isHero);
  const supporting = cards.filter((card) => !card.isHero);

  return (
    <>
      {hero ? (
        <div className="mb-4">
          <ProjectCardBase
            card={hero}
            featured
            actions={renderActions?.(hero)}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {supporting.map((card) => (
          <ProjectCardBase
            key={card.key}
            card={card}
            actions={renderActions?.(card)}
          />
        ))}
      </div>
    </>
  );
}

function CardActions({
  card,
  curation,
  userId,
}: {
  card: ProjectCard;
  curation: PortfolioCuration;
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [editingImpact, setEditingImpact] = useState(false);
  const [impactDraft, setImpactDraft] = useState(card.impact ?? "");

  const saveHero = async () => {
    setSaving(true);
    try {
      const nextHero = card.isHero ? null : card.key;
      const { error } = await supabase
        .from("public_profiles")
        .update({ hero_project: nextHero })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(card.isHero ? "Hero unpinned" : `"${card.title}" is now your #1 piece`);
      router.refresh();
    } catch {
      toast.error("Couldn't update hero — is your portfolio saved once first?");
    } finally {
      setSaving(false);
    }
  };

  const saveImpact = async () => {
    setSaving(true);
    try {
      const notes = { ...curation.notes };
      const trimmed = impactDraft.trim();
      if (trimmed) {
        notes[card.key] = trimmed;
      } else {
        delete notes[card.key];
      }
      const { error } = await supabase
        .from("public_profiles")
        .update({ portfolio_notes: notes })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Impact line saved");
      setEditingImpact(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save impact line");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveHero}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            card.isHero
              ? "border-amber-300/30 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${card.isHero ? "fill-current" : ""}`} />
          {card.isHero ? "Unpin #1" : "Make #1 piece"}
        </button>
        <button
          type="button"
          onClick={() => setEditingImpact((current) => !current)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          {card.impact ? "Edit impact" : "Add impact line"}
        </button>
      </div>

      {editingImpact ? (
        <div className="space-y-2">
          <textarea
            value={impactDraft}
            onChange={(event) => setImpactDraft(event.target.value)}
            placeholder="This helped ___ because ___ (numbers beat adjectives: 37 users, 12 people, top 10)"
            rows={2}
            maxLength={280}
            className="ei-input w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveImpact}
              disabled={saving}
              className="ei-button-dawn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingImpact(false)}
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
