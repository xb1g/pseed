export default function RadarFieldLoading() {
  return (
    <main className="fixed inset-0 z-[100] grid min-h-[100dvh] place-items-center overflow-hidden bg-neutral-950 text-white">
      <div className="grid justify-items-center gap-4" role="status" aria-live="polite">
        <span className="h-10 w-10 animate-pulse rounded-full border border-emerald-200/30 bg-emerald-200/10 shadow-[0_0_32px_rgba(110,231,183,0.2)]" />
        <p className="font-radar-thai text-sm font-semibold text-white/65">
          กำลังเปิดเส้นทางอาชีพ…
        </p>
      </div>
    </main>
  );
}
