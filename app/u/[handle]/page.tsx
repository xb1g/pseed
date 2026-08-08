import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortfolioView } from "@/components/profile/portfolio/PortfolioView";
import {
  getOwnerPortfolio,
  getPublicPortfolio,
  resolveOwnerHandle,
} from "@/lib/profile/portfolio";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

interface PortfolioPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} — PassionSeed Portfolio` };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { handle } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (await resolveOwnerHandle(supabase, handle, user.id))) {
    const portfolio = await getOwnerPortfolio(supabase, user.id);
    if (!portfolio) {
      notFound();
    }
    return <PortfolioView portfolio={portfolio} isOwner />;
  }

  const portfolio = await getPublicPortfolio(supabase, handle);
  if (!portfolio) {
    return <PortfolioUnavailable handle={handle} />;
  }

  return <PortfolioView portfolio={portfolio} isOwner={false} />;
}

function PortfolioUnavailable({ handle }: { handle: string }) {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden bg-[#020617] text-slate-200">
      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
          Portfolio unavailable
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-libre-franklin)] text-3xl font-semibold text-white">
          @{handle}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
          This portfolio is private or does not exist yet. The owner can publish
          it from their profile page.
        </p>
      </div>
    </div>
  );
}
