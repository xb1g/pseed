"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeadAudienceStats, LeadFunnelStage } from "@/lib/supabase/lead-insights";
import type { DmLeadStage } from "@/types/dm-leads";

const STAGE_LABEL: Record<DmLeadStage, string> = {
  unknown: "Unknown",
  exploring: "Exploring",
  building: "Building",
  job_seeking: "Job seeking",
};

const STAGE_COLORS: Record<DmLeadStage, string> = {
  unknown: "#a1a1aa",
  exploring: "#38bdf8",
  building: "#f59e0b",
  job_seeking: "#8b5cf6",
};

const COVERED_FILL = "#10b981";
const UNCOVERED_FILL = "#6366f1";

function FunnelSection({ stages }: { stages: LeadFunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel</CardTitle>
        <CardDescription>
          From IG comment to converted lead. Each stage is a subset of the one
          above; % is stage-to-stage conversion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>{stage.label}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {stage.count.toLocaleString()}
                </span>
                {stage.conversionFromPrev !== null && (
                  <> · {stage.conversionFromPrev}% of prev</>
                )}
              </span>
            </div>
            <div className="h-3 w-full rounded-sm bg-muted">
              <div
                className="h-3 rounded-sm bg-primary"
                style={{ width: `${Math.max((stage.count / max) * 100, stage.count > 0 ? 1 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function IntentCards({ audience }: { audience: LeadAudienceStats }) {
  const cards = [
    { label: "Wants PathLab", value: audience.intentCounts.wantsPathlab },
    { label: "Pay ready", value: audience.intentCounts.payReady },
    { label: "Wants community", value: audience.intentCounts.wantsCommunity },
    { label: "Wants talent track", value: audience.intentCounts.wantsTalent },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of {audience.totalConversations.toLocaleString()} conversations
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TopInterestsChart({ audience }: { audience: LeadAudienceStats }) {
  const data = audience.interestFrequency.slice(0, 15);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top interests</CardTitle>
        <CardDescription>
          Most-mentioned fields across conversations. Green = covered by a
          PathLab seed today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No interests classified yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(data.length * 32, 160)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="interest" width={160} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend
                payload={[
                  { value: "Covered by PathLab", type: "square", color: COVERED_FILL },
                  { value: "Not covered yet", type: "square", color: UNCOVERED_FILL },
                ]}
              />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.interest}
                    fill={entry.covered ? COVERED_FILL : UNCOVERED_FILL}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function StageDonut({ audience }: { audience: LeadAudienceStats }) {
  const data = (Object.entries(audience.stageCounts) as [DmLeadStage, number][])
    .filter(([, count]) => count > 0)
    .map(([stage, count]) => ({ name: STAGE_LABEL[stage], value: count, fill: STAGE_COLORS[stage] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage distribution</CardTitle>
        <CardDescription>Auto-classified stage per conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function GradeChart({ audience }: { audience: LeadAudienceStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade distribution</CardTitle>
        <CardDescription>“—” means we have not classified a grade yet</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={audience.gradeCounts} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Leads" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LeadInsightsCharts({
  funnel,
  audience,
}: {
  funnel: LeadFunnelStage[];
  audience: LeadAudienceStats;
}) {
  return (
    <div className="space-y-6">
      <FunnelSection stages={funnel} />
      <IntentCards audience={audience} />
      <TopInterestsChart audience={audience} />
      <div className="grid gap-6 lg:grid-cols-2">
        <StageDonut audience={audience} />
        <GradeChart audience={audience} />
      </div>
    </div>
  );
}
