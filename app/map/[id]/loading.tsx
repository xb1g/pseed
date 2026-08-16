import { DawnScene } from "@/components/projectseed/dawn-scene";

// Dawn-themed skeleton for the map viewer. Faint island nodes drift across
// the canvas area (suggesting a path, not gray boxes); the right column wears
// the .dawn-panel warm glass used by the real node panel. Decorative only;
// pulse stops under reduced motion.
export default function Loading() {
  return (
    <div className="dawn-theme">
      <DawnScene />

      <div
        role="status"
        aria-label="Loading"
        className="relative z-10 flex h-[calc(100vh-var(--header-height))] w-full motion-safe:animate-pulse"
      >
        {/* Canvas area: faint island-node placeholders along a path */}
        <div className="relative flex-grow overflow-hidden">
          <div className="absolute left-[12%] top-[62%] h-4 w-4 rounded-full border border-white/15 bg-white/10" />
          <div className="absolute left-[30%] top-[44%] h-5 w-5 rounded-full border border-white/15 bg-white/10" />
          <div className="absolute left-[50%] top-[55%] h-4 w-4 rotate-45 rounded-md border border-white/10 bg-white/5" />
          {/* Current island catches a hint of dawn gold */}
          <div className="absolute left-[66%] top-[34%] h-6 w-6 rounded-full border border-amber-200/25 bg-amber-200/15" />
          <div className="absolute left-[84%] top-[48%] h-4 w-4 rotate-45 rounded-md border border-white/10 bg-white/5" />
        </div>

        {/* Right column styled like the real node panel (.dawn-panel) */}
        <div className="dawn-panel flex h-full w-[30%] flex-col border-l border-white/10">
          <div className="dawn-panel__header flex-shrink-0 space-y-3 p-4">
            <div className="h-7 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
          </div>
          <div className="flex-1 space-y-4 p-4">
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="h-48 w-full rounded-lg border border-white/10 bg-white/5" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-5/6 rounded bg-white/5" />
              <div className="h-3 w-2/3 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
