"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CloudUpload,
  Hourglass,
} from "lucide-react";

import { TRIAL_PRICE_THB, type TrialStatus } from "@/lib/trials/status";
import { ParentUpdateOptIn } from "./ParentUpdateOptIn";
import { TrialCountdown } from "./TrialCountdown";

interface PayPageClientProps {
  token: string;
  initialStatus: TrialStatus;
  priceAmount: number;
  paymentDeadline: string;
  seedTitle: string;
  seedDescription: string | null;
  totalDays: number | null;
  radarDirectionTitle: string | null;
  outcomes: string[];
}

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const MAX_BROWSER_TIMEOUT_MS = 2_147_483_647;
const DEFAULT_OUTCOMES = [
  "ผลงานจริงที่ใช้เป็นหลักฐานได้",
  "สัญญาณความเหมาะกับสายอาชีพที่ชัดขึ้น",
  "สรุปความคืบหน้าสำหรับครอบครัว",
];

function formatThb(amount: number): string {
  return `฿${new Intl.NumberFormat("th-TH").format(amount)}`;
}

export function PayPageClient({
  token,
  initialStatus,
  priceAmount,
  paymentDeadline,
  seedTitle,
  seedDescription,
  totalDays,
  radarDirectionTitle,
  outcomes,
}: PayPageClientProps) {
  const [status, setStatus] = useState<TrialStatus>(initialStatus);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const amount = priceAmount > 0 ? priceAmount : TRIAL_PRICE_THB;
  const parentOutcomes =
    outcomes.length >= 3 ? outcomes.slice(0, 3) : DEFAULT_OUTCOMES;

  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

  useEffect(() => {
    const root = pageRef.current;
    if (
      !root ||
      typeof IntersectionObserver === "undefined" ||
      !window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        }
      },
      { threshold: 0.45 }
    );
    root
      .querySelectorAll(".ei-card, .ei-button-dawn")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    if (status !== "active") return;
    const remaining = new Date(paymentDeadline).getTime() - Date.now();
    if (!Number.isFinite(remaining) || remaining > MAX_BROWSER_TIMEOUT_MS) {
      return;
    }
    if (remaining <= 0) {
      setStatus("expired");
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "active" ? "expired" : current));
    }, remaining + 25);
    return () => window.clearTimeout(timer);
  }, [paymentDeadline, status]);

  function selectSlip(file: File | null) {
    setError(null);
    if (!file) {
      setSlipFile(null);
      setSlipPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพของสลิปเท่านั้นครับ/ค่ะ");
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setError("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกรูปที่เล็กกว่านี้ครับ/ค่ะ");
      return;
    }
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  }

  async function uploadSlip() {
    if (!slipFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("slip", slipFile);
      const response = await fetch(`/api/trials/${token}/slip`, {
        method: "POST",
        body: formData,
      });
      if (response.status === 409) {
        setStatus("paid");
        return;
      }
      if (!response.ok) throw new Error("upload failed");
      setStatus("pending");
    } catch {
      setError("อัปโหลดสลิปไม่สำเร็จ กรุณาลองอีกครั้งครับ/ค่ะ");
    } finally {
      setUploading(false);
    }
  }

  if (status === "pending") {
    return (
      <StatusCard
        icon={
          <Hourglass className="h-10 w-10 text-amber-200" aria-hidden="true" />
        }
        title="ได้รับสลิปแล้ว กำลังตรวจสอบ"
        description="ทีมงานจะตรวจสอบยอดและยืนยันให้เร็วที่สุด ระหว่างนี้บุตรหลานยังทดลองต่อได้ตามปกติ"
      />
    );
  }

  if (status === "paid") {
    return (
      <StatusCard
        icon={
          <BadgeCheck
            className="h-10 w-10 text-emerald-300"
            aria-hidden="true"
          />
        }
        title="ชำระเรียบร้อย ขอบคุณครับ/ค่ะ"
        description="PathLab นี้ปลดล็อกเรียบร้อยแล้ว บุตรหลานทำต่อได้ตามแผน"
      />
    );
  }

  return (
    <div
      ref={pageRef}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)] lg:items-start"
    >
      <section
        className="ei-card px-5 py-6 sm:px-7 sm:py-8"
        aria-labelledby="parent-value-title"
        data-parent-value-story
      >
        <div data-mobile-first-viewport>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/80">
            PathLab ที่บุตรหลานเลือก
          </p>
          <h1
            id="parent-value-title"
            title={seedTitle}
            className="mt-1 line-clamp-2 font-kodchasan text-2xl font-bold leading-snug text-white sm:text-3xl"
          >
            {seedTitle}
          </h1>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-blue-100">
            {radarDirectionTitle
              ? `เชื่อมกับทิศ ${radarDirectionTitle} ใน My Path`
              : "เลือกไว้เป็นส่วนหนึ่งของ My Path เพื่อทดลองก่อนตัดสินใจจริง"}
          </p>
          <ul className="mt-3 space-y-2">
            {parentOutcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-start gap-2 text-sm leading-5 text-slate-100"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                  aria-hidden="true"
                />
                <span className="line-clamp-2" title={outcome}>
                  {outcome}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">ค่าทดลอง PathLab ทั้งหมด</p>
              <p className="text-4xl font-extrabold tracking-tight text-white">
                {formatThb(amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {status === "active" ? "ภายใน 24 ชม." : "เลยกำหนดแล้ว"}
              </p>
              {status === "active" && (
                <TrialCountdown
                  deadline={paymentDeadline}
                  expiredLabel="เลยกำหนดแล้ว"
                  className="block font-mono text-base font-bold tabular-nums text-amber-100"
                />
              )}
            </div>
          </div>
          <a
            href="#payment"
            className="ei-button-dawn mt-4 min-h-12 w-full justify-center"
          >
            <span>ดูวิธีชำระ</span>
          </a>
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <h2 className="font-kodchasan text-base font-bold text-white">
            สิ่งที่จะได้ลงมือทำ
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            ลงมือทำจริง {totalDays ? `${totalDays} วัน` : "ตามเส้นทาง PathLab"}
            {seedDescription
              ? `: ${seedDescription}`
              : " จากโจทย์ที่ใกล้กับงานจริง"}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            ค่าทดลองนี้เป็นเครดิตเต็มจำนวนสำหรับ Admission Evidence Sprint
            หากครอบครัวเลือกไปต่อ
          </p>
          {status === "expired" && (
            <p className="mt-3 rounded-xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm leading-6 text-amber-100">
              เลยกำหนด 24 ชม. แล้ว แต่ยังชำระเพื่อปลดล็อก PathLab ได้
            </p>
          )}
        </div>
      </section>

      <ParentUpdateOptIn token={token} />

      <section
        id="payment"
        className="ei-card scroll-mt-4 px-5 py-6 sm:px-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        aria-labelledby="payment-heading"
      >
        <h2
          id="payment-heading"
          className="font-kodchasan text-xl font-bold text-white"
        >
          ชำระผ่าน PromptPay
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          ยอดเต็ม {formatThb(amount)} ไม่มีการตัดเงินอัตโนมัติ
        </p>

        <div className="mt-5 text-center">
          <h3 className="text-base font-bold text-white">
            สแกนเพื่อชำระผ่าน PromptPay
          </h3>
          <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR is a static public asset */}
            <img
              src="/trial/promptpay-qr.jpeg"
              alt="PromptPay QR สำหรับชำระเงิน"
              className="h-56 w-56 rounded-xl object-contain"
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-200">
            สแกนแล้วกรอกยอด {formatThb(amount)}
          </p>
        </div>

        <div className="mt-7 border-t border-white/10 pt-6">
          <h3 className="text-base font-bold text-white">แนบสลิปการโอน</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            อัปโหลดรูปสลิปไม่เกิน 5MB ทีมงานจะตรวจสอบและยืนยันการชำระ
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="เลือกรูปสลิปการโอน"
            onChange={(event) => selectSlip(event.target.files?.[0] ?? null)}
          />

          {slipPreview && slipFile ? (
            <div className="mt-4 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- client-side object URL */}
              <img
                src={slipPreview}
                alt={`ตัวอย่างสลิป ${slipFile.name}`}
                className="mx-auto max-h-64 rounded-2xl border border-white/15 object-contain"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-12 w-full rounded-xl text-sm font-semibold text-blue-100 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200"
              >
                เลือกรูปอื่น
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-black/20 px-4 py-6 text-slate-300 hover:border-blue-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200"
            >
              <CloudUpload
                className="h-7 w-7 text-blue-200"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold">
                แตะเพื่อเลือกรูปสลิป
              </span>
              <span className="text-xs text-slate-400">
                ไฟล์รูปภาพ ไม่เกิน 5MB
              </span>
            </button>
          )}

          {error && (
            <p
              className="mt-3 flex items-start gap-2 text-sm text-rose-200"
              role="alert"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={uploadSlip}
            disabled={!slipFile || uploading}
            className="ei-button-dawn mt-4 min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{uploading ? "กำลังอัปโหลด…" : "ส่งสลิปยืนยันการชำระ"}</span>
          </button>
        </div>

        <div className="mt-7 border-t border-white/10 pt-6">
          <h3 className="font-kodchasan text-lg font-bold text-white">
            คำถามที่ผู้ปกครองมักถาม
          </h3>
          <dl className="mt-4 divide-y divide-white/10">
            <FaqItem
              question="ใช้เวลาเท่าไร?"
              answer={`PathLab แบ่งเป็น ${totalDays ? `${totalDays} วัน` : "หลายวัน"} แต่เวลาแต่ละกิจกรรมขึ้นกับงานและจังหวะของผู้เรียน`}
            />
            <FaqItem
              question="ข้อมูลอะไรที่ครอบครัวจะได้รับ?"
              answer="รับเฉพาะสถานะเริ่ม หมุดหมายสำคัญ และสรุปเมื่อทำจบ ไม่ส่งคำตอบส่วนตัว บันทึกสะท้อนคิด แชต หรือโน้ต"
            />
            <FaqItem
              question="ถ้าเลย 24 ชั่วโมงจะเกิดอะไรขึ้น?"
              answer="แผน My Path และสิ่งที่ทำไว้ยังอยู่ แต่การทำ PathLab ต่อจะรอจนกว่าจะชำระเพื่อเปิดสิทธิ์อีกครั้ง"
            />
            <FaqItem
              question="หลังทำจบจะเกิดอะไรขึ้น?"
              answer="ผู้เรียนจะมีผลงานและสัญญาณความเหมาะกับสายอาชีพไว้ทบทวน หากเลือก Admission Evidence Sprint ค่าทดลองนี้เป็นเครดิตเต็มจำนวน"
            />
          </dl>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-3">
      <dt className="text-sm font-semibold text-slate-100">{question}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-400">{answer}</dd>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="ei-card mx-auto max-w-xl p-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
        {icon}
      </div>
      <h1 className="mt-5 font-kodchasan text-xl font-bold leading-snug text-white">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </section>
  );
}
