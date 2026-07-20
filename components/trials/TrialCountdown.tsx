"use client";

import { useEffect, useState } from "react";

interface TrialCountdownProps {
  /** ISO timestamp ของกำหนดชำระ (start + 24h) */
  deadline: string;
  /** ข้อความเมื่อเลยกำหนดแล้ว */
  expiredLabel?: string;
  className?: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * นาฬิกานับถอยหลังแบบ tick ทุกวินาที (hh:mm:ss)
 * render ฝั่ง server เป็น placeholder ก่อน mount เพื่อเลี่ยง hydration mismatch
 */
export function TrialCountdown({
  deadline,
  expiredLabel = "หมดเวลาแล้ว",
  className,
}: TrialCountdownProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const deadlineMs = new Date(deadline).getTime();
  const remaining = now === null ? null : Math.max(0, deadlineMs - now);

  if (remaining === null) {
    return (
      <span className={className} aria-hidden="true">
        --:--:--
      </span>
    );
  }

  if (remaining <= 0) {
    return <span className={className}>{expiredLabel}</span>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={className} role="timer" aria-live="off">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
