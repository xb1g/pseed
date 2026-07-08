import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight, Bot, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { isAnonymousUser } from "@/lib/supabase/auth";
import { AIEngineerIntentRecorder } from "@/components/radar/AIEngineerIntentRecorder";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Engineer Path — PassionSeed",
  description: "เราบันทึกความสนใจของคุณแล้ว / We recorded your interest. This path is being built.",
};

const copy = {
  th: {
    eyebrow: "AI Engineer Path",
    title: "เราบันทึกความสนใจของคุณแล้ว",
    body: "Path นี้ยังอยู่ระหว่างการสร้าง เราจะบอกคุณทันทีที่พร้อมให้ลองทำจริง",
    note: "ขณะนี้คุณสามารถกลับไปสำรวจ Career Radar หรือเรียนรู้สายงานอื่นๆ ได้ต่อ",
    createAccount: "สร้างบัญชีเพื่อไม่พลาดการแจ้งเตือน",
    keepExploring: "สำรวจต่อแบบไม่ระบุตัวตน",
    backToRadar: "กลับไป Career Radar",
    anonBanner: "คุณกำลังใช้งานแบบไม่ระบุตัวตน — สร้างบัญชีเพื่อให้เราติดต่อคุณได้เมื่อ Path นี้พร้อม",
  },
  en: {
    eyebrow: "AI Engineer Path",
    title: "We recorded your interest",
    body: "This path is still being built. We'll let you know as soon as it's ready to try.",
    note: "For now, you can go back and keep exploring Career Radar or other career paths.",
    createAccount: "Create an account to get notified",
    keepExploring: "Keep exploring anonymously",
    backToRadar: "Back to Career Radar",
    anonBanner: "You're exploring anonymously — create an account so we can reach you when this path is ready.",
  },
};

function detectLanguage(acceptLanguage: string | null): "th" | "en" {
  if (!acceptLanguage) return "th";
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() || "";
  if (primary.startsWith("th")) return "th";
  return "en";
}

export default async function AIEngineerPathPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const lang = detectLanguage(acceptLanguage);
  const t = copy[lang];

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Error fetching user for AI Engineer path page:", error);
  }

  const isAnon = !user || isAnonymousUser(user);
  const returnTo = "/radar/ai-engineer";
  const loginHref = `/login?next=${encodeURIComponent("/seeds/pathlab/ai-engineer")}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#0f172a_46%,#111827_100%)] text-white">
      <AIEngineerIntentRecorder />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <Link
          href={returnTo}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToRadar}
        </Link>

        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center lg:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-900/20">
              <Bot className="h-8 w-8" />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">
              {t.eyebrow}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
              {t.body}
            </p>

            <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-neutral-400">
              <Clock className="h-4 w-4 shrink-0 text-violet-300" />
              {t.note}
            </div>

            {isAnon && (
              <div className="mx-auto mt-6 max-w-lg rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p className="text-left text-sm leading-6 text-amber-100">
                    {t.anonBanner}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isAnon ? (
                <>
                  <Button
                    asChild
                    className="h-12 bg-white px-6 font-semibold text-neutral-950 hover:bg-violet-100"
                  >
                    <Link href={loginHref}>
                      {t.createAccount}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 border-white/15 bg-white/5 px-6 font-semibold text-white hover:bg-white/10"
                  >
                    <Link href={returnTo}>{t.keepExploring}</Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="h-12 bg-white px-6 font-semibold text-neutral-950 hover:bg-violet-100"
                >
                  <Link href={returnTo}>
                    {t.backToRadar} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
