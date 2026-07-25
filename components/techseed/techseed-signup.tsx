"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Sparkles, Users } from "lucide-react";

import {
  generateReferralCode,
  PRICE_ANCHOR_THB,
  PRICE_BASE_THB,
  REFERRAL_DISCOUNT_THB,
  REFERRAL_MAX_COUNTED,
  PRICE_FLOOR_THB,
  REFERRAL_CODE_PATTERN,
} from "@/lib/techseed/referral";
import { createClient } from "@/utils/supabase/client";

const GRADE_OPTIONS = ["ม.4", "ม.5", "ม.6", "จบแล้ว", "อื่น ๆ"] as const;

const TRACK_OPTIONS = [
  { value: "cybersecurity", label: "ความมั่นคงปลอดภัยไซเบอร์" },
  { value: "ai-engineer", label: "วิศวกร AI" },
  { value: "data-scientist", label: "นักวิทยาศาสตร์ข้อมูล" },
  { value: "software-engineer", label: "วิศวกรซอฟต์แวร์" },
  { value: "unsure", label: "ยังไม่แน่ใจ" },
] as const;

const LINE_OA_QR_URL =
  "https://qr-official.line.me/gs/M_161irjbq_BW.png?oat_content=qr";

const PRICE_POLL_INTERVAL_MS = 15000;

interface FormState {
  name: string;
  school: string;
  grade: string;
  contact: string;
  interestTrack: string;
}

interface FieldErrors {
  name?: string;
  contact?: string;
}

interface PriceState {
  referralCount: number;
  priceFinal: number;
}

function formatThb(amount: number): string {
  return `${new Intl.NumberFormat("th-TH").format(amount)}฿`;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) {
    errors.name = "บอกชื่อของเธอหน่อยนะ";
  }
  if (!form.contact.trim()) {
    errors.contact = "ขอ LINE ID หรือเบอร์โทรไว้ติดต่อด้วยนะ";
  }
  return errors;
}

export function TechseedSignup() {
  const searchParams = useSearchParams();
  const rawReferredBy = searchParams.get("ref");
  // Only well-formed codes reach the DB — anything else in ?ref= is dropped.
  const referredBy =
    rawReferredBy && REFERRAL_CODE_PATTERN.test(rawReferredBy)
      ? rawReferredBy
      : null;
  const source = searchParams.get("from");

  const [form, setForm] = useState<FormState>({
    name: "",
    school: "",
    grade: "",
    contact: "",
    interestTrack: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function insertSignup(code: string) {
    const supabase = createClient();
    return supabase.from("techseed_signups").insert({
      name: form.name.trim(),
      school: form.school.trim() || null,
      grade: form.grade || null,
      contact: form.contact.trim(),
      interest_track: form.interestTrack || null,
      referral_code: code,
      referred_by: referredBy || null,
      source: source || null,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let code = generateReferralCode();
      let { error } = await insertSignup(code);

      // referral_code has a unique constraint — regenerate once on collision
      if (error?.code === "23505") {
        code = generateReferralCode();
        ({ error } = await insertSignup(code));
      }

      if (error) {
        console.error("TechSeed signup failed:", error);
        setSubmitError("สมัครไม่สำเร็จ ลองอีกครั้งนะ");
        return;
      }
      setReferralCode(code);
    } catch (error) {
      console.error("TechSeed signup failed:", error);
      setSubmitError("สมัครไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setSubmitting(false);
    }
  }

  if (referralCode) {
    return <SignupConfirmation referralCode={referralCode} />;
  }

  return (
    <div className="w-full">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
          PassionSeed · TechSeed
        </p>
        <h1
          className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-kodchasan)" }}
        >
          TechSeed รุ่น 6
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-300">
          ค่ายออนไลน์หลายสัปดาห์ — ทีม (squad) + แผนการเรียนส่วนตัว (plan) +
          คอมมูนิตี้ ทำโปรเจกต์จริง มีพี่ ๆ ดูแล
        </p>
      </header>

      <section className="ei-card mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
          <span className="text-lg text-neutral-400 line-through">
            {formatThb(PRICE_ANCHOR_THB)}
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {formatThb(PRICE_BASE_THB)}
          </span>
        </div>
        <p className="mt-3 text-center text-sm leading-6 text-amber-100/90">
          <Users className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
          ชวนเพื่อน 1 คนลด {REFERRAL_DISCOUNT_THB}฿ นับสูงสุด{" "}
          {REFERRAL_MAX_COUNTED} คน (ต่ำสุด {formatThb(PRICE_FLOOR_THB)})
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="techseed-name" className="ei-label">
              ชื่อ <span className="text-amber-200">*</span>
            </label>
            <input
              id="techseed-name"
              type="text"
              className="ei-input mt-1.5"
              placeholder="ชื่อที่ให้พี่ ๆ เรียก"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="mt-1.5 text-sm text-red-300">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="techseed-school" className="ei-label">
              โรงเรียน
            </label>
            <input
              id="techseed-school"
              type="text"
              className="ei-input mt-1.5"
              placeholder="โรงเรียนของเธอ"
              value={form.school}
              onChange={(event) => updateField("school", event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="techseed-grade" className="ei-label">
              ระดับชั้น
            </label>
            <select
              id="techseed-grade"
              className="ei-select mt-1.5"
              value={form.grade}
              onChange={(event) => updateField("grade", event.target.value)}
            >
              <option value="">เลือกระดับชั้น</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="techseed-contact" className="ei-label">
              LINE ID หรือเบอร์โทร <span className="text-amber-200">*</span>
            </label>
            <input
              id="techseed-contact"
              type="text"
              className="ei-input mt-1.5"
              placeholder="เช่น @lineid หรือ 08x-xxx-xxxx"
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
              aria-invalid={Boolean(fieldErrors.contact)}
            />
            {fieldErrors.contact && (
              <p className="mt-1.5 text-sm text-red-300">{fieldErrors.contact}</p>
            )}
          </div>

          <div>
            <label htmlFor="techseed-track" className="ei-label">
              สายที่สนใจ
            </label>
            <select
              id="techseed-track"
              className="ei-select mt-1.5"
              value={form.interestTrack}
              onChange={(event) =>
                updateField("interestTrack", event.target.value)
              }
            >
              <option value="">เลือกสายที่สนใจ</option>
              {TRACK_OPTIONS.map((track) => (
                <option key={track.value} value={track.value}>
                  {track.label}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <p className="text-center text-sm text-red-300">{submitError}</p>
          )}

          <button
            type="submit"
            className="ei-button-dawn w-full"
            disabled={submitting}
          >
            <span>
              {submitting ? "กำลังสมัคร..." : "สมัคร TechSeed รุ่น 6"}
            </span>
          </button>

          <p className="text-center text-xs leading-5 text-neutral-400">
            ยังไม่ต้องจ่ายตอนสมัคร — ทีมงานจะทักไปทาง LINE เพื่อยืนยันที่นั่งและแจ้งวิธีชำระเงิน
          </p>
        </form>
      </section>
    </div>
  );
}

function SignupConfirmation({ referralCode }: { referralCode: string }) {
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReferralLink(`${window.location.origin}/techseed?ref=${referralCode}`);
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, [referralCode]);

  async function copyReferralLink() {
    if (!referralLink) return;
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(referralLink);
      didCopy = true;
    } catch {
      // Fallback for browsers/webviews without the async clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        didCopy = document.execCommand("copy");
      } catch {
        didCopy = false;
      }
      document.body.removeChild(textarea);
    }
    if (didCopy) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="w-full">
      <section className="ei-card p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-kodchasan)" }}
        >
          ลงทะเบียนแล้ว!
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          <Sparkles className="mr-1 inline h-4 w-4 align-[-2px] text-amber-200" aria-hidden="true" />
          ชวนเพื่อน 1 คน ลด {REFERRAL_DISCOUNT_THB}฿ — ส่งลิงก์นี้ให้เพื่อนได้เลย
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-left text-sm text-amber-100">
            {referralLink}
          </span>
          <button
            type="button"
            onClick={copyReferralLink}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-200/10 px-3 py-1.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/20"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        </div>

        <LivePricePanel referralCode={referralCode} />
      </section>

      <section className="ei-card mt-6 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-white">
          ขั้นตอนต่อไป: แอด LINE เพื่อยืนยันที่นั่ง
        </h2>
        <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3 shadow-[0_0_40px_rgba(0,185,0,0.18)]">
          <Image
            src={LINE_OA_QR_URL}
            alt="LINE official account QR Code"
            width={240}
            height={240}
            className="h-auto w-52 rounded-xl sm:w-60"
            unoptimized
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          เปิดกล้องหรือแอป LINE เพื่อสแกน — ทีมงานจะทักไปทาง LINE
          เพื่อยืนยันที่นั่งและแจ้งวิธีชำระเงิน (ยังไม่ต้องจ่ายตอนนี้)
        </p>
      </section>
    </div>
  );
}

function LivePricePanel({ referralCode }: { referralCode: string }) {
  const [price, setPrice] = useState<PriceState | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const failuresRef = useRef(0);

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/techseed/price?code=${encodeURIComponent(referralCode)}`
      );
      if (!response.ok) throw new Error(`price fetch ${response.status}`);
      const payload = await response.json();
      if (
        typeof payload.referral_count === "number" &&
        typeof payload.price_final === "number"
      ) {
        failuresRef.current = 0;
        setPrice({
          referralCount: payload.referral_count,
          priceFinal: payload.price_final,
        });
      }
    } catch (error) {
      // Keep the last known price on transient errors, but surface a
      // persistent failure instead of silently showing a stale 1,550฿.
      failuresRef.current += 1;
      if (failuresRef.current === 1) {
        console.error("TechSeed price fetch failed:", error);
      }
      if (failuresRef.current >= 3) setFetchFailed(true);
    }
  }, [referralCode]);

  useEffect(() => {
    fetchPrice();
    const timer = setInterval(fetchPrice, PRICE_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchPrice]);

  if (fetchFailed) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-5">
        <p className="text-sm text-neutral-300">
          โหลดราคาล่าสุดไม่ได้ — ลองรีเฟรชหน้านี้ หรือทัก LINE
          ให้ทีมงานช่วยเช็กให้นะ
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-5">
      <p className="text-sm text-neutral-300">
        เพื่อนที่สมัครแล้ว{" "}
        <span className="font-bold text-white">{price?.referralCount ?? 0}</span>{" "}
        คน
      </p>
      <div className="mt-2 flex items-baseline justify-center gap-3">
        <span className="text-sm text-neutral-400 line-through">
          {formatThb(PRICE_ANCHOR_THB)}
        </span>
        <span className="text-3xl font-extrabold tracking-tight text-amber-100">
          {formatThb(price?.priceFinal ?? PRICE_BASE_THB)}
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-400">ราคาของเธอตอนนี้</p>
    </div>
  );
}
