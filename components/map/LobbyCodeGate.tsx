"use client";

import { useState, useCallback, Suspense, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { joinLobbyByCode } from "@/lib/api/lobbies-client";
import { JOIN_LOBBY_ERROR } from "@/types/lobby";
import { useAuth } from "@/hooks/use-auth";
import type { JourneyDay } from "@/lib/utils/map-journey";
import { WEB_DEV_PATH, type PathDay, type PathContent } from "@/lib/content/web-dev-path";
import { STARTUP_PATH } from "@/lib/content/startup-path";
import { Lock, MapPin, Check } from "lucide-react";

export interface MapPreview {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  node_count: number;
  avg_difficulty: number;
  category: string | null;
  /** Day-by-day learning journey derived from the map's path graph. */
  journey: JourneyDay[];
}

interface LobbyCodeGateProps {
  map: MapPreview;
  onJoined: () => void;
}

/** Resolves the curriculum content to display for the given map preview. */
function getPathContent(map: MapPreview): PathContent {
  if (map.id === "00000000-0000-0000-0000-000000000020") {
    return STARTUP_PATH;
  }
  if (map.id === "00000000-0000-0000-0000-000000000010") {
    return WEB_DEV_PATH;
  }

  const title = (map.title ?? "").toLowerCase();
  const category = (map.category ?? "").toLowerCase();

  if (
    title.includes("web") ||
    title.includes("เว็บ") ||
    title.includes("frontend") ||
    category.includes("web") ||
    category.includes("code")
  ) {
    return WEB_DEV_PATH;
  }

  return STARTUP_PATH;
}

/** Normalizes anything typed or pasted into a 6-char join code. */
const normalizeCode = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export function LobbyCodeGate({ map, onJoined }: LobbyCodeGateProps) {
  // A shared join link (/map/<id>?code=ABC123) prefills the field, so the
  // student only has to press the button.
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() =>
    normalizeCode(searchParams.get("code") ?? "")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCode(normalizeCode(e.target.value));
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (code.length !== 6 || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        await joinLobbyByCode(code);
        onJoined();
      } catch {
        // Any failure — invalid code, closed lobby, network — shows the same
        // opaque message so the form cannot be used to discover valid codes.
        setError(JOIN_LOBBY_ERROR);
      } finally {
        setIsLoading(false);
      }
    },
    [code, isLoading, onJoined]
  );

  const isSignedOut = !authLoading && !isAuthenticated;
  const canSubmit = code.length === 6 && !isLoading;
  const path = getPathContent(map);

  return (
    <div className="min-h-screen dusk-theme relative overflow-x-hidden">
      {/* Backdrop: grainy crimson/violet gradient, styles in globals.css */}
      <div className="lobby-backdrop" aria-hidden="true" />
      <div className="lobby-backdrop__grain" aria-hidden="true" />
      {/* One light scrim, not two. Stacking a vertical and a radial pass
          compounded to ~77% opacity and turned the gradient black. A single
          soft vertical wash keeps the colour visible; contrast is carried by
          the text plate behind the content column instead. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[8] bg-[linear-gradient(180deg,rgba(24,6,32,0.34)_0%,rgba(24,6,32,0.12)_42%,rgba(24,6,32,0.3)_100%)]"
      />

      <main className="lobby-plate relative z-10 mx-auto w-full max-w-xl px-5 pt-12 pb-20 sm:pt-16">
        <div className="lobby-rise">
          <PathHeader map={map} path={path} />
        </div>

        <div className="lobby-rise mt-10" style={{ animationDelay: "90ms" }}>
          <DayList days={path.days} />
        </div>

        <div className="lobby-rise mt-10" style={{ animationDelay: "180ms" }}>
          <CodeEntryCard
            code={code}
            error={error}
            isLoading={isLoading}
            isSignedOut={isSignedOut}
            canSubmit={canSubmit}
            mapId={map.id}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header: what you end up with, stated first                          */
/* ------------------------------------------------------------------ */

function PathHeader({ map, path }: { map: MapPreview; path: PathContent }) {
  return (
    <header>
      {/* Cover art is a band, not a card lid: the page is a document, not a
          stack of panels. */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-2xl border border-white/10">
        {map.cover_image_url ? (
          <Image
            src={map.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 576px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-[#2a0f4a] to-amber-900/40 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-white/15" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12031f] via-[#12031f]/30 to-transparent" />
      </div>

      <h1 className="mt-6 text-[1.75rem] sm:text-4xl font-bold leading-[1.15] tracking-tight text-white text-balance">
        {path.titleTh}
      </h1>
      <p className="mt-1 text-sm font-medium text-amber-300/80">
        {path.titleEn}
      </p>

      <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-7 text-slate-300 text-pretty">
        {path.taglineTh}
      </p>

      {/* Three facts inline as a sentence-like row, not a metric grid. */}
      <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-slate-400">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">ระยะเวลา</dt>
          <dd className="font-semibold text-white">{path.days.length} วัน</dd>
        </div>
        <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">เวลาต่อวัน</dt>
          <dd>{path.hoursPerDay}</dd>
        </div>
        <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">ระดับ</dt>
          <dd>{path.level}</dd>
        </div>
      </dl>

      {/* The outcome is the reason to enrol, so it gets its own emphasis
          rather than sitting in the body copy. */}
      <p className="mt-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-[0.9375rem] leading-7 text-amber-50/90">
        <Check
          className="mt-1 h-4 w-4 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <span className="text-pretty">{path.outcomeTh}</span>
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Day list: what happens each day                                     */
/* ------------------------------------------------------------------ */

function DayList({ days }: { days: PathDay[] }) {
  return (
    <section aria-labelledby="days-heading">
      <h2
        id="days-heading"
        className="text-xl sm:text-2xl font-bold tracking-tight text-white"
      >
        แต่ละวันทำอะไรบ้าง
      </h2>

      <ol className="mt-6 space-y-px">
        {days.map((day, i) => (
          <DayRow key={day.day} day={day} isLast={i === days.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function DayRow({ day, isLast }: { day: PathDay; isLast: boolean }) {
  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {/* Connector runs between markers, stopping at the final day. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[0.9375rem] top-9 bottom-1 w-px bg-gradient-to-b from-white/15 to-white/[0.04]"
        />
      )}

      <span
        aria-hidden="true"
        className={`relative z-10 flex h-[1.875rem] w-[1.875rem] shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-bold tabular-nums ${
          day.isFinale
            ? "bg-amber-400 text-[#2a0818] shadow-[0_0_18px_rgba(251,191,36,0.35)]"
            : "border border-white/15 bg-[#1c0b30] text-slate-300"
        }`}
      >
        {day.day}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h3 className="text-base font-semibold leading-6 text-white">
            {day.titleTh}
          </h3>
          {day.isFinale && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-200">
              วันสุดท้าย
            </span>
          )}
        </div>

        <p className="mt-1.5 max-w-[58ch] text-[0.875rem] leading-6 text-slate-400 text-pretty">
          {day.bodyTh}
        </p>

        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {day.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.75rem] text-slate-300"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Code entry                                                          */
/* ------------------------------------------------------------------ */

interface CodeEntryCardProps {
  code: string;
  error: string | null;
  isLoading: boolean;
  isSignedOut: boolean;
  canSubmit: boolean;
  mapId: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

function CodeEntryCard({
  code,
  error,
  isLoading,
  isSignedOut,
  canSubmit,
  mapId,
  onChange,
  onSubmit,
}: CodeEntryCardProps) {
  return (
    <div className="ei-card p-6">
      <h2 className="text-base font-semibold text-white">
        กรอกรหัสเพื่อเริ่มวันที่ 1
      </h2>
      <p className="mt-1.5 mb-5 text-[0.8125rem] leading-6 text-slate-400">
        ขอรหัส 6 ตัวอักษรจากผู้สอนของคุณ
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            maxLength={6}
            placeholder="ABCDEF"
            value={code}
            onChange={onChange}
            disabled={isLoading || isSignedOut}
            className="ei-input pl-10 text-center text-2xl font-mono tracking-[0.25em] uppercase"
            aria-label="Lobby join code"
            aria-describedby={error ? "code-error" : undefined}
            aria-invalid={error ? "true" : "false"}
          />
        </div>

        {error && (
          <div
            id="code-error"
            role="alert"
            className="text-sm text-red-400 text-center"
          >
            {error}
          </div>
        )}

        {isSignedOut ? (
          <SignInButton mapId={mapId} code={code} />
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="ei-button-dusk w-full justify-center"
          >
            {isLoading ? (
              <span className="ei-loading-orbit">
                <span className="ei-loading-planet" />
                <span className="ei-loading-moon" />
              </span>
            ) : (
              "เข้าร่วมและเริ่มเรียน"
            )}
          </button>
        )}
      </form>
    </div>
  );
}

interface SignInButtonProps {
  mapId: string;
  code: string;
}

function SignInButton({ mapId, code }: SignInButtonProps) {
  const router = useRouter();
  // Carry the code through login so the link keeps working after sign-in.
  const target = code
    ? `/map/${mapId}?code=${encodeURIComponent(code)}`
    : `/map/${mapId}`;
  return (
    <button
      type="button"
      onClick={() => router.push(`/login?next=${encodeURIComponent(target)}`)}
      className="ei-button-dusk w-full justify-center"
    >
      เข้าสู่ระบบเพื่อเริ่ม
    </button>
  );
}

interface LobbyCodeGateWrapperProps {
  map: MapPreview;
}

export function LobbyCodeGateWrapper({ map }: LobbyCodeGateWrapperProps) {
  const router = useRouter();
  // useSearchParams (join-link prefill) needs a suspense boundary above it.
  return (
    <Suspense fallback={null}>
      <LobbyCodeGate map={map} onJoined={() => router.refresh()} />
    </Suspense>
  );
}
