"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

import { TrialCountdown } from "./TrialCountdown";

/** ข้อความที่นักเรียนส่งให้ผู้ปกครองทาง LINE */
export const TRIAL_SHARE_MESSAGE =
  "หนูเลือกทดลอง PathLab นี้ใน My Path ค่ะ/ครับ หน้านี้มีรายละเอียดสิ่งที่จะได้ทำและค่าทดลอง ฿1,490 ให้ดูก่อนตัดสินใจ";

/** ข้อมูลที่จำเป็นสำหรับแชร์ลิงก์ชำระเงินของ trial */
export interface TrialShareInfo {
  payToken: string;
  payUrl: string;
  paymentDeadline: string;
}

interface TrialShareActionsProps {
  payUrl: string;
  paymentDeadline: string;
  shareText?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through ไปใช้วิธีสำรอง
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * บล็อกแชร์ลิงก์ชำระเงิน — ใช้ร่วมกันระหว่าง PayLaterSheet และ TrialGate
 * แสดงนาฬิกานับถอยหลัง ลิงก์ชำระเงิน ปุ่มคัดลอก และปุ่มแชร์ทาง LINE
 */
export function TrialShareActions({
  payUrl,
  paymentDeadline,
  shareText = TRIAL_SHARE_MESSAGE,
}: TrialShareActionsProps) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const absolutePayUrl = `${origin}${payUrl}`;
  const lineShareHref = `https://line.me/R/share?text=${encodeURIComponent(
    `${shareText} ${absolutePayUrl}`
  )}`;

  async function handleCopy() {
    const ok = await copyText(`${window.location.origin}${payUrl}`);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <p className="text-xs font-medium text-slate-400">
          เหลือเวลาให้ผู้ปกครองชำระ
        </p>
        <TrialCountdown
          deadline={paymentDeadline}
          expiredLabel="เลยกำหนด 24 ชม. แล้ว — ยังชำระได้อยู่"
          className="mt-1 block font-mono text-2xl font-bold tabular-nums tracking-wide text-amber-100"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">
          ลิงก์ชำระเงินสำหรับผู้ปกครอง
        </p>
        <div className="mt-1.5 flex items-stretch gap-2">
          <p className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-3 font-mono text-xs leading-6 text-slate-300">
            {origin ? absolutePayUrl : payUrl}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            {copied ? (
              <>
                <Check
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                คัดลอกลิงก์
              </>
            )}
          </button>
        </div>
      </div>

      <a
        href={lineShareHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(6,199,85,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
      >
        <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
        ส่งให้ผู้ปกครองทาง LINE
      </a>
    </div>
  );
}
