import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  PencilLine,
} from "lucide-react";

type FeedbackSuccessStateProps = {
  wantsContact: boolean;
  hasFollowUpInterests: boolean;
  onDashboard: () => void;
  onEdit: () => void;
};

export function FeedbackSuccessState({
  wantsContact,
  hasFollowUpInterests,
  onDashboard,
  onEdit,
}: FeedbackSuccessStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto max-w-2xl rounded-[28px] border border-emerald-300/20 bg-slate-950/65 p-6 text-center shadow-[0_28px_90px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-9"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200 shadow-[0_0_36px_rgba(52,211,153,0.15)]">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-5 font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
        ส่งเรียบร้อย
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-kodchasan)] text-2xl font-semibold text-white sm:text-3xl">
        ขอบคุณ เราได้รับฟีดแบ็กแล้ว
      </h2>
      <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-300 sm:text-base">
        คำตอบของคุณถูกบันทึกเรียบร้อย
        และจะถูกใช้ปรับโครงการกับเนื้อหาในแอปให้ดีขึ้น
      </p>

      {(wantsContact || hasFollowUpInterests) && (
        <div className="mt-6 rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.07] p-4 text-left">
          <p className="font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
            ต่อจากนี้
          </p>
          <ul className="mt-2 space-y-2 font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-300">
            {hasFollowUpInterests && (
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-indigo-300"
                  aria-hidden="true"
                />
                เราเก็บโอกาสที่คุณสนใจไว้แล้ว และจะแจ้งเมื่อมีขั้นตอนถัดไป
              </li>
            )}
            {wantsContact && (
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-indigo-300"
                  aria-hidden="true"
                />
                ทีม PassionSeed จะติดต่อกลับตามเรื่องที่คุณเลือก
              </li>
            )}
          </ul>
        </div>
      )}

      {!wantsContact && !hasFollowUpInterests && (
        <p className="mt-5 font-[family-name:var(--font-bai-jamjuree)] text-sm text-slate-400">
          ไม่มีอะไรต้องทำต่อ คุณกลับไปที่ Dashboard ได้เลย
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onDashboard}
          className="ei-button-dawn min-h-12 px-6 text-base"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          กลับไป Dashboard
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 font-[family-name:var(--font-bai-jamjuree)] text-sm font-semibold text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          แก้ไขคำตอบ
        </button>
      </div>
    </section>
  );
}
