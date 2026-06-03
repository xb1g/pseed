"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

type Slot = { day_of_week: number; hour: number; minute: number };

type Props = {
  slots: Slot[];
  onChange: (slots: Slot[]) => void;
};

function slotKey(day: number, hour: number, minute: number) {
  return `${day}-${hour}-${minute}`;
}

function parseSlotKey(key: string) {
  const [day, hour, minute] = key.split("-").map(Number);
  return { day, hour, minute };
}

function isActive(slots: Slot[], day: number, hour: number, minute: number): boolean {
  return slots.some((s) => s.day_of_week === day && s.hour === hour && (s.minute ?? 0) === minute);
}

function toggle(slots: Slot[], day: number, hour: number, minute: number): Slot[] {
  if (isActive(slots, day, hour, minute)) {
    return slots.filter((s) => !(s.day_of_week === day && s.hour === hour && (s.minute ?? 0) === minute));
  }
  return [...slots, { day_of_week: day, hour, minute }];
}

export default function MentorAvailabilityGrid({ slots, onChange }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  const allSlotKeys = new Set(slots.map((s) => slotKey(s.day_of_week, s.hour, s.minute)));

  const getDragSelection = useCallback(() => {
    if (!dragStart || !dragEnd) return new Set<string>();
    const start = parseSlotKey(dragStart);
    const end = parseSlotKey(dragEnd);
    const minDay = Math.min(start.day, end.day);
    const maxDay = Math.max(start.day, end.day);
    const startTime = start.hour * 60 + start.minute;
    const endTime = end.hour * 60 + end.minute;
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    const selected = new Set<string>();
    for (let day = minDay; day <= maxDay; day++) {
      for (let hour = 0; hour < 24; hour++) {
        for (const minute of [0, 30]) {
          const time = hour * 60 + minute;
          if (time >= minTime && time <= maxTime) {
            selected.add(slotKey(day, hour, minute));
          }
        }
      }
    }
    return selected;
  }, [dragStart, dragEnd]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, key: string) => {
      e.preventDefault();
      const { day, hour, minute } = parseSlotKey(key);
      const currentlyActive = isActive(slots, day, hour, minute);
      const mode = currentlyActive ? "remove" : "add";
      setDragMode(mode);
      setDragStart(key);
      setDragEnd(key);
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [slots]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const colWidth = rect.width / 8;
      const col = Math.floor(x / colWidth);
      if (col < 1 || col > 7) return;
      const day = col - 1;
      const rows = gridRef.current.querySelectorAll<HTMLDivElement>("[data-time-row]");
      for (const row of rows) {
        const rowRect = row.getBoundingClientRect();
        if (e.clientY >= rowRect.top && e.clientY < rowRect.bottom) {
          const key = row.getAttribute("data-time-row");
          if (key) {
            const { hour, minute } = parseSlotKey(key);
            setDragEnd(slotKey(day, hour, minute));
            break;
          }
        }
      }
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !dragMode || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const selection = getDragSelection();
    let newSlots = [...slots];
    if (dragStart === dragEnd) {
      const { day, hour, minute } = parseSlotKey(dragStart);
      newSlots = toggle(newSlots, day, hour, minute);
    } else {
      for (const key of selection) {
        const { day, hour, minute } = parseSlotKey(key);
        const currentlyActive = isActive(newSlots, day, hour, minute);
        if (dragMode === "add" && !currentlyActive) {
          newSlots.push({ day_of_week: day, hour, minute });
        } else if (dragMode === "remove" && currentlyActive) {
          newSlots = newSlots.filter(
            (s) => !(s.day_of_week === day && s.hour === hour && (s.minute ?? 0) === minute)
          );
        }
      }
    }
    onChange(newSlots);
    setIsDragging(false);
    setDragMode(null);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragMode, dragStart, dragEnd, getDragSelection, slots, onChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, key: string) => {
      const { day, hour, minute } = parseSlotKey(key);
      const currentlyActive = isActive(slots, day, hour, minute);
      const mode = currentlyActive ? "remove" : "add";
      setDragMode(mode);
      setDragStart(key);
      setDragEnd(key);
      setTouchDragging(true);
      setIsDragging(true);
    },
    [slots]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchDragging || !gridRef.current) return;
      const touch = e.touches[0];
      const rect = gridRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const colWidth = rect.width / 8;
      const col = Math.floor(x / colWidth);
      if (col < 1 || col > 7) return;
      const day = col - 1;
      const rows = gridRef.current.querySelectorAll<HTMLDivElement>("[data-time-row]");
      for (const row of rows) {
        const rowRect = row.getBoundingClientRect();
        if (touch.clientY >= rowRect.top && touch.clientY < rowRect.bottom) {
          const key = row.getAttribute("data-time-row");
          if (key) {
            const { hour, minute } = parseSlotKey(key);
            setDragEnd(slotKey(day, hour, minute));
            break;
          }
        }
      }
    },
    [touchDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !dragMode || !dragStart || !dragEnd) {
      setTouchDragging(false);
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const selection = getDragSelection();
    let newSlots = [...slots];
    if (dragStart === dragEnd) {
      const { day, hour, minute } = parseSlotKey(dragStart);
      newSlots = toggle(newSlots, day, hour, minute);
    } else {
      for (const key of selection) {
        const { day, hour, minute } = parseSlotKey(key);
        const currentlyActive = isActive(newSlots, day, hour, minute);
        if (dragMode === "add" && !currentlyActive) {
          newSlots.push({ day_of_week: day, hour, minute });
        } else if (dragMode === "remove" && currentlyActive) {
          newSlots = newSlots.filter(
            (s) => !(s.day_of_week === day && s.hour === hour && (s.minute ?? 0) === minute)
          );
        }
      }
    }
    onChange(newSlots);
    setTouchDragging(false);
    setIsDragging(false);
    setDragMode(null);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragMode, dragStart, dragEnd, getDragSelection, slots, onChange]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const dragSelection = getDragSelection();

  const setWeekdays9to17 = () => {
    const newSlots: Slot[] = [];
    for (let day = 0; day <= 4; day++) {
      for (let hour = 9; hour <= 17; hour++) {
        newSlots.push({ day_of_week: day, hour, minute: 0 });
        newSlots.push({ day_of_week: day, hour, minute: 30 });
      }
    }
    onChange(newSlots);
  };

  const toggleDay = (day: number) => {
    const hasDaySlots = slots.some((s) => s.day_of_week === day);
    if (hasDaySlots) {
      onChange(slots.filter((s) => s.day_of_week !== day));
    } else {
      const newSlots: Slot[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        newSlots.push({ day_of_week: day, hour, minute: 0 });
        newSlots.push({ day_of_week: day, hour, minute: 30 });
      }
      onChange([...slots, ...newSlots]);
    }
  };

  const toggleTimeRange = (hour: number, minute: number) => {
    const key = slotKey(0, hour, minute);
    const hasAny = DAYS.some((_, day) => isActive(slots, day, hour, minute));
    if (hasAny) {
      onChange(slots.filter((s) => !(s.hour === hour && (s.minute ?? 0) === minute)));
    } else {
      const newSlots: Slot[] = [];
      for (let day = 0; day < 7; day++) {
        newSlots.push({ day_of_week: day, hour, minute });
      }
      onChange([...slots, ...newSlots]);
    }
  };

  const toggleCollapsed = (day: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-[family-name:var(--font-mitr)]"
          style={{ color: "#5a7a94" }}
        >
          {isDragging ? (dragMode === "add" ? "Selecting…" : "Removing…") : "Drag to select time blocks"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs px-3 py-1 rounded-lg transition-colors font-[family-name:var(--font-mitr)]"
            style={{
              background: "rgba(74,107,130,0.2)",
              color: "#5a7a94",
              border: "1px solid rgba(74,107,130,0.3)",
            }}
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={setWeekdays9to17}
            className="text-xs px-3 py-1 rounded-lg transition-colors font-[family-name:var(--font-mitr)]"
            style={{
              background: "rgba(145,196,227,0.12)",
              color: "#91C4E3",
              border: "1px solid rgba(145,196,227,0.25)",
            }}
          >
            Weekdays 9–17
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
        <div ref={gridRef} className="select-none">
          {/* Header row */}
          <div
            className="grid gap-px mb-1"
            style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
          >
            <div />
            {DAYS.map((d, dayIdx) => (
              <div
                key={d}
                className="text-center pb-1"
              >
                <button
                  type="button"
                  onClick={() => toggleCollapsed(dayIdx)}
                  className="text-[10px] font-[family-name:var(--font-mitr)] transition-colors hover:text-white"
                  style={{ color: "#5a7a94" }}
                >
                  {d}
                </button>
              </div>
            ))}
          </div>

          {/* Day toggle row */}
          <div
            className="grid gap-px mb-1"
            style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
          >
            <div />
            {DAYS.map((_, dayIdx) => {
              const dayActive = slots.some((s) => s.day_of_week === dayIdx);
              return (
                <button
                  key={dayIdx}
                  type="button"
                  onClick={() => toggleDay(dayIdx)}
                  className="text-[9px] py-0.5 rounded-sm transition-all font-[family-name:var(--font-mitr)]"
                  style={{
                    background: dayActive
                      ? "rgba(145,196,227,0.18)"
                      : "rgba(13,18,25,0.8)",
                    color: dayActive ? "#91C4E3" : "#2a4a64",
                    border: dayActive
                      ? "1px solid rgba(145,196,227,0.35)"
                      : "1px solid rgba(74,107,130,0.15)",
                  }}
                >
                  {dayActive ? "ON" : "OFF"}
                </button>
              );
            })}
          </div>

          {/* Half-hour rows */}
          <div className="space-y-px">
            {Array.from({ length: 24 }, (_, hour) =>
              [0, 30].map((minute) => {
                const rowKey = slotKey(0, hour, minute);
                const isCollapsed = collapsedDays.size > 0;
                return (
                  <div
                    key={rowKey}
                    data-time-row={rowKey}
                    className="grid gap-px"
                    style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTimeRange(hour, minute)}
                      className="text-right pr-2 text-[10px] flex items-center justify-end font-[family-name:var(--font-space-mono)] transition-colors hover:text-[#91C4E3]"
                      style={{ color: minute === 0 ? "#3a5a74" : "#2a4a64" }}
                    >
                      {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
                    </button>
                    {DAYS.map((_, day) => {
                      const key = slotKey(day, hour, minute);
                      const active = allSlotKeys.has(key);
                      const inDragSelection = dragSelection.has(key);
                      const isDragPreview = inDragSelection && !active;
                      const isDragRemove = inDragSelection && active;
                      const isHovered = hovered === key && !isDragging;
                      const isCollapsed = collapsedDays.has(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onPointerDown={(e) => handlePointerDown(e, key)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={() => {
                            if (!isDragging) setHovered(null);
                          }}
                          onPointerEnter={() => {
                            if (!isDragging) setHovered(key);
                          }}
                          onTouchStart={(e) => handleTouchStart(e, key)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="h-5 rounded-sm transition-all duration-75"
                          style={{
                            background: isDragRemove
                              ? "rgba(255,100,100,0.15)"
                              : isDragPreview
                              ? "rgba(145,196,227,0.12)"
                              : active
                              ? "rgba(145,196,227,0.22)"
                              : isHovered
                              ? "rgba(74,107,130,0.25)"
                              : "rgba(13,18,25,0.8)",
                            border: isDragRemove
                              ? "1px solid rgba(255,100,100,0.3)"
                              : isDragPreview
                              ? "1px dashed rgba(145,196,227,0.4)"
                              : active
                              ? "1px solid rgba(145,196,227,0.45)"
                              : isHovered
                              ? "1px solid rgba(74,107,130,0.3)"
                              : "1px solid rgba(74,107,130,0.15)",
                            boxShadow: active
                              ? "0 0 8px rgba(145,196,227,0.2)"
                              : isHovered
                              ? "0 0 6px rgba(74,107,130,0.15)"
                              : "none",
                            opacity: isCollapsed ? 0.15 : 1,
                            cursor: isDragging ? (dragMode === "add" ? "crosshair" : "not-allowed") : "pointer",
                          }}
                          aria-label={`${DAYS[day]} ${hour}:${String(minute).padStart(2, "0")} ${active ? "remove" : "add"}`}
                        >
                          {active && (
                            <div
                              className="w-1.5 h-1.5 rounded-full mx-auto"
                              style={{ background: isDragRemove ? "#ff8888" : "#91C4E3" }}
                            />
                          )}
                          {isDragPreview && !active && (
                            <div
                              className="w-1 h-1 rounded-full mx-auto"
                              style={{ background: "rgba(145,196,227,0.6)" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              background: "rgba(145,196,227,0.22)",
              border: "1px solid rgba(145,196,227,0.45)",
            }}
          />
          <span className="text-[10px] font-[family-name:var(--font-mitr)]" style={{ color: "#5a7a94" }}>
            Available
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              background: "rgba(145,196,227,0.12)",
              border: "1px dashed rgba(145,196,227,0.4)",
            }}
          />
          <span className="text-[10px] font-[family-name:var(--font-mitr)]" style={{ color: "#5a7a94" }}>
            Drag to add
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              background: "rgba(255,100,100,0.15)",
              border: "1px solid rgba(255,100,100,0.3)",
            }}
          />
          <span className="text-[10px] font-[family-name:var(--font-mitr)]" style={{ color: "#5a7a94" }}>
            Drag to remove
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="text-[10px] font-[family-name:var(--font-mitr)]" style={{ color: "#5a7a94" }}>
        {slots.length} half-hour slots selected ({(slots.length * 0.5).toFixed(1)} hours)
      </div>
    </div>
  );
}
