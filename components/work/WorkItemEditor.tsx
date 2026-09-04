"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkArea, WorkItem, WorkItemInput, WorkItemPatch } from "@/lib/work/work-items";

import styles from "./work.module.css";

type EditorDraft = {
  title: string;
  description: string;
  status: string;
  funnelStage: string;
  channel: string;
  offer: string;
  ownerName: string;
  dueOn: string;
  format: string;
  cta: string;
  segment: string;
  hypothesis: string;
  passBar: string;
  result: string;
  nextMove: string;
  decision: string;
};

function getDraft(area: WorkArea, item: WorkItem | null): EditorDraft {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    status: item?.status ?? (area === "marketing" ? "idea" : "decide"),
    funnelStage: item?.funnelStage ?? "tofu",
    channel: item?.channel ?? "instagram",
    offer: item?.offer ?? "both",
    ownerName: item?.ownerName ?? "Unassigned",
    dueOn: item?.dueOn ?? "",
    format: item?.details.format ?? "",
    cta: item?.details.cta ?? "",
    segment: item?.details.segment ?? "",
    hypothesis: item?.details.hypothesis ?? "",
    passBar: item?.details.passBar ?? "",
    result: item?.details.result ?? "",
    nextMove: item?.details.nextMove ?? "",
    decision: item?.details.decision ?? "",
  };
}

export function WorkItemEditor({
  area,
  item,
  open,
  disabled,
  saving,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  area: "marketing" | "product";
  item: WorkItem | null;
  open: boolean;
  disabled: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: WorkItemInput) => Promise<unknown>;
  onUpdate: (patch: WorkItemPatch) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState(() => getDraft(area, item));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(getDraft(area, item));
      setError(null);
    }
  }, [area, item, open]);

  function change(key: keyof EditorDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const details: Record<string, string> = area === "marketing"
      ? { format: draft.format, cta: draft.cta }
      : {
          segment: draft.segment,
          hypothesis: draft.hypothesis,
          passBar: draft.passBar,
          result: draft.result,
          nextMove: draft.nextMove,
          decision: draft.decision,
        };
    const base: Omit<WorkItemPatch, "id"> = {
      title: draft.title,
      description: draft.description,
      status: draft.status as WorkItemInput["status"],
      ownerName: draft.ownerName,
      dueOn: draft.dueOn || null,
      details,
    };

    try {
      if (item) {
        await onUpdate({
          id: item.id,
          ...base,
          ...(area === "marketing" && {
            funnelStage: draft.funnelStage as NonNullable<WorkItemInput["funnelStage"]>,
            channel: draft.channel as NonNullable<WorkItemInput["channel"]>,
            offer: draft.offer as NonNullable<WorkItemInput["offer"]>,
          }),
        });
      } else {
        const input: WorkItemInput = {
          area,
          kind: area === "marketing" ? "content" : "bet",
          title: draft.title,
          description: draft.description,
          status: draft.status as WorkItemInput["status"],
          funnelStage: area === "marketing" ? draft.funnelStage as NonNullable<WorkItemInput["funnelStage"]> : null,
          channel: area === "marketing" ? draft.channel as NonNullable<WorkItemInput["channel"]> : null,
          offer: area === "marketing" ? draft.offer as NonNullable<WorkItemInput["offer"]> : null,
          ownerName: draft.ownerName,
          dueOn: draft.dueOn || null,
          position: 999_999,
          details,
        };
        await onCreate(input);
      }
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this item.");
    }
  }

  const label = area === "marketing" ? "content idea" : "product bet";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.editorDialog} overlayClassName="bg-black/75 backdrop-blur-sm">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-kodchasan text-xl text-white">
              {item ? `Edit ${label}` : `Add ${label}`}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {area === "marketing"
                ? "Attach the idea to an audience question, owner, and next publishing state."
                : "Define who, what must be true, and the result that changes the decision."}
            </DialogDescription>
          </DialogHeader>

          <fieldset disabled={disabled || saving} className="mt-6 space-y-5 disabled:opacity-60">
            <EditorField label="Title" required>
              <input value={draft.title} onChange={(event) => change("title", event.target.value)} required maxLength={160} className={styles.editorInput} />
            </EditorField>
            <EditorField label={area === "marketing" ? "Hook" : "Evidence"} required>
              <textarea value={draft.description} onChange={(event) => change("description", event.target.value)} required rows={3} maxLength={1200} className={styles.editorInput} />
            </EditorField>

            <div className="grid gap-4 sm:grid-cols-2">
              <EditorField label="Owner" required>
                <input value={draft.ownerName} onChange={(event) => change("ownerName", event.target.value)} required maxLength={80} className={styles.editorInput} />
              </EditorField>
              <EditorField label="Due date">
                <input type="date" value={draft.dueOn} onChange={(event) => change("dueOn", event.target.value)} className={styles.editorInput} />
              </EditorField>
            </div>

            {area === "marketing" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <EditorSelect label="Stage" value={draft.funnelStage} onChange={(value) => change("funnelStage", value)} options={["tofu", "mofu", "bofu"]} />
                  <EditorSelect label="Channel" value={draft.channel} onChange={(value) => change("channel", value)} options={["instagram", "facebook", "both"]} />
                  <EditorSelect label="Offer" value={draft.offer} onChange={(value) => change("offer", value)} options={["techseed", "shift", "both"]} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Format" required>
                    <input value={draft.format} onChange={(event) => change("format", event.target.value)} required className={styles.editorInput} />
                  </EditorField>
                  <EditorField label="Call to action" required>
                    <input value={draft.cta} onChange={(event) => change("cta", event.target.value)} required className={styles.editorInput} />
                  </EditorField>
                </div>
                <EditorSelect label="Status" value={draft.status} onChange={(value) => change("status", value)} options={["idea", "draft", "ready", "published"]} />
              </>
            ) : (
              <>
                <EditorField label="Exact segment" required>
                  <input value={draft.segment} onChange={(event) => change("segment", event.target.value)} required maxLength={1200} className={styles.editorInput} />
                </EditorField>
                <EditorField label="Falsifiable hypothesis" required>
                  <textarea value={draft.hypothesis} onChange={(event) => change("hypothesis", event.target.value)} required rows={2} maxLength={1200} className={styles.editorInput} />
                </EditorField>
                <EditorField label="Pass bar, set before testing" required>
                  <textarea value={draft.passBar} onChange={(event) => change("passBar", event.target.value)} required rows={2} maxLength={1200} className={styles.editorInput} />
                </EditorField>
                <EditorField label="Cheapest credible test" required>
                  <textarea value={draft.nextMove} onChange={(event) => change("nextMove", event.target.value)} required rows={2} className={styles.editorInput} />
                </EditorField>
                <EditorField label="Observed result">
                  <textarea value={draft.result} onChange={(event) => change("result", event.target.value)} rows={2} maxLength={1200} placeholder="Leave blank until evidence arrives" className={styles.editorInput} />
                </EditorField>
                <EditorField label="Decision this unlocks" required>
                  <input value={draft.decision} onChange={(event) => change("decision", event.target.value)} required className={styles.editorInput} />
                </EditorField>
                <EditorSelect label="Status" value={draft.status} onChange={(value) => change("status", value)} options={["decide", "validate", "build", "learn", "done"]} />
              </>
            )}
          </fieldset>

          {error && <p className={styles.editorError} role="alert">{error} Check your connection, then try again.</p>}

          <DialogFooter className="mt-7 gap-2 sm:space-x-0">
            <button type="button" onClick={() => onOpenChange(false)} className={styles.secondaryButton}>Cancel</button>
            <button type="submit" disabled={disabled || saving} className={styles.primaryButton}>
              {saving ? "Saving…" : item ? `Save ${label}` : `Add ${label}`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditorField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className={styles.editorLabel}>
      <span>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function EditorSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <EditorField label={label} required>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={styles.editorInput}>
        {options.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
      </select>
    </EditorField>
  );
}
