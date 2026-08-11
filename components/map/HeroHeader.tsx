import { Compass } from "lucide-react";

// The search field and Create Map button were removed in favour of the
// description below. The props are kept optional so existing callers still
// compile without change.
interface HeroHeaderProps {
  isAuthenticated?: boolean;
  onCreateMap?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function HeroHeader({}: HeroHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Border with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="relative container mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg">
                <Compass className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Pathlabs
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 tracking-wide">
                Discover • Learn • Master
              </p>
            </div>
          </div>

          {/* Description. Thai copy renders in Bai Jamjuree via the font-sans
              fallback -- Libre Franklin carries no Thai glyphs. leading-relaxed
              gives Thai tone marks and vowels room above and below the line. */}
          <p className="max-w-3xl text-sm sm:text-base text-gray-300/90 leading-relaxed">
            ทดสอบว่าทางนี้ใช้ทางของคุณไหม และเริ่มต้นเรียนรู้พื้นฐานของสายต่างๆ
            ผ่านการทำ Project ที่ออกแบบร่วมกับผู้เชี่ยวชาญของสายนั้นๆ ภายในเวลา 4-5 วัน
          </p>
        </div>
      </div>
    </div>
  );
}