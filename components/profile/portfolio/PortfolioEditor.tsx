"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit3, Globe, Save } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioIdentity } from "@/lib/profile/portfolio";
import { createClient } from "@/utils/supabase/client";

const TRACK_OPTIONS = ["dev", "video", "strategy", "design", "other"] as const;
const SEEKING_OPTIONS = [
  "internship",
  "freelance",
  "collaboration",
  "not-looking",
] as const;

export function PortfolioEditor({ identity }: { identity: PortfolioIdentity }) {
  const router = useRouter();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [handle, setHandle] = useState(identity.handle ?? "");
  const [headline, setHeadline] = useState(identity.headline ?? "");
  const [track, setTrack] = useState(identity.track ?? "");
  const [seeking, setSeeking] = useState(identity.seeking ?? "");
  const [tools, setTools] = useState(identity.tools.join(", "));
  const [links, setLinks] = useState(identity.portfolioLinks.join("\n"));

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextHandle = handle.trim().toLowerCase();
      if (nextHandle && !/^[a-z0-9_-]{3,30}$/.test(nextHandle)) {
        toast.error(
          "Handle must be 3-30 chars: lowercase letters, numbers, _ or -",
        );
        return;
      }

      const { error } = await supabase.from("public_profiles").upsert({
        user_id: identity.userId,
        handle: nextHandle || null,
        headline: headline.trim() || null,
        track: track || null,
        seeking: seeking || null,
        tools: splitCsv(tools, 20),
        portfolio_links: splitLines(links, 10),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("That handle is already taken");
        } else {
          toast.error("Failed to save portfolio");
        }
        return;
      }

      toast.success("Portfolio saved");
      setIsEditing(false);
      if (nextHandle && nextHandle !== identity.handle) {
        router.push(`/u/${nextHandle}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const nextPublic = !identity.isPublic;
      const sections = Array.from(
        new Set([...identity.publishedSections, "portfolio"]),
      );
      const { error } = await supabase.rpc("set_profile_visibility", {
        p_user_id: identity.userId,
        p_is_public: nextPublic,
        p_published_sections: sections,
      });

      if (error) {
        toast.error("Failed to update visibility");
        return;
      }

      toast.success(nextPublic ? "Portfolio is now public" : "Portfolio is now private");
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex w-full flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="ei-button-dawn inline-flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Edit3 className="h-4 w-4" />
          Edit portfolio
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <Globe className="h-4 w-4" />
          {publishing
            ? "Updating..."
            : identity.isPublic
              ? "Make private"
              : "Publish portfolio"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 border-t border-white/10 pt-4">
      <Field label="Handle">
        <Input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder={identity.username}
          className="ei-input h-10 border-white/10 bg-white/[0.04]"
        />
        <p className="text-xs text-slate-400">
          passionseed.space/u/{handle.trim().toLowerCase() || identity.username}
        </p>
      </Field>

      <Field label="Headline">
        <Input
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="Builder who ships, 16, Bangkok"
          className="ei-input h-10 border-white/10 bg-white/[0.04]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Track">
          <select
            value={track}
            onChange={(event) => setTrack(event.target.value as typeof track)}
            className="ei-select h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white"
          >
            <option value="">Not set</option>
            {TRACK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Seeking">
          <select
            value={seeking}
            onChange={(event) => setSeeking(event.target.value as typeof seeking)}
            className="ei-select h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white"
          >
            <option value="">Not set</option>
            {SEEKING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Tools (comma separated, max 20)">
        <Input
          value={tools}
          onChange={(event) => setTools(event.target.value)}
          placeholder="Figma, Premiere, TypeScript"
          className="ei-input h-10 border-white/10 bg-white/[0.04]"
        />
      </Field>

      <Field label="Portfolio links (one per line, max 10)">
        <textarea
          value={links}
          onChange={(event) => setLinks(event.target.value)}
          placeholder={"https://github.com/you\nhttps://youtube.com/@you"}
          rows={3}
          className="ei-input w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ei-button-dawn inline-flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="ei-label text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </Label>
      {children}
    </div>
  );
}

function splitCsv(value: string, max: number): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function splitLines(value: string, max: number): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//.test(item))
    .slice(0, max);
}
