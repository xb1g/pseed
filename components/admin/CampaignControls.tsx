"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  buildCampaignAction,
  runAutoSendAction,
} from "@/app/admin/dm-leads/campaign/actions";
import { INELIGIBLE_LABELS, type IneligibleReason } from "@/lib/dm-leads/campaign";

/**
 * Build a sweep, then release the auto-lane.
 *
 * The two are separate buttons on purpose: building is free and reversible,
 * sending is neither. Nothing here fires without a click.
 */
export function CampaignControls({
  campaignId,
  autoCount,
}: {
  campaignId: string | null;
  autoCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Record<string, number> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const build = () =>
    startTransition(async () => {
      setStatus("กำลังเลือกคนและร่างข้อความ…");
      setErrors([]);
      const name = `รอบ ${new Date().toLocaleDateString("th-TH")}`;
      const result = await buildCampaignAction(name);
      if (!result.ok || !result.result) {
        setStatus(null);
        setErrors([result.error ?? "สร้างรอบไม่สำเร็จ"]);
        return;
      }
      const { queued, auto, review, fellBack } = result.result;
      setSkipped(result.result.skipped);
      setStatus(
        `เข้าคิว ${queued} คน · ส่งอัตโนมัติได้ ${auto} · ต้องตรวจเอง ${review}` +
          (fellBack > 0 ? ` · ใช้ข้อความต้นฉบับ ${fellBack} (AI ไม่ผ่านเกณฑ์)` : "")
      );
    });

  const autoSend = () =>
    startTransition(async () => {
      setStatus(`กำลังส่ง ${autoCount} ข้อความ…`);
      setErrors([]);
      const result = await runAutoSendAction(campaignId!);
      setStatus(`ส่งแล้ว ${result.sent} · เหลือ ${result.remaining}`);
      if (result.errors.length > 0) setErrors(result.errors);
      if (result.error) setErrors((prev) => [...prev, result.error!]);
    });

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={build} disabled={pending}>
          {pending ? "กำลังทำงาน…" : "สร้างรอบใหม่"}
        </Button>
        {campaignId && autoCount > 0 && (
          <Button size="sm" variant="outline" onClick={autoSend} disabled={pending}>
            ส่งอัตโนมัติ {autoCount} คน
          </Button>
        )}
        {status && <span className="text-xs text-muted-foreground">{status}</span>}
      </div>

      {skipped && (
        <p className="text-xs text-muted-foreground">
          ไม่ได้เข้าคิว:{" "}
          {Object.entries(skipped)
            .filter(([, n]) => n > 0)
            .map(
              ([reason, n]) =>
                `${INELIGIBLE_LABELS[reason as IneligibleReason] ?? reason} ${n}`
            )
            .join(" · ") || "ไม่มี"}
        </p>
      )}

      {errors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-red-600">
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
