"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface RadarFieldDay {
  date: string;
  fields: { field: string; count: number }[];
}

interface PlanStepDay {
  date: string;
  steps: { step: number; name: string; count: number }[];
}

interface AnalyticsData {
  dailyStats: DailyStat[];
  pathBreakdown: PathBreakdown[];
  radarFieldBreakdown: RadarFieldDay[];
  planStepBreakdown: PlanStepDay[];
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

  const daysButtons = (
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
  );

  // Filter breakdowns to only days with data
  const radarDaysWithData = (data.radarFieldBreakdown || []).filter(
    (d) => d.fields.length > 0
  );
  const planDaysWithData = (data.planStepBreakdown || []).filter(
    (d) => d.steps.length > 0
  );

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
            {daysButtons}
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
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="radarViews"
                name="Radar views"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="interestClicks"
                name="Interest clicks"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar views by field per day */}
      <Card>
        <CardHeader>
          <CardTitle>Radar views by field</CardTitle>
          <CardDescription>
            Which career pages were visited each day (last {days} days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {radarDaysWithData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No radar views in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Fields visited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {radarDaysWithData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(day.date), "MMM d")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {day.fields.map(({ field, count }) => (
                            <Badge
                              key={field}
                              variant="secondary"
                              className="text-xs"
                            >
                              {field}{" "}
                              <span className="ml-1 font-bold">{count}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan wizard step funnel per day */}
      <Card>
        <CardHeader>
          <CardTitle>/plan step reach</CardTitle>
          <CardDescription>
            How far visitors get in the plan wizard each day (last {days} days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planDaysWithData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No plan wizard step data in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Steps reached</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planDaysWithData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(day.date), "MMM d")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {day.steps.map(({ step, name, count }) => (
                            <Badge
                              key={step}
                              variant="outline"
                              className="text-xs"
                            >
                              {name}{" "}
                              <span className="ml-1 font-bold">{count}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
              height={Math.max(
                200,
                data.pathBreakdown.slice(0, 15).length * 36
              )}
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
                  fill="#f59e0b"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
