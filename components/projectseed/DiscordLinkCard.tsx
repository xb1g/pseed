"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { syncDiscordLink } from "@/actions/projectseed";
import { createClient } from "@/utils/supabase/client";

/**
 * Route the OAuth return through the existing `/auth/callback`, the same URL
 * `components/login-form.tsx` uses for Discord and Google sign-in.
 *
 * Any other value would need its own entry in the Supabase redirect allowlist.
 * Reusing the one route that is already registered means linking works on every
 * environment the login page already works on — including preview deployments —
 * with no dashboard change. The callback exchanges the code and forwards to
 * `next`, which is what completes the identity link.
 */
function buildCallbackUrl(next: string): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const callback = new URL("/auth/callback", siteUrl);
  callback.searchParams.set("next", next);
  return callback.toString();
}

interface DiscordLinkCardProps {
  discordUsername: string | null;
  discordUserId: string | null;
  /**
   * True when the auth user already carries a Discord identity that has not
   * been copied onto the participant row yet — the state you land in right
   * after `linkIdentity` redirects back, and also the state of anyone who
   * signed up with Discord before this cohort existed.
   */
  needsSync: boolean;
}

export function DiscordLinkCard({
  discordUsername,
  discordUserId,
  needsSync,
}: DiscordLinkCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const syncAttempted = useRef(false);

  // Runs once per mount, guarded by a ref: React strict mode double-invokes
  // effects in development and this one writes to the database.
  useEffect(() => {
    if (!needsSync || syncAttempted.current) return;
    syncAttempted.current = true;

    startTransition(async () => {
      const result = await syncDiscordLink();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? null);
      }
    });
  }, [needsSync, router]);

  async function handleLink() {
    setError(null);
    const supabase = createClient();

    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "discord",
      options: {
        redirectTo: buildCallbackUrl("/projectseed/hub"),
        scopes: "identify",
      },
    });

    if (linkError) {
      // The most common cause is manual linking being off in the Supabase
      // project, which is a dashboard setting and not something the user can
      // fix — so say what happened rather than showing a generic retry.
      console.error("[projectseed] linkIdentity failed:", linkError.message);
      setError(
        "เชื่อมบัญชีไม่สำเร็จ — ถ้าเจอซ้ำ แจ้งทีมงานในห้อง Discord ได้เลย"
      );
    }
  }

  const linked = Boolean(discordUserId);

  return (
    <section className="ei-card flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-white">Discord</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            ห้องอยู่บน Discord ทั้งหมด เชื่อมบัญชีแล้วเราถึงจะรู้ว่าใครเป็นใครในห้องเสียง
          </p>
        </div>
        <span
          className={
            linked
              ? "shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300"
              : "shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300"
          }
        >
          {linked ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}
        </span>
      </div>

      {linked ? (
        <p className="font-mono text-sm text-blue-200">
          {discordUsername ?? "Discord"}{" "}
          <span className="text-slate-500">· {discordUserId}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleLink}
          className="ei-button-dawn self-start"
          disabled={pending}
        >
          <span>{pending ? "กำลังเชื่อม…" : "เชื่อมบัญชี Discord"}</span>
        </button>
      )}

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
