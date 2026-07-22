import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { PayPageClient } from "@/components/trials/PayPageClient";
import { resolveTrialStatus, type TrialStatus } from "@/lib/trials/status";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชำระค่าทดลอง PathLab | PassionSeed",
  description:
    "ชำระค่าทดลอง PathLab ผ่าน PromptPay เพื่อปลดล็อกการทดลองทั้งหมด",
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
  seedDescription?: unknown;
  totalDays?: unknown;
  radarDirectionTitle?: unknown;
  outcomes?: unknown;
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
    ? data[0] ?? null
    : (data as TrialRpcRow | null);

  const storedStatus = TRIAL_STATUSES.includes(row?.status as TrialStatus)
    ? (row?.status as TrialStatus)
    : null;
  const paymentDeadline = firstText(row?.paymentDeadline);
  const seedTitle = firstText(row?.seedTitle);
  const seedDescription = firstText(row?.seedDescription);
  const radarDirectionTitle = firstText(row?.radarDirectionTitle);
  const totalDays =
    typeof row?.totalDays === "number" && Number.isFinite(row.totalDays)
      ? row.totalDays
      : null;
  const outcomes = Array.isArray(row?.outcomes)
    ? row.outcomes.filter(
        (outcome): outcome is string => typeof outcome === "string"
      )
    : [];
  const priceAmount =
    typeof row?.priceAmount === "number" && Number.isFinite(row.priceAmount)
      ? row.priceAmount
      : 0;

  // RPC คืน status ที่ store ไว้ — resolve ซ้ำฝั่งนี้เพื่อให้ trial ที่เกิน
  // deadline แสดงเป็น expired เหมือน GET /api/trials/[token]
  const status =
    storedStatus && paymentDeadline
      ? resolveTrialStatus({
          status: storedStatus,
          payment_deadline: paymentDeadline,
          paid_at: null,
        })
      : null;

  const trial =
    status && paymentDeadline && seedTitle
      ? {
          status,
          paymentDeadline,
          seedTitle,
          seedDescription,
          totalDays,
          radarDirectionTitle,
          outcomes,
          priceAmount,
        }
      : null;

  return (
    <main className="dawn-theme relative min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(180deg,#020617_0%,#0f172a_28%,#1e1b4b_58%,#172554_82%,#0f2942_100%)] font-bai-jamjuree text-slate-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-16 h-[26rem] w-[26rem] rounded-full bg-blue-600/20 blur-[110px]" />
        <div className="absolute -right-28 top-[24rem] h-[24rem] w-[24rem] rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-[22rem] bg-[linear-gradient(to_top,rgba(254,217,92,0.10),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle,rgba(226,232,240,0.85)_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-h-12 min-w-12 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200"
          >
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
          <p className="text-sm font-semibold text-blue-100/90">
            ข้อมูลสำหรับผู้ปกครอง
          </p>
        </header>

        {trial ? (
          <PayPageClient
            token={token}
            initialStatus={trial.status}
            priceAmount={trial.priceAmount}
            paymentDeadline={trial.paymentDeadline}
            seedTitle={trial.seedTitle}
            seedDescription={trial.seedDescription}
            totalDays={trial.totalDays}
            radarDirectionTitle={trial.radarDirectionTitle}
            outcomes={trial.outcomes}
          />
        ) : (
          <section className="ei-card mx-auto max-w-xl p-8 text-center">
            <h2 className="text-xl font-bold text-white">
              ไม่พบลิงก์ชำระเงินนี้
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              ลิงก์อาจไม่ถูกต้องหรือถูกใช้งานไปแล้ว —
              หากบุตรหลานของท่านเพิ่งส่งลิงก์มาให้ กรุณาขอลิงก์อีกครั้ง
              หรือทักทีมงานเพื่อให้ช่วยตรวจสอบครับ/ค่ะ
            </p>
          </section>
        )}

        <footer className="mt-auto pt-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <MessageCircle
              className="h-4 w-4 text-[#06C755]"
              aria-hidden="true"
            />
            มีปัญหา? ทัก LINE{" "}
            <span className="font-semibold text-slate-200">@passionseed</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
