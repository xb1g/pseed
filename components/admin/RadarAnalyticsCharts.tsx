"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Loader2,
  Eye,
  MousePointerClick,
  Map as MapIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface DailyStat {
  date: string;
  planVisits: number;
  radarViews: number;
  interestClicks: number;
}

interface PathBreakdown {
  path: string;
  count: number;
}

interface AnalyticsData {
  dailyStats: DailyStat[];
  pathBreakdown: PathBreakdown[];
  summary: {
    totalPlanVisits: number;
    totalRadarViews: number;
    totalInterestClicks: number;
  };
}

export function RadarAnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/radar/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Failed to load analytics data
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.dailyStats.map((s) => ({
    date: format(parseISO(s.date), "MMM d"),
    fullDate: s.date,
    planVisits: s.planVisits,
    radarViews: s.radarViews,
    interestClicks: s.interestClicks,
  }));

  const { totalPlanVisits, totalRadarViews, totalInterestClicks } =
    data.summary;

  const convRadarToInterest =
    totalRadarViews > 0
      ? ((totalInterestClicks / totalRadarViews) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Funnel summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">/plan visits</CardTitle>
            <MapIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPlanVisits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Radar views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRadarViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Career detail pages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interest clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInterestClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {convRadarToInterest}% of radar views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily funnel line chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily funnel</CardTitle>
              <CardDescription>
                Plan visits → Radar views → Interest clicks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    days === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                stroke="currentColor"
              />
              <YAxis className="text-xs" stroke="currentColor" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="planVisits"
                name="/plan visits"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="radarViews"
                name="Radar views"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="interestClicks"
                name="Interest clicks"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-3))", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Interest clicks by career path */}
      {data.pathBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interest clicks by career path</CardTitle>
            <CardDescription>
              Which paths are earning the most interest (last {days} days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, data.pathBreakdown.slice(0, 15).length * 36)}
            >
              <BarChart
                data={data.pathBreakdown.slice(0, 15).map((p) => ({
                  path:
                    p.path.length > 35
                      ? p.path.substring(0, 35) + "..."
                      : p.path,
                  clicks: p.count,
                }))}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  type="number"
                  className="text-xs"
                  stroke="currentColor"
                />
                <YAxis
                  type="category"
                  dataKey="path"
                  width={200}
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="clicks"
                  name="Interest clicks"
                  fill="hsl(var(--chart-4))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
