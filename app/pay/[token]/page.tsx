import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { PayPageClient } from "@/components/trials/PayPageClient";
import {
  resolveTrialStatus,
  type TrialStatus,
} from "@/lib/trials/status";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชำระค่าทดลอง PathLab | PassionSeed",
  description: "ชำระค่าทดลอง PathLab ผ่าน PromptPay เพื่อปลดล็อกการทดลองทั้งหมด",
  robots: { index: false, follow: false },
};

interface PayPageProps {
  params: Promise<{ token: string }>;
}

const TRIAL_STATUSES: ReadonlyArray<TrialStatus> = [
  "active",
  "pending",
  "paid",
  "expired",
];

// Shape ที่ RPC get_trial_by_token คืนมา (camelCase ตาม contract)
interface TrialRpcRow {
  status?: unknown;
  priceAmount?: unknown;
  paymentDeadline?: unknown;
  seedTitle?: unknown;
  paidAt?: unknown;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export default async function PayPage({ params }: PayPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_trial_by_token", {
    p_token: token,
  });
  if (error) {
    console.error("[PayPage] get_trial_by_token error:", error.message);
  }

  const row: TrialRpcRow | null = Array.isArray(data)
    ? (data[0] ?? null)
    : (data as TrialRpcRow | null);

  const storedStatus = TRIAL_STATUSES.includes(row?.status as TrialStatus)
    ? (row?.status as TrialStatus)
    : null;
  const paymentDeadline = firstText(row?.paymentDeadline);
  const seedTitle = firstText(row?.seedTitle);
  const priceAmount =
    typeof row?.priceAmount === "number" && Number.isFinite(row.priceAmount)
      ? row.priceAmount
      : 0;
  const paidAt = firstText(row?.paidAt);

  // RPC คืน status ที่ store ไว้ — resolve ซ้ำฝั่งนี้เพื่อให้ trial ที่เกิน
  // deadline แสดงเป็น expired เหมือน GET /api/trials/[token]
  const status =
    storedStatus && paymentDeadline
      ? resolveTrialStatus({
          status: storedStatus,
          payment_deadline: paymentDeadline,
          paid_at: paidAt,
        })
      : null;

  const trial =
    status && paymentDeadline && seedTitle
      ? { status, paymentDeadline, seedTitle, priceAmount, paidAt }
      : null;

  return (
    <main className="dusk-theme relative min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(180deg,#06000f_0%,#1a0336_28%,#3b0764_58%,#4a1230_82%,#2a0818_100%)] font-bai-jamjuree text-slate-100">
      {/* Dusk atmosphere: cloud blobs + horizon glow + star grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-16 h-[26rem] w-[26rem] rounded-full bg-purple-700/25 blur-[110px]" />
        <div className="absolute -right-28 top-[24rem] h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-[22rem] bg-[linear-gradient(to_top,rgba(251,146,60,0.12),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle,rgba(226,232,240,0.85)_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-10 pt-8 sm:pt-12">
        <header className="mb-7 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/passionseed-logo.svg"
              alt="PassionSeed"
              width={32}
              height={32}
              priority
            />
            <span className="text-lg font-bold tracking-tight text-white">
              PassionSeed
            </span>
          </Link>
          <h1 className="text-base font-semibold text-purple-100/90">
            ชำระค่าทดลอง PathLab
          </h1>
        </header>

        {trial ? (
          <PayPageClient
            token={token}
            initialStatus={trial.status}
            priceAmount={trial.priceAmount}
            paymentDeadline={trial.paymentDeadline}
            seedTitle={trial.seedTitle}
            paidAt={trial.paidAt}
          />
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">ไม่พบลิงก์ชำระเงินนี้</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              ลิงก์อาจไม่ถูกต้องหรือถูกใช้งานไปแล้ว —
              หากบุตรหลานของท่านเพิ่งส่งลิงก์มาให้
              กรุณาขอลิงก์อีกครั้ง หรือทักทีมงานเพื่อให้ช่วยตรวจสอบครับ/ค่ะ
            </p>
          </section>
        )}

        <footer className="mt-auto pt-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <MessageCircle className="h-4 w-4 text-[#06C755]" aria-hidden="true" />
            มีปัญหา? ทัก LINE{" "}
            <span className="font-semibold text-slate-200">@passionseed</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
