"use client";

import { useState, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { joinLobbyByCode } from "@/lib/api/lobbies-client";
import { JOIN_LOBBY_ERROR } from "@/types/lobby";
import { useAuth } from "@/hooks/use-auth";
import { Lock, MapPin, BarChart3, Tag } from "lucide-react";

export interface MapPreview {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  node_count: number;
  avg_difficulty: number;
  category: string | null;
}

interface LobbyCodeGateProps {
  map: MapPreview;
  onJoined: () => void;
}

export function LobbyCodeGate({ map, onJoined }: LobbyCodeGateProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
      setCode(upper.slice(0, 6));
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dusk-theme">
      {/* Atmospheric background layers */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, #06000f 0%, #1a0336 28%, #3b0764 58%, #4a1230 82%, #2a0818 100%)",
        }}
      />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(107, 33, 168, 0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "dusk-cloud-a 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "dusk-cloud-b 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-64"
          style={{
            background:
              "linear-gradient(to top, rgba(251, 146, 60, 0.15) 0%, transparent 60%)",
            animation: "sun-rise 48s ease-in-out infinite",
          }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Map preview card */}
        <div className="ei-card overflow-hidden mb-6">
          {/* Cover image */}
          <div className="relative h-48 w-full">
            {map.cover_image_url ? (
              <Image
                src={map.cover_image_url}
                alt={map.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-amber-900/40 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-white/20" />
              </div>
            )}
            {/* Bottom scrim for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <h1 className="text-xl font-bold text-white leading-tight">
              {map.title}
            </h1>
            {map.description && (
              <p className="text-sm text-slate-300 leading-relaxed">
                {map.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{map.node_count} nodes</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Difficulty {map.avg_difficulty.toFixed(1)}</span>
              </div>
              {map.category && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{map.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Code entry card */}
        <div className="ei-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Enter lobby code
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Ask your instructor for the 6-character code to join this map.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                maxLength={6}
                placeholder="ABCDEF"
                value={code}
                onChange={handleChange}
                disabled={isLoading || isSignedOut}
                className="ei-input text-center text-2xl font-mono tracking-[0.25em] uppercase"
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
              <SignInButton mapId={map.id} />
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
                  "Join Lobby"
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

interface SignInButtonProps {
  mapId: string;
}

function SignInButton({ mapId }: SignInButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/login?redirect=/map/${mapId}`)}
      className="ei-button-dusk w-full justify-center"
    >
      Sign in to join
    </button>
  );
}

interface LobbyCodeGateWrapperProps {
  map: MapPreview;
}

export function LobbyCodeGateWrapper({ map }: LobbyCodeGateWrapperProps) {
  const router = useRouter();
  return <LobbyCodeGate map={map} onJoined={() => router.refresh()} />;
}
