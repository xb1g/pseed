export default function Loading() {
  return (
    <div
      className="dawn-theme min-h-screen bg-[linear-gradient(180deg,#020617_0%,#0f172a_40%,#1e1b4b_100%)]"
      role="status"
      aria-label="กำลังเตรียม My Path"
      aria-live="polite"
    >
      <span className="sr-only">กำลังเตรียม My Path</span>
      <div className="container mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
        <div className="ei-card ei-card--static min-h-[24rem] p-6 sm:p-9">
          <div className="grid h-full content-center gap-5">
            <div className="ei-skeleton h-4 w-36" />
            <div className="ei-skeleton h-10 w-full max-w-2xl sm:h-14" />
            <div className="ei-skeleton h-5 w-full max-w-xl" />
            <div className="ei-skeleton mt-3 h-12 w-full max-w-xs" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 sm:p-8">
          <div className="ei-skeleton h-5 w-52" />
          <div className="mt-7 grid gap-8">
            {["plan", "radar", "pathlab", "projectseed", "evidence"].map((section) => (
              <div key={section} className="grid gap-3 border-t border-white/10 pt-6">
                <div className="ei-skeleton h-6 w-44" />
                <div className="ei-skeleton h-4 w-full" />
                <div className="ei-skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
