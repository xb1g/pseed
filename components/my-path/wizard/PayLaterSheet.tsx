"use client";

import Link from "next/link";
import { CircleAlert, Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrialShareActions,
  type TrialShareInfo,
} from "@/components/trials/TrialShareActions";

interface PayLaterSheetProps {
  open: boolean;
  /** สถานะการสร้าง trial — loading ขณะ POST, error ล้มเหลว (retry ได้), ready พร้อมแชร์ */
  state: "loading" | "error" | "ready";
  trial: TrialShareInfo | null;
  seedHref: string;
  seedTitle: string;
  onRetry: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet หลังนักเรียนกด "เริ่ม PathLab วันแรก" —
 * สร้าง trial (ทำก่อน จ่ายทีหลัง) แล้วชวนส่งลิงก์ให้ผู้ปกครองชำระภายใน 24 ชม.
 */
export function PayLaterSheet({
  open,
  state,
  trial,
  seedHref,
  seedTitle,
  onRetry,
  onClose,
}: PayLaterSheetProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="dawn-theme inset-x-0 bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-3xl border-white/10 bg-slate-950/95 p-5 pb-8 text-slate-100 backdrop-blur-xl sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl"
        aria-describedby={undefined}
      >
        {state === "loading" && (
          <div className="py-10 text-center" role="status">
            <DialogTitle className="sr-only">กำลังเปิดการทดลอง</DialogTitle>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-amber-200" />
            <p className="mt-4 text-sm text-slate-400">
              กำลังเปิดการทดลองให้…
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="py-6 text-center">
            <CircleAlert
              className="mx-auto h-9 w-9 text-rose-200"
              aria-hidden="true"
            />
            <DialogHeader className="mt-4 text-center sm:text-center">
              <DialogTitle className="font-kodchasan text-lg text-slate-50">
                เปิดการทดลองไม่สำเร็จ
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-400">
                สัญญาณขัดข้องชั่วคราว — กดลองอีกครั้งได้เลย แผนของคุณยังอยู่ครบ
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={onRetry}
                className="ei-button-dawn min-h-12 w-full justify-center"
              >
                <span>ลองอีกครั้ง</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 w-full rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
        )}

        {state === "ready" && trial && (
          <div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-kodchasan text-xl leading-snug text-slate-50">
                เริ่มได้เลยวันนี้ — ฝากผู้ปกครองชำระภายใน 24 ชม.
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-400">
                {seedTitle} ปลดล็อกให้คุณแล้ว —
                ส่งลิงก์นี้ให้ผู้ปกครองชำระค่าทดลอง ฿1,490
                แล้วลุยวันแรกได้ทันที
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5">
              <TrialShareActions
                payUrl={trial.payUrl}
                paymentDeadline={trial.paymentDeadline}
              />
            </div>

            <div className="mt-5 space-y-2.5">
              <Link
                href={seedHref}
                className="ei-button-dawn min-h-12 w-full justify-center"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>เริ่ม PathLab เลย</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 w-full rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
