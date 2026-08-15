import Link from "next/link";

/**
 * Header for the parents page. Sticky, because the page is long and a parent
 * who decides halfway down should not have to scroll back for the exit.
 */
export function ParentsNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-kodchasan text-base font-medium tracking-tight text-white transition-colors hover:text-amber-200"
        >
          Passion Seed
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="#parents-faq"
            className="hidden min-h-11 items-center rounded-full px-3 font-bai-jamjuree text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:inline-flex"
          >
            คำถามที่ถามบ่อย
          </Link>
          <Link
            href="#parents-price"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-4 font-bai-jamjuree text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white"
          >
            ราคาและรอบ
          </Link>
        </nav>
      </div>
    </header>
  );
}
