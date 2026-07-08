import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, Users } from "lucide-react";

export const dynamic = "force-dynamic";

type EngagementRow =
  Database["public"]["Views"]["analytics_radar_engagement"]["Row"];

type IntentRow = Database["public"]["Tables"]["radar_path_intents"]["Row"];

export default async function AdminRadarPage() {
  const supabase = await createClient();

  const { data: engagement, error: engagementError } = await supabase
    .from("analytics_radar_engagement")
    .select("*")
    .order("views", { ascending: false });

  const { data: recentIntents, error: intentsError } = await supabase
    .from("radar_path_intents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const intentUserIds = (recentIntents || [])
    .map((i) => i.user_id)
    .filter((id): id is string => Boolean(id));

  const { data: intentProfiles, error: profilesError } =
    intentUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name, username")
          .in("id", intentUserIds)
      : { data: [], error: null };

  const totalViews = engagement?.reduce((sum, row) => sum + (row.views || 0), 0) ?? 0;
  const totalIntents =
    engagement?.reduce((sum, row) => sum + (row.intents || 0), 0) ?? 0;
  const uniqueViewers =
    engagement?.reduce(
      (sum, row) => sum + (row.unique_viewers || 0),
      0
    ) ?? 0;

  const profileById = new Map(
    (intentProfiles || []).map((p) => [p.id, p])
  );

  const error = engagementError || intentsError || profilesError;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Career Radar</h2>
        <p className="text-sm text-muted-foreground">
          Track who is viewing radar fields and who wants to try each hands-on
          path.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load radar engagement data: {error.message}
        </div>
      )}

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueViewers} unique sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Path Intents</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIntents}</div>
            <p className="text-xs text-muted-foreground">
              CTA clicks to start a path
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Intent Rate
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews > 0
                ? `${((totalIntents / totalViews) * 100).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Intents per page view
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-field engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Views & Intents by Field</CardTitle>
          <CardDescription>
            Published radar fields ranked by total views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Unique viewers</TableHead>
                <TableHead className="text-right">Intents</TableHead>
                <TableHead className="text-right">Unique intenters</TableHead>
                <TableHead>Paths</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(engagement || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No radar engagement data yet.
                  </TableCell>
                </TableRow>
              ) : (
                (engagement as EngagementRow[]).map((row) => (
                  <TableRow key={row.field_slug}>
                    <TableCell>
                      <div className="font-medium">
                        {row.field_name_th || row.field_name_en || row.field_slug}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.field_slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.views}</TableCell>
                    <TableCell className="text-right">
                      {row.unique_viewers}
                    </TableCell>
                    <TableCell className="text-right">{row.intents}</TableCell>
                    <TableCell className="text-right">
                      {row.unique_intenters}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(row.intent_paths || []).map((path) => (
                          <Badge
                            key={path}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {path}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.last_at
                        ? new Date(row.last_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent intents: who wants to test what path */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Path Intents</CardTitle>
          <CardDescription>
            Latest people who clicked “Start AI Engineer Path” or any other
            path CTA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Button label</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentIntents || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No path intents yet.
                  </TableCell>
                </TableRow>
              ) : (
                (recentIntents as IntentRow[]).map((intent) => {
                  const profile = intent.user_id
                    ? profileById.get(intent.user_id)
                    : null;
                  return (
                    <TableRow key={intent.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {intent.created_at
                          ? new Date(intent.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>{intent.field_slug}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {intent.path_slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {intent.button_label || "—"}
                      </TableCell>
                      <TableCell>
                        {intent.user_id ? (
                          <div>
                            <div className="text-sm">
                              {profile?.full_name || profile?.username || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {profile?.email || intent.user_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Anonymous
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {intent.session_id.slice(0, 12)}…
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
