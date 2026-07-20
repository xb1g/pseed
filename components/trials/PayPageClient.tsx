"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  CloudUpload,
  Hourglass,
} from "lucide-react";

import { TRIAL_PRICE_THB, type TrialStatus } from "@/lib/trials/status";
import { TrialCountdown } from "./TrialCountdown";

interface PayPageClientProps {
  token: string;
  initialStatus: TrialStatus;
  priceAmount: number;
  paymentDeadline: string;
  seedTitle: string;
  paidAt: string | null;
}

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

function formatThb(amount: number): string {
  return `฿${new Intl.NumberFormat("th-TH").format(amount)}`;
}

function formatThaiDateTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/**
 * หน้าชำระเงินสำหรับผู้ปกครอง (ไม่ต้องมีบัญชี)
 * active/expired → แสดง QR + อัปโหลดสลิป, pending/paid → แสดงสถานะ
 */
export function PayPageClient({
  token,
  initialStatus,
  priceAmount,
  paymentDeadline,
  seedTitle,
  paidAt,
}: PayPageClientProps) {
  const [status, setStatus] = useState<TrialStatus>(initialStatus);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amount = priceAmount > 0 ? priceAmount : TRIAL_PRICE_THB;

  // คืน object URL ของ slip preview ตัวเก่าทุกครั้งที่เปลี่ยนรูปหรือ unmount
  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

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
        // ชำระไปแล้ว — แสดงหน้าขอบคุณแทน
        setStatus("paid");
        return;
      }
      if (!response.ok) {
        throw new Error("upload failed");
      }
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
        icon={<Hourglass className="h-10 w-10 text-amber-200" aria-hidden="true" />}
        title="ได้รับสลิปแล้ว กำลังตรวจสอบ"
        description="ขอบคุณครับ/ค่ะ — ทีมงานจะตรวจสอบยอดและยืนยันให้เร็วที่สุด ระหว่างนี้บุตรหลานของท่านยังทดลองต่อได้ตามปกติ"
      />
    );
  }

  if (status === "paid") {
    return (
      <StatusCard
        icon={<BadgeCheck className="h-10 w-10 text-emerald-300" aria-hidden="true" />}
        title="ชำระเรียบร้อย ขอบคุณครับ/ค่ะ"
        description="การทดลอง PathLab ของบุตรหลานของท่านถูกปลดล็อกเรียบร้อยแล้ว"
      >
        {paidAt && (
          <p className="mt-3 text-sm text-slate-400">
            ชำระเมื่อ {formatThaiDateTime(paidAt)}
          </p>
        )}
      </StatusCard>
    );
  }

  // active | expired → ยังชำระได้
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-200/70">
          กำลังทดลอง
        </p>
        <h2 className="mt-1.5 text-xl font-bold leading-snug text-white">
          {seedTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          บุตรหลานของคุณเริ่มทดลองงานจริงแล้ว —
          การชำระนี้ปลดล็อกการทดลองทั้งหมด
          และจะถูกนำไปเป็นเครดิตเต็มจำนวนเมื่ออัปเกรดเป็น
          Admission Evidence Sprint
        </p>

        <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
          <div>
            <p className="text-xs text-slate-400">ค่าทดลอง PathLab</p>
            <p className="mt-0.5 text-4xl font-extrabold tracking-tight text-white">
              {formatThb(amount)}
            </p>
          </div>
          {status === "active" && (
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                ชำระภายใน
              </p>
              <TrialCountdown
                deadline={paymentDeadline}
                expiredLabel="เลยกำหนดแล้ว"
                className="mt-0.5 block font-mono text-lg font-bold tabular-nums text-amber-200"
              />
            </div>
          )}
        </div>

        {status === "expired" && (
          <p className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm leading-6 text-amber-100/90">
            เลยกำหนด 24 ชม. แล้ว แต่ยังชำระได้ —
            การชำระจะปลดล็อกทันที
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-center shadow-2xl backdrop-blur-xl">
        <h3 className="text-base font-bold text-white">
          สแกนเพื่อชำระผ่าน PromptPay
        </h3>
        <div className="mx-auto mt-4 w-fit rounded-3xl bg-white p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR เป็น static asset ใน public/ ใช้ img ธรรมดา ไม่ต้องตั้งค่า next/image เพิ่ม */}
          <img
            src="/trial/promptpay-qr.jpeg"
            alt="PromptPay QR สำหรับชำระเงิน"
            className="h-56 w-56 rounded-xl object-contain"
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-200">
          สแกนแล้วกรอกยอด {formatThb(amount)}
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="text-base font-bold text-white">แนบสลิปการโอน</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          อัปโหลดรูปสลิป (ไม่เกิน 5MB)
          ทีมงานจะตรวจสอบและยืนยันการชำระให้ครับ/ค่ะ
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
            {/* eslint-disable-next-line @next/next/no-img-element -- preview จาก object URL ฝั่ง client ใช้ next/image ไม่ได้ */}
            <img
              src={slipPreview}
              alt={`ตัวอย่างสลิป ${slipFile.name}`}
              className="mx-auto max-h-64 rounded-2xl border border-white/15 object-contain"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block w-full text-center text-sm font-medium text-purple-200 underline-offset-4 hover:underline"
            >
              เลือกรูปอื่น
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-black/20 px-4 py-6 text-slate-300 transition-colors hover:border-purple-300/40 hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            <CloudUpload className="h-7 w-7 text-purple-200" aria-hidden="true" />
            <span className="text-sm font-semibold">แตะเพื่อเลือกรูปสลิป</span>
            <span className="text-xs text-slate-500">รองรับไฟล์รูปภาพ ไม่เกิน 5MB</span>
          </button>
        )}

        {error && (
          <p
            className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200"
            role="alert"
          >
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={uploadSlip}
          disabled={!slipFile || uploading}
          className="ei-button-dusk mt-4 min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{uploading ? "กำลังอัปโหลด…" : "ส่งสลิปยืนยันการชำระ"}</span>
        </button>
      </section>
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function StatusCard({ icon, title, description, children }: StatusCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-bold leading-snug text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      {children}
    </section>
  );
}
