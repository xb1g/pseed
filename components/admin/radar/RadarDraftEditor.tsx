"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Settings2,
  Loader2,
} from "lucide-react";
import {
  RadarCardView,
  RadarInlineEditorContext,
} from "@/components/radar/RadarCards";
import {
  moveRadarEditorCard,
  type RadarEditorCard,
  updateRadarEditorContent,
} from "@/lib/radar/editor-state";

type CanonicalField = {
  field: Record<string, unknown>;
  cards: Array<Record<string, unknown>>;
};

const KIND_LABELS: Record<string, string> = {
  hook: "เปิดเรื่อง",
  fantasyReality: "ความจริงของงาน",
  dayInLife: "หนึ่งวันทำงาน",
  salaryProgression: "รายได้",
  aiImpact: "ผลกระทบจาก AI",
  marketThailand: "โอกาสในไทย",
  risks: "สิ่งที่ต้องรู้",
  entryRoutes: "เส้นทางเข้าสู่อาชีพ",
  text: "เนื้อหา",
  cta: "ชวนลงมือ",
  sources: "แหล่งข้อมูล",
  reflection: "คำถามสะท้อน",
};

function contentFor(card: RadarEditorCard, locale: "th" | "en") {
  const preferred = locale === "th" ? card.content_th : card.content_en;
  return preferred ?? card.content_th ?? card.content_en ?? {};
}

function chapterLabel(card: RadarEditorCard, index: number) {
  const content = card.content_th ?? card.content_en ?? {};
  return String(content.eyebrow || content.title || KIND_LABELS[card.kind] || `Chapter ${index + 1}`);
}

function ScalarInspector({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
}) {
  const fields = Object.entries(content).filter(
    ([key, value]) =>
      !["eyebrow", "title", "source_refs"].includes(key) &&
      (typeof value === "string" || typeof value === "number")
  );
  const arrays = Object.entries(content).filter(([, value]) =>
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );

  if (fields.length === 0 && arrays.length === 0) {
    return <p className="text-sm text-muted-foreground">Edit visible headings directly in the preview.</p>;
  }

  return (
    <div className="space-y-4">
      {fields.map(([key, value]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`radar-${key}`} className="capitalize">{key.replaceAll("_", " ")}</Label>
          <Input
            id={`radar-${key}`}
            value={String(value)}
            onChange={(event) => onChange(key, event.target.value)}
          />
        </div>
      ))}
      {arrays.map(([key, value]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`radar-${key}`} className="capitalize">{key.replaceAll("_", " ")}</Label>
          <Textarea
            id={`radar-${key}`}
            value={(value as string[]).join("\n")}
            rows={6}
            onChange={(event) => onChange(key, event.target.value)}
          />
          <p className="text-xs text-muted-foreground">One item per line</p>
        </div>
      ))}
    </div>
  );
}

export function RadarDraftEditor({ canonical }: { canonical: CanonicalField }) {
  const field = canonical.field;
  const [cards, setCards] = useState<RadarEditorCard[]>(
    canonical.cards.map((card, index) => ({
      ...card,
      id: String(card.id),
      kind: String(card.kind),
      position: Number(card.position ?? index * 10),
    })) as RadarEditorCard[]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [locale, setLocale] = useState<"th" | "en">("th");
  const [showInspector, setShowInspector] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [revision, setRevision] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const selected = cards[selectedIndex];
  const content = useMemo(
    () => (selected ? contentFor(selected, locale) : {}),
    [selected, locale]
  );
  const accent = String(field.color ?? "#7dd3fc");
  const fieldId = String(field.id ?? "");

  useEffect(() => {
    if (!fieldId) return;
    let active = true;
    fetch(`/api/admin/radar/fields/${fieldId}/draft`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the saved draft");
        return response.json();
      })
      .then((result) => {
        if (!active) return;
        if (result.draft?.cards) {
          setCards(result.draft.cards);
          setRevision(result.revision);
          setSaveState("saved");
          setSaveMessage("Saved draft loaded");
        } else {
          setSaveState("idle");
        }
      })
      .catch((error) => {
        if (!active) return;
        setSaveState("error");
        setSaveMessage(error instanceof Error ? error.message : "Could not load draft");
      });
    return () => {
      active = false;
    };
  }, [fieldId]);

  const saveDraft = async () => {
    if (!fieldId || saveState === "saving") return;
    setSaveState("saving");
    setSaveMessage("");
    try {
      const response = await fetch(`/api/admin/radar/fields/${fieldId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          cards,
          expectedRevision: revision,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save draft");
      setRevision(result.revision);
      setDirty(false);
      setSaveState("saved");
      setSaveMessage("Draft saved");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Could not save draft");
    }
  };

  const updateContent = (path: string[], value: unknown) => {
    if (!selected) return;
    setCards((current) =>
      current.map((card, index) =>
        index === selectedIndex
          ? updateRadarEditorContent(card, locale, path, value)
          : card
      )
    );
    setDirty(true);
  };

  const moveSelected = (direction: -1 | 1) => {
    const nextIndex = selectedIndex + direction;
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    setCards((current) => moveRadarEditorCard(current, selectedIndex, direction));
    setSelectedIndex(nextIndex);
    setDirty(true);
  };

  const toggleVisibility = () => {
    setCards((current) =>
      current.map((card, index) =>
        index === selectedIndex ? { ...card, is_hidden: !card.is_hidden } : card
      )
    );
    setDirty(true);
  };

  if (!selected) {
    return <div className="rounded-xl border p-8 text-center text-muted-foreground">No Radar chapters yet.</div>;
  }

  return (
    <div className="min-h-[760px] overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${saveState === "error" ? "bg-red-500" : dirty ? "bg-amber-500" : "bg-emerald-500"}`} />
          <div>
            <span className="text-sm font-medium">
              {saveState === "loading" ? "Loading draft…" : saveState === "saving" ? "Saving…" : dirty ? "Unsaved changes" : revision ? "Draft saved" : "Published content"}
            </span>
            {saveMessage && <p className={`text-xs ${saveState === "error" ? "text-red-500" : "text-muted-foreground"}`}>{saveMessage}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-1">
            {(["th", "en"] as const).map((language) => (
              <Button
                key={language}
                type="button"
                size="sm"
                variant={locale === language ? "secondary" : "ghost"}
                onClick={() => setLocale(language)}
              >
                {language === "th" ? "ไทย" : "EN"}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => setShowInspector((value) => !value)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Details
          </Button>
          <Button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveState === "loading" || saveState === "saving"}
          >
            {saveState === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saveState === "saving" ? "Saving" : "Save draft"}
          </Button>
        </div>
      </div>

      <div className={`grid min-h-[700px] ${showInspector ? "lg:grid-cols-[14rem_minmax(0,1fr)_19rem]" : "lg:grid-cols-[14rem_minmax(0,1fr)]"}`}>
        <nav className="border-r bg-muted/20 p-3" aria-label="Radar chapters">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapters · {cards.length}
          </p>
          <div className="space-y-1">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedIndex === index ? "bg-foreground text-background" : "hover:bg-muted"
                } ${card.is_hidden ? "opacity-45" : ""}`}
              >
                <span className="w-5 text-xs tabular-nums opacity-60">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{chapterLabel(card, index)}</span>
                {card.is_hidden && <EyeOff className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </nav>

        <main className="relative flex min-w-0 flex-col bg-neutral-950 text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs text-neutral-500">{KIND_LABELS[selected.kind] ?? selected.kind}</p>
              <p className="text-sm font-semibold text-white">Click text in the preview to edit</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => moveSelected(-1)} disabled={selectedIndex === 0} aria-label="Move chapter up">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => moveSelected(1)} disabled={selectedIndex === cards.length - 1} aria-label="Move chapter down">
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={toggleVisibility} aria-label={selected.is_hidden ? "Show chapter" : "Hide chapter"}>
                {selected.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center overflow-y-auto px-6 py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(circle at 50% 20%, ${accent}, transparent 55%)` }}
            />
            <div className="relative mx-auto w-full max-w-xl">
              <RadarInlineEditorContext.Provider
                value={{
                  onChange: (path, value) => updateContent(path, value),
                }}
              >
                <RadarCardView
                  kind={selected.kind}
                  content={content}
                  accent={accent}
                  squadUrl={String(field.squad_url ?? "") || null}
                  reflectionSubmitted={false}
                  showSignupPrompt={false}
                  onReflect={() => undefined}
                />
              </RadarInlineEditorContext.Provider>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <Button type="button" variant="ghost" onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))} disabled={selectedIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-neutral-500">{selectedIndex + 1} / {cards.length}</span>
            <Button type="button" variant="ghost" onClick={() => setSelectedIndex((index) => Math.min(cards.length - 1, index + 1))} disabled={selectedIndex === cards.length - 1}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>

        {showInspector && (
          <aside className="border-l p-4">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</p>
              <h3 className="mt-1 font-semibold">Technical fields</h3>
              <p className="mt-1 text-xs text-muted-foreground">Only fields that are awkward to edit on canvas appear here.</p>
            </div>
            <div className="mb-5 flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="chapter-visible">Visible</Label>
              <Switch id="chapter-visible" checked={!selected.is_hidden} onCheckedChange={toggleVisibility} />
            </div>
            <ScalarInspector
              content={content}
              onChange={(key, value) =>
                updateContent(
                  [key],
                  Array.isArray(content[key])
                    ? value.split("\n").map((item) => item.trim()).filter(Boolean)
                    : value
                )
              }
            />
          </aside>
        )}
      </div>
    </div>
  );
}
