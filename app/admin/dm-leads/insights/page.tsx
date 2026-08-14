import { getLeadAudienceStats, getLeadFunnelStats } from "@/lib/supabase/lead-insights";
import { LeadInsightsCharts } from "@/components/admin/LeadInsightsCharts";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

export default async function LeadInsightsPage() {
  const [funnel, audience] = await Promise.all([
    getLeadFunnelStats(),
    getLeadAudienceStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Lead Insights</h2>
          <p className="text-sm text-muted-foreground">
            Funnel and audience across all DM leads. Internal accounts are excluded.
          </p>
        </div>
        <RefreshButton />
      </div>

      <LeadInsightsCharts funnel={funnel} audience={audience} />
    </div>
  );
}
