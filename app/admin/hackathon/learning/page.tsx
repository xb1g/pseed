import { LearningAnalyticsDashboard } from "@/components/admin/LearningAnalyticsDashboard";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

export default async function HackathonLearningPage() {
  await requireAdmin();
  return (
    <div className="container mx-auto space-y-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Learning Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Who actually learned and grappled with the problem — Phase 1–2 plan-fidelity +
          Phase 3 cycle-rigor, vs the human semifinal score. AI-likelihood is independent.
        </p>
      </div>
      <LearningAnalyticsDashboard />
    </div>
  );
}
