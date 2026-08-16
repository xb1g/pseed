"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DmLeadBucket, FieldCoverage } from "@/lib/dm-leads/playbook";
import {
  DM_LEAD_OBJECTIONS,
  RUNG_META,
  scriptRungs,
  selectScripts,
  type DmLeadObjection,
  type DmLeadScript,
} from "@/lib/dm-leads/scripts";
import { personalizeLeadCopyAction } from "@/app/admin/dm-leads/actions";
import type { PersonalizeLead } from "@/lib/dm-leads/personalize";
import { DmLeadScriptCard } from "@/components/admin/DmLeadScriptCard";

interface DmLeadScriptsProps {
  bucket: DmLeadBucket;
  coverage: FieldCoverage;
  lead?: PersonalizeLead;
  /** Wires "แทรก" into the reply box. Omitted → copy-only. */
  onInsert?: (body: string) => void;
}

/**
 * The scripts for the selected lead, grouped by ladder rung so the operator
 * reads them in the order they are meant to be sent. Objections sit below,
 * collapsed, because they are situational rather than part of the ladder.
 */
export function DmLeadScripts({ bucket, coverage, lead, onInsert }: DmLeadScriptsProps) {
  const [objectionsOpen, setObjectionsOpen] = useState(false);
  const templates = useMemo(() => selectScripts(bucket, coverage), [bucket, coverage]);
  const [scripts, setScripts] = useState<DmLeadScript[]>(templates);
  const [objections, setObjections] = useState<DmLeadObjection[]>(DM_LEAD_OBJECTIONS);
  const rungs = useMemo(() => scriptRungs(scripts), [scripts]);
  const leadKey = lead
    ? [
        lead.displayName,
        lead.username,
        lead.gradeLevel,
        lead.interests?.join(","),
        lead.stage,
        lead.coverage,
        lead.lastInbound,
        lead.pathlabPayReady,
        lead.wantsPathlab,
        lead.wantsCommunity,
        lead.wantsTalent,
        lead.hasHandsOnExperience,
      ].join("|")
    : "";

  useEffect(() => {
    setScripts(templates);
    setObjections(DM_LEAD_OBJECTIONS);
    if (!lead) return;

    let cancelled = false;
    const rewrite = async () => {
      const [nextScripts, nextObjections] = await Promise.all([
        Promise.all(
          templates.map(async (script) => {
            const result = await personalizeLeadCopyAction({
              template: script.body,
              lead,
              kind: "script",
            });
            return { ...script, body: result.body };
          })
        ),
        Promise.all(
          DM_LEAD_OBJECTIONS.map(async (objection) => {
            const result = await personalizeLeadCopyAction({
              template: objection.body,
              lead,
              kind: "script",
            });
            return { ...objection, body: result.body };
          })
        ),
      ]);
      if (!cancelled) {
        setScripts(nextScripts);
        setObjections(nextObjections);
      }
    };
    void rewrite();
    return () => {
      cancelled = true;
    };
    // leadKey is the stable identity; `lead` is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadKey, templates]);

  return (
    <div className="space-y-2">
      {rungs.map((rung) => (
        <div key={rung} className="space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold">{RUNG_META[rung].label}</span>
            <span className="truncate text-[10px] text-muted-foreground">
              {RUNG_META[rung].goal}
            </span>
          </div>
          {scripts
            .filter((script) => script.rung === rung)
            .map((script) => (
              <DmLeadScriptCard
                key={script.id}
                label={script.label}
                body={script.body}
                note={script.note}
                onInsert={onInsert}
              />
            ))}
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() => setObjectionsOpen((open) => !open)}
          className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <span className="font-medium">ถ้าเขาโต้กลับ</span>
          <span className="text-[10px]">({objections.length} คำตอบ)</span>
          <ChevronDown
            className={cn("ml-auto h-3.5 w-3.5 transition-transform", objectionsOpen && "rotate-180")}
          />
        </button>
        {objectionsOpen && (
          <div className="mt-1.5 space-y-1.5">
            {objections.map((objection) => (
              <DmLeadScriptCard
                key={objection.id}
                label={objection.label}
                trigger={objection.trigger}
                body={objection.body}
                note={objection.note}
                onInsert={onInsert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
