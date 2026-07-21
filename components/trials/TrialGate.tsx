"use client";

import { useState } from "react";
import { CircleAlert, Clock3, CreditCard, Sparkles } from "lucide-react";

import { TRIAL_PRICE_THB } from "@/lib/trials/status";
import {
  TrialShareActions,
  type TrialShareInfo,
} from "@/components/trials/TrialShareActions";

interface TrialGateProps {
  seedId: string;
  seedTitle: string;
  /** trial ที่มีอยู่แล้วแต่หมดสิทธิ์ (expired) — null แปลว่ายังไม่เคยสร้าง trial */
  trial: TrialShareInfo | null;
}

const GATE_POINTS = [
  {
    icon: Sparkles,
    title: "ทำก่อน จ่ายทีหลัง",
    detail: "เริ่มทดลองงานจริงได้ทันที ไม่ต้องรอชำระก่อน",
  },
  {
    icon: Clock3,
    title: "ผู้ปกครองชำระภายใน 24 ชม.",
    detail: "ส่งลิงก์ให้ผู้ปกครองชำระผ่าน PromptPay — ระหว่างนี้ทดลองต่อได้ปกติ",
  },
  {
    icon: CreditCard,
    title: "เป็นเครดิตเต็มจำนวน",
    detail: "ค่าทดลองถูกนำไปหักเป็นเครดิตเต็มจำนวนเมื่ออัปเกรดเป็น Admission Evidence Sprint",
  },
];

/**
 * Gate ของ PathLab สำหรับนักเรียนที่ล็อกอินแล้วแต่ยังไม่มีสิทธิ์ทดลอง
 * (ไม่มี trial หรือ trial หมดอายุ) — อธิบายโมเดล "ทำก่อน จ่ายทีหลัง"
 * แล้วเปิดทางสร้าง trial / แชร์ลิงก์ให้ผู้ปกครอง
 */
export function TrialGate({ seedId, seedTitle, trial }: TrialGateProps) {
  const [activeTrial, setActiveTrial] = useState<TrialShareInfo | null>(trial);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTrial() {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedId }),
      });
      if (!response.ok) throw new Error("trial create failed");
      const payload = await response.json();
      setActiveTrial({
        payToken: payload.payToken,
        payUrl: payload.payUrl,
        paymentDeadline: payload.paymentDeadline,
      });
    } catch {
      setError("เปิดการทดลองไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="bg-neutral-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 opacity-70" />

      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
        PathLab Trial · ทำก่อน จ่ายทีหลัง
      </p>
      <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-snug">
        เริ่มทดลอง {seedTitle} ได้เลยวันนี้
      </h2>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-4xl font-extrabold tracking-tight text-white">
          ฿{new Intl.NumberFormat("th-TH").format(TRIAL_PRICE_THB)}
        </span>
        <span className="text-sm text-neutral-400">
          ชำระภายใน 24 ชม. หลังเริ่มทดลอง
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {GATE_POINTS.map((point) => (
          <li
            key={point.title}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/10 text-amber-100">
              <point.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">
                {point.title}
              </span>
              <span className="block text-sm leading-6 text-neutral-400">
                {point.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {activeTrial ? (
        <div className="mt-7">
          <p className="mb-4 text-sm leading-6 text-neutral-300">
            การทดลองของคุณเปิดแล้ว —
            ส่งลิงก์นี้ให้ผู้ปกครองเพื่อชำระและปลดล็อกการทดลองต่อ
          </p>
          <TrialShareActions
            payUrl={activeTrial.payUrl}
            paymentDeadline={activeTrial.paymentDeadline}
          />
        </div>
      ) : (
        <div className="mt-7">
          <button
            type="button"
            onClick={startTrial}
            disabled={starting}
            className="ei-button-dusk min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>
              {starting ? "กำลังเปิดการทดลอง…" : "เริ่มทดลองเลย (จ่ายทีหลัง)"}
            </span>
          </button>
          {error && (
            <p
              className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200"
              role="alert"
            >
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
