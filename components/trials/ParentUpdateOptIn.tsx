"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, Mail } from "lucide-react";

interface ParentUpdateOptInProps {
  token: string;
}

type SubmitState = "idle" | "submitting" | "sent" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ParentUpdateOptIn({ token }: ParentUpdateOptInProps) {
  const [email, setEmail] = useState("");
  const [recipientAttested, setRecipientAttested] = useState(false);
  const [consented, setConsented] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const emailInvalid =
    state === "error" && message === "กรุณากรอกอีเมลให้ถูกต้อง";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setState("error");
      setMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    if (!recipientAttested || !consented) {
      setState("error");
      setMessage("กรุณายืนยันสิทธิ์ของผู้รับและความยินยอมก่อนส่ง");
      return;
    }

    setState("submitting");
    setMessage(null);
    try {
      const response = await fetch(`/api/trials/${token}/parent-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          recipientAttested: true,
          consented: true,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "request_failed");

      setState("sent");
      setMessage(
        payload.status === "already_verified"
          ? `อีเมล ${payload.maskedEmail} ยืนยันแล้วและพร้อมรับอัปเดต`
          : `ส่งอีเมลยืนยันไปที่ ${payload.maskedEmail} แล้ว กรุณากดยืนยันภายใน 30 นาที`
      );
    } catch {
      setState("error");
      setMessage(
        "ยังส่งอีเมลยืนยันไม่ได้ ข้อมูลที่กรอกไว้ยังอยู่ ลองส่งอีกครั้งได้"
      );
    }
  }

  return (
    <section
      className="ei-card px-5 py-6 sm:px-6"
      aria-labelledby="parent-update-heading"
      data-parent-updates
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/10 text-blue-200">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="parent-update-heading"
            className="font-kodchasan text-lg font-bold text-white"
          >
            รับอัปเดตความคืบหน้าแบบสั้น ๆ
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            ไม่บังคับสมัคร รับเฉพาะวันที่เริ่ม หมุดหมายสำคัญ และเมื่อทำ PathLab
            จบ
          </p>
        </div>
      </div>

      {state === "sent" ? (
        <div
          className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-4 text-sm leading-6 text-emerald-100"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <p>{message}</p>
        </div>
      ) : (
        <form className="mt-5 space-y-4" noValidate onSubmit={submit}>
          <div>
            <label
              htmlFor="parent-update-email"
              className="text-sm font-semibold text-slate-100"
            >
              อีเมลผู้ปกครอง
            </label>
            <input
              id="parent-update-email"
              className="ei-input mt-2 min-h-12"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={emailInvalid}
              aria-describedby={`parent-update-privacy${
                message ? " parent-update-message" : ""
              }`}
            />
          </div>

          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-blue-500"
              checked={recipientAttested}
              onChange={(event) => setRecipientAttested(event.target.checked)}
            />
            <span>
              ข้าพเจ้าเป็นผู้ปกครอง/ผู้ดูแล
              หรือได้รับอนุญาตจากครอบครัวให้รับอัปเดตนี้
            </span>
          </label>

          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-blue-500"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>
              ยินยอมรับอีเมลอัปเดต PathLab และทราบว่ายกเลิกรับได้ทุกเมื่อ
            </span>
          </label>

          <p
            id="parent-update-privacy"
            className="text-xs leading-5 text-slate-400"
          >
            ไม่ส่งคำตอบส่วนตัว บันทึกสะท้อนคิด แชต หรือโน้ตของบุตรหลานทางอีเมล
          </p>

          {message && (
            <p
              id="parent-update-message"
              className="flex items-start gap-2 text-sm leading-6 text-rose-200"
              role="alert"
            >
              <CircleAlert
                className="mt-1 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="ei-button-dawn min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {state === "submitting"
                ? "กำลังส่งอีเมลยืนยัน…"
                : state === "error"
                ? "ลองส่งอีกครั้ง"
                : "ส่งอีเมลยืนยัน"}
            </span>
          </button>
          {state === "submitting" && (
            <p className="sr-only" role="status" aria-live="polite">
              กำลังส่งอีเมลยืนยัน
            </p>
          )}
        </form>
      )}
    </section>
  );
}
