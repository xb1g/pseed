import { DawnScene } from "@/components/projectseed/dawn-scene";

// Dawn-themed skeleton for the Pathlabs lobby. Warm-glass blocks mirror the
// real layout in client-page.tsx: centered HeroHeader, then map sections of
// square vinyl cards. Decorative only; pulse stops under reduced motion.
export default function Loading() {
  return (
    <div className="dawn-theme min-h-screen">
      <DawnScene />

      <div
        role="status"
        aria-label="Loading"
        className="relative z-10 motion-safe:animate-pulse"
      >
        {/* Hero header skeleton (mirrors components/map/HeroHeader.tsx) */}
        <div className="border-b border-white/5">
          <div className="container mx-auto flex flex-col items-center gap-5 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5" />
              <div className="space-y-2">
                <div className="h-6 w-28 rounded bg-white/10" />
                <div className="h-3 w-36 rounded bg-white/5" />
              </div>
            </div>
            <div className="h-4 w-full max-w-3xl rounded bg-white/5" />
          </div>
        </div>

        {/* Map section skeleton (mirrors components/map/MapSection.tsx) */}
        <div className="container mx-auto space-y-8 px-6 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded border border-white/10 bg-white/5" />
              <div className="h-7 w-44 rounded bg-white/10" />
              <div className="h-4 w-16 rounded bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="relative">
                  {/* Vinyl peeking above the cover */}
                  <div className="absolute -top-5 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03]" />
                  {/* Album cover tile with title bars at the bottom */}
                  <div className="relative flex aspect-square w-full flex-col justify-end gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
