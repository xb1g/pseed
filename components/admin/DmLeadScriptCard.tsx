"use client";

import { useEffect, useState } from "react";
import { Check, Copy, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { countPlaceholders, splitPlaceholders } from "@/lib/dm-leads/scripts";

/**
 * One copy-pasteable script. The body is rendered with every `[วันที่]`-style
 * slot highlighted, because sending a script with an unfilled placeholder is
 * the single most likely operator error on this surface.
 */
interface DmLeadScriptCardProps {
  label: string;
  body: string;
  note?: string;
  /** Extra line above the label, e.g. the objection the lead raised. */
  trigger?: string;
  /** Drops the copy into the reply box. Omitted → copy only. */
  onInsert?: (body: string) => void;
}

export function DmLeadScriptCard({
  label,
  body,
  note,
  trigger,
  onInsert,
}: DmLeadScriptCardProps) {
  const [copied, setCopied] = useState(false);
  const placeholders = countPlaceholders(body);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-md border bg-background p-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {trigger && (
            <p className="truncate text-[10px] text-muted-foreground">“{trigger}”</p>
          )}
          <p className="truncate text-xs font-medium">{label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onInsert && (
            <button
              type="button"
              onClick={() => onInsert(body)}
              title="แทรกลงช่องตอบ"
              className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:bg-muted"
            >
              <CornerDownLeft className="h-3 w-3" />
              แทรก
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอก"
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              copied
                ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "hover:bg-muted"
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        </div>
      </div>

      <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
        {splitPlaceholders(body).map((segment, i) =>
          segment.placeholder ? (
            <mark
              key={i}
              className="rounded bg-amber-200 px-0.5 font-medium text-amber-950 dark:bg-amber-500/30 dark:text-amber-100"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={i}>{segment.text}</span>
          )
        )}
      </p>

      {placeholders > 0 && (
        <p className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          ⚠ ต้องเติม {placeholders} ช่องก่อนส่ง
        </p>
      )}
      {note && <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}
