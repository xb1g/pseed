import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Auth check — only admins
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Math.min(
    Number(req.nextUrl.searchParams.get("days") || 30),
    180
  );
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Use admin client to bypass RLS on my_path_events tables
  const admin = createAdminClient();

  const [
    { data: views },
    { data: intents },
    { data: planAuth },
    { data: planAnon },
  ] = await Promise.all([
    admin
      .from("radar_field_views")
      .select("created_at, field_slug, session_id")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    admin
      .from("radar_path_intents")
      .select("created_at, field_slug, path_slug, session_id")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    admin
      .from("my_path_events")
      .select("created_at, event_type")
      .in("event_type", ["entry_viewed"])
      .gte("created_at", sinceISO),
    admin
      .from("anonymous_my_path_events")
      .select("created_at, event_type")
      .in("event_type", ["reel_entry_viewed", "plan_page_viewed"])
      .gte("created_at", sinceISO),
  ]);

  // Build date range
  const dateMap = new Map<
    string,
    { planVisits: number; radarViews: number; interestClicks: number }
  >();

  // Fill all dates so chart has no gaps (always include today)
  const todayKey = new Date().toISOString().slice(0, 10);
  for (let d = new Date(since); ; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    dateMap.set(key, { planVisits: 0, radarViews: 0, interestClicks: 0 });
    if (key >= todayKey) break;
  }

  function toDateKey(ts: string) {
    return ts.slice(0, 10);
  }

  for (const row of views || []) {
    if (!row.created_at) continue;
    const key = toDateKey(row.created_at);
    const entry = dateMap.get(key);
    if (entry) entry.radarViews++;
  }

  for (const row of intents || []) {
    if (!row.created_at) continue;
    const key = toDateKey(row.created_at);
    const entry = dateMap.get(key);
    if (entry) entry.interestClicks++;
  }

  for (const row of [...(planAuth || []), ...(planAnon || [])]) {
    if (!row.created_at) continue;
    const key = toDateKey(row.created_at);
    const entry = dateMap.get(key);
    if (entry) entry.planVisits++;
  }

  // Daily stats sorted by date
  const dailyStats = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // Interest clicks breakdown by career path
  const pathCounts = new Map<string, number>();
  for (const row of intents || []) {
    const key = `${row.field_slug}/${row.path_slug}`;
    pathCounts.set(key, (pathCounts.get(key) || 0) + 1);
  }
  const pathBreakdown = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([path, count]) => ({ path, count }));

  // Totals
  const totalPlanVisits = dailyStats.reduce((s, d) => s + d.planVisits, 0);
  const totalRadarViews = dailyStats.reduce((s, d) => s + d.radarViews, 0);
  const totalInterestClicks = dailyStats.reduce(
    (s, d) => s + d.interestClicks,
    0
  );

  return NextResponse.json({
    dailyStats,
    pathBreakdown,
    summary: {
      totalPlanVisits,
      totalRadarViews,
      totalInterestClicks,
    },
  });
}
