import { getCampaignQueue, getCampaignReadout } from "@/lib/supabase/dm-campaigns";
import { createAdminClient } from "@/utils/supabase/admin";
import { CampaignReviewQueue } from "@/components/admin/CampaignReviewQueue";
import { CampaignControls } from "@/components/admin/CampaignControls";

export const dynamic = "force-dynamic";

async function getLatestCampaign() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dm_campaigns")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export default async function CampaignPage() {
  const campaign = await getLatestCampaign();

  if (!campaign) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">รอบทัก</h2>
        <p className="text-sm text-muted-foreground">
          ยังไม่มีรอบทัก กดสร้างเพื่อให้ระบบเลือกคนที่ยังส่งข้อความหาได้
          แล้วร่างข้อความให้ทุกคน
        </p>
        <CampaignControls campaignId={null} autoCount={0} />
      </div>
    );
  }

  const [reviewQueue, autoQueue, readout] = await Promise.all([
    getCampaignQueue(campaign.id, "review"),
    getCampaignQueue(campaign.id, "auto"),
    getCampaignReadout(campaign.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{campaign.name}</h2>
        <p className="text-xs text-muted-foreground">
          เรียงตามเวลาที่เหลือก่อน Meta ปิดหน้าต่าง 7 วัน
        </p>
      </div>

      <CampaignControls campaignId={campaign.id} autoCount={autoQueue.length} />

      {readout.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">ผลตอบกลับต่อกลุ่ม</span>
          {readout.map((arm) => (
            <span key={arm.variant} className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {arm.variant === "ask" ? "มีคำถามปิดท้าย" : "ไม่มีคำถามปิดท้าย"}
              </span>
              <b className="tabular-nums">{arm.replyRate}%</b>
              <span className="text-muted-foreground/70">
                ({arm.replied}/{arm.sent})
              </span>
            </span>
          ))}
          <span className="text-muted-foreground/70">
            ยังสรุปไม่ได้จนกว่าจะส่งครบทั้งสองกลุ่ม
          </span>
        </div>
      )}

      <CampaignReviewQueue campaignId={campaign.id} items={reviewQueue} />
    </div>
  );
}
