"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface DmLeadFilterValues {
  grade: string;
  intent: string;
  platform: string;
  sort: string;
  search: string;
  status: string;
  tag: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "spam", label: "Spam" },
];

export const DM_LEAD_SEARCH_INPUT_ID = "dm-lead-search";

const GRADE_OPTIONS = [
  { value: "ม.3", label: "ม.3" },
  { value: "ม.4", label: "ม.4" },
  { value: "ม.5", label: "ม.5" },
  { value: "ม.6", label: "ม.6" },
  { value: "ปี 1", label: "ปี 1" },
  { value: "none", label: "ไม่ทราบชั้น" },
];

const INTENT_OPTIONS = [
  { value: "pay_ready", label: "🔥 พร้อมสมัคร" },
  { value: "pathlab", label: "อยากลอง PathLab" },
  { value: "community", label: "อยากเข้า Community" },
  { value: "talent", label: "หางาน/ฝึกงาน" },
  { value: "hands_on", label: "มีผลงานแล้ว" },
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "ล่าสุดก่อน" },
  { value: "waiting", label: "ค้างตอบนานสุด" },
];

interface DmLeadFiltersProps {
  values: DmLeadFilterValues;
  /** Live counts per lead status, shown inside the status options. */
  statusCounts?: Record<string, number>;
  /** Distinct admin tags in the current set, with counts — tag options. */
  tagCounts?: Record<string, number>;
}

/**
 * Search + dropdown filters for the DM leads inbox. Writes every change to
 * the URL so the server component re-queries and filters stay shareable.
 */
export function DmLeadFilters({ values, statusCounts, tagCounts }: DmLeadFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(values.search);
  const isFirstRender = useRef(true);

  // Debounce search → URL. Skip the initial mount so we don't loop.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => pushParams({ search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const pushParams = (patch: Partial<DmLeadFilterValues>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value && value !== "all" && !(key === "sort" && value === "newest")) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/admin/dm-leads?${qs}` : "/admin/dm-leads");
  };

  const hasActiveFilters =
    values.grade !== "all" ||
    values.intent !== "all" ||
    values.platform !== "all" ||
    values.sort !== "newest" ||
    values.search !== "" ||
    values.status !== "all" ||
    values.tag !== "all";

  const clearAll = () => {
    setSearch("");
    const params = new URLSearchParams(window.location.search);
    for (const key of ["grade", "intent", "platform", "sort", "search", "status", "tag"])
      params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/admin/dm-leads?${qs}` : "/admin/dm-leads");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={DM_LEAD_SEARCH_INPUT_ID}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / username…  ( / )"
          className="w-56 pl-8"
        />
      </div>

      <Select value={values.grade} onValueChange={(v) => pushParams({ grade: v })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="ชั้นปี" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกชั้นปี</SelectItem>
          {GRADE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.intent} onValueChange={(v) => pushParams({ intent: v })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="ความต้องการ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกความต้องการ</SelectItem>
          {INTENT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.platform} onValueChange={(v) => pushParams({ platform: v })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="แพลตฟอร์ม" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกแพลตฟอร์ม</SelectItem>
          {PLATFORM_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.status} onValueChange={(v) => pushParams({ status: v })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกสถานะ</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
              {statusCounts?.[o.value] ? ` (${statusCounts[o.value]})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {tagCounts && Object.keys(tagCounts).length > 0 && (
        <Select value={values.tag} onValueChange={(v) => pushParams({ tag: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="แท็ก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกแท็ก</SelectItem>
            {Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => (
                <SelectItem key={tag} value={tag}>
                  {tag} ({count})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}

      <Select value={values.sort} onValueChange={(v) => pushParams({ sort: v })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="เรียงตาม" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
        </Button>
      )}
    </div>
  );
}
