"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  view_type: "list" | "rpg";
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface CareerTestDashboardProps {
  events: TestEvent[];
}

export function CareerTestDashboard({ events }: CareerTestDashboardProps) {
  const metrics = useMemo(() => {
    const listEvents = events.filter((e) => e.view_type === "list");
    const rpgEvents = events.filter((e) => e.view_type === "rpg");

    // Unique sessions per view
    const listSessions = new Set(listEvents.map((e) => e.session_id));
    const rpgSessions = new Set(rpgEvents.map((e) => e.session_id));

    // A. Comprehension: class_selected / subclass_selected vs search_query / filter_applied
    const listSearches = listEvents.filter((e) => e.event_type === "search_query").length;
    const listFilters = listEvents.filter((e) => e.event_type === "filter_applied").length;
    const rpgClasses = rpgEvents.filter((e) => e.event_type === "class_selected").length;
    const rpgSubclasses = rpgEvents.filter((e) => e.event_type === "subclass_selected").length;

    // B. Conversion: path_clicked / enroll_started
    const listClicks = listEvents.filter((e) => e.event_type === "path_clicked").length;
    const rpgClicks = rpgEvents.filter((e) => e.event_type === "path_clicked").length;
    const listEnroll = listEvents.filter((e) => e.event_type === "enroll_started").length;
    const rpgEnroll = rpgEvents.filter((e) => e.event_type === "enroll_started").length;

    // C. Engagement: scroll_depth, time_on_page
    const listScrolls = listEvents.filter((e) => e.event_type === "scroll_depth");
    const rpgScrolls = rpgEvents.filter((e) => e.event_type === "scroll_depth");
    const listAvgScroll =
      listScrolls.length > 0
        ? listScrolls.reduce((sum, e) => sum + ((e.payload.depth as number) || 0), 0) /
          listScrolls.length
        : 0;
    const rpgAvgScroll =
      rpgScrolls.length > 0
        ? rpgScrolls.reduce((sum, e) => sum + ((e.payload.depth as number) || 0), 0) /
          rpgScrolls.length
        : 0;

    const listTimes = listEvents.filter((e) => e.event_type === "time_on_page");
    const rpgTimes = rpgEvents.filter((e) => e.event_type === "time_on_page");
    const listAvgTime =
      listTimes.length > 0
        ? listTimes.reduce((sum, e) => sum + ((e.payload.seconds as number) || 0), 0) /
          listTimes.length
        : 0;
    const rpgAvgTime =
      rpgTimes.length > 0
        ? rpgTimes.reduce((sum, e) => sum + ((e.payload.seconds as number) || 0), 0) /
          rpgTimes.length
        : 0;

    // Click rate per session
    const listClickRate =
      listSessions.size > 0 ? (listClicks / listSessions.size).toFixed(2) : "0";
    const rpgClickRate =
      rpgSessions.size > 0 ? (rpgClicks / rpgSessions.size).toFixed(2) : "0";

    return {
      list: {
        sessions: listSessions.size,
        clicks: listClicks,
        clickRate: listClickRate,
        enrolls: listEnroll,
        searches: listSearches,
        filters: listFilters,
        avgScroll: Math.round(listAvgScroll),
        avgTime: Math.round(listAvgTime),
      },
      rpg: {
        sessions: rpgSessions.size,
        clicks: rpgClicks,
        clickRate: rpgClickRate,
        enrolls: rpgEnroll,
        classes: rpgClasses,
        subclasses: rpgSubclasses,
        avgScroll: Math.round(rpgAvgScroll),
        avgTime: Math.round(rpgAvgTime),
      },
    };
  }, [events]);

  const totalSessions = metrics.list.sessions + metrics.rpg.sessions;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">List View Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.list.sessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">RPG View Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rpg.sessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* A. Comprehension */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          A. User Comprehension{" "}
          <Badge variant="secondary">Which is easier to understand?</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">List View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Search queries" value={metrics.list.searches} />
              <MetricRow label="Filter uses" value={metrics.list.filters} />
              <p className="text-xs text-muted-foreground mt-2">
                High search/filter = user hunting for something specific.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RPG View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Class selections" value={metrics.rpg.classes} />
              <MetricRow label="Subclass selections" value={metrics.rpg.subclasses} />
              <p className="text-xs text-muted-foreground mt-2">
                High class/subclass clicks = hierarchical navigation working.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* B. Conversion */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          B. Conversion{" "}
          <Badge variant="secondary">Which drives more action?</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">List View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Path clicks" value={metrics.list.clicks} />
              <MetricRow label="Clicks per session" value={metrics.list.clickRate} />
              <MetricRow label="Enroll starts" value={metrics.list.enrolls} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RPG View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Path clicks" value={metrics.rpg.clicks} />
              <MetricRow label="Clicks per session" value={metrics.rpg.clickRate} />
              <MetricRow label="Enroll starts" value={metrics.rpg.enrolls} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* C. Engagement */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          C. Engagement{" "}
          <Badge variant="secondary">Which holds attention?</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">List View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Avg scroll depth" value={`${metrics.list.avgScroll}%`} />
              <MetricRow label="Avg time on page" value={`${metrics.list.avgTime}s`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RPG View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricRow label="Avg scroll depth" value={`${metrics.rpg.avgScroll}%`} />
              <MetricRow label="Avg time on page" value={`${metrics.rpg.avgTime}s`} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Raw events table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Events</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">View</th>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left">Payload</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={event.view_type === "list" ? "default" : "secondary"}>
                      {event.view_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{event.event_type}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[300px] truncate">
                    {JSON.stringify(event.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
