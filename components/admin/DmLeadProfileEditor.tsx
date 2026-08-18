"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLeadMetaUpdater } from "@/components/admin/DmLeadManageBar";
import type { LeadMetaPatch } from "@/app/admin/dm-leads/actions";
import type { DmConversation, DmLeadStage } from "@/types/dm-leads";

const PRESET_GRADES = ["ม.3", "ม.4", "ม.5", "ม.6", "ปี 1"];

const COMMON_FACULTIES = [
  "แพทยศาสตร์",
  "วิศวกรรมศาสตร์",
  "วิศวกรรมคอมพิวเตอร์",
  "วิทยาการคอมพิวเตอร์",
  "บริหารธุรกิจ",
  "วิทยาศาสตร์สุขภาพ",
  "ทันตแพทยศาสตร์",
  "เภสัชศาสตร์",
  "สัตวแพทยศาสตร์",
  "พยาบาลศาสตร์",
  "เศรษฐศาสตร์",
  "นิติศาสตร์",
  "นิเทศศาสตร์",
  "สถาปัตยกรรมศาสตร์",
];

const STAGES: { value: DmLeadStage; label: string }[] = [
  { value: "exploring", label: "Exploring (หาตัวตน)" },
  { value: "building", label: "Building (มีผลงาน)" },
  { value: "job_seeking", label: "Job Seeking (หางาน)" },
];

interface DmLeadProfileEditorProps {
  conversation: Pick<DmConversation, "id" | "grade_level" | "interests" | "stage">;
  onChange?: (patch: LeadMetaPatch) => void;
}

export function DmLeadProfileEditor({ conversation, onChange }: DmLeadProfileEditorProps) {
  const [customInterest, setCustomInterest] = useState("");
  const { apply, isPending } = useLeadMetaUpdater(conversation.id, onChange);

  const setGrade = (grade: string | null) => {
    apply({ grade_level: grade });
  };

  const toggleInterest = (interest: string) => {
    const current = conversation.interests ?? [];
    const has = current.includes(interest);
    const updated = has ? current.filter((i) => i !== interest) : [...current, interest];
    apply({ interests: updated });
  };

  const addCustomInterest = () => {
    const val = customInterest.trim();
    setCustomInterest("");
    if (!val) return;
    const current = conversation.interests ?? [];
    if (current.includes(val)) return;
    apply({ interests: [...current, val] });
  };

  const setStage = (stage: DmLeadStage) => {
    apply({ stage });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 py-0.5 text-xs", isPending && "opacity-70")}>
      {/* Grade Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
            title="เปลี่ยนระดับชั้น"
          >
            <span className="text-muted-foreground">ชั้น:</span>
            <strong className="text-foreground">{conversation.grade_level || "ไม่ระบุ"}</strong>
            <span className="text-[10px] text-muted-foreground">▾</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-xs">
          <DropdownMenuLabel className="text-[11px]">เลือกระดับชั้น</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRESET_GRADES.map((g) => (
            <DropdownMenuItem
              key={g}
              onClick={() => setGrade(g)}
              className={cn(conversation.grade_level === g && "font-bold text-foreground")}
            >
              {g} {conversation.grade_level === g && "✓"}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setGrade(null)} className="text-muted-foreground">
            ล้างค่า (ไม่ระบุ)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stage Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
            title="เปลี่ยน Stage"
          >
            <span className="text-muted-foreground">Stage:</span>
            <strong className="text-foreground capitalize">{conversation.stage}</strong>
            <span className="text-[10px] text-muted-foreground">▾</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-xs">
          <DropdownMenuLabel className="text-[11px]">เปลี่ยน Stage</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STAGES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => setStage(s.value)}
              className={cn(conversation.stage === s.value && "font-bold text-foreground")}
            >
              {s.label} {conversation.stage === s.value && "✓"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Interests Chips */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[11px] text-muted-foreground">สาย:</span>
        {conversation.interests && conversation.interests.length > 0 ? (
          conversation.interests.map((interest) => (
            <Badge
              key={interest}
              variant="default"
              className="cursor-pointer px-1.5 py-0 text-[10px] transition-opacity hover:opacity-80"
              title="คลิกเพื่อลบ"
              onClick={() => toggleInterest(interest)}
            >
              {interest} ×
            </Badge>
          ))
        ) : (
          <span className="text-[11px] text-amber-600 dark:text-amber-400">ยังไม่ระบุ</span>
        )}

        {/* Add/Select Major Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center rounded border border-dashed px-1.5 py-0 text-[10px] font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
            >
              + เลือกสาย ▾
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto text-xs">
            <DropdownMenuLabel className="text-[11px]">เลือกคณะ / สายที่สนใจ</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COMMON_FACULTIES.map((fac) => {
              const active = conversation.interests?.includes(fac);
              return (
                <DropdownMenuItem
                  key={fac}
                  onClick={() => toggleInterest(fac)}
                  className={cn(active && "font-bold text-foreground")}
                >
                  {fac} {active && "✓"}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCustomInterest();
            }
          }}
          placeholder="+ พิมพ์สาย..."
          className="h-5 w-20 px-1.5 text-[10px]"
        />
      </div>
    </div>
  );
}
