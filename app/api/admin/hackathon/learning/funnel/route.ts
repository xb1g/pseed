import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";

export const dynamic = "force-dynamic";

type Stage = { label: string; phase: number; teams: number };
type Div = "all" | "high_school" | "university";

/** Drop-off funnel, split by division. Returns stages for all / high_school / university. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const client = createAdminClient();
    const [funnel, teamDiv, cycles, semifinal] = await Promise.all([
      client.from("hackathon_learning_funnel").select("phase_number, display_order, title, division, teams"),
      client.from("hackathon_team_division").select("team_id, division"),
      client.from("hackathon_phase3_cycles").select("team_id"),
      client.from("hackathon_semifinal_scores").select("division"),
    ]);
    if (funnel.error) throw funnel.error;

    const divOf = new Map<string, string>((teamDiv.data ?? []).map((r) => [r.team_id as string, r.division as string]));

    // registered teams (with a known division) per division
    const registered: Record<string, number> = { high_school: 0, university: 0 };
    for (const r of teamDiv.data ?? []) registered[r.division as string] = (registered[r.division as string] ?? 0) + 1;

    // cycle teams per division
    const cycleTeams: Record<string, Set<string>> = { high_school: new Set(), university: new Set() };
    for (const c of cycles.data ?? []) {
      const d = divOf.get(c.team_id as string) ?? "high_school";
      cycleTeams[d]?.add(c.team_id as string);
    }
    // semifinal per division
    const semi: Record<string, number> = { high_school: 0, university: 0 };
    for (const s of semifinal.data ?? []) semi[s.division as string] = (semi[s.division as string] ?? 0) + 1;

    // build ordered activity stages for a division (or summed for "all")
    const activityStages = (div: Div): Stage[] => {
      const rows = (funnel.data ?? []).filter((r) => div === "all" || r.division === div);
      const byActivity = new Map<string, Stage>();
      for (const r of rows) {
        const key = `${r.phase_number}.${r.display_order}.${r.title}`;
        const cur = byActivity.get(key);
        if (cur) cur.teams += r.teams as number;
        else byActivity.set(key, { label: `P${r.phase_number}: ${r.title}`, phase: r.phase_number as number, teams: r.teams as number });
      }
      return [...byActivity.values()];
    };

    const build = (div: Div) => {
      const reg = div === "all" ? registered.high_school + registered.university
        : registered[div] ?? 0;
      const cyc = div === "all" ? cycleTeams.high_school.size + cycleTeams.university.size
        : cycleTeams[div]?.size ?? 0;
      const sem = div === "all" ? semi.high_school + semi.university : semi[div] ?? 0;
      const stages: Stage[] = [
        { label: "Registered teams", phase: 0, teams: reg },
        ...activityStages(div),
        { label: "P3: ran test cycles", phase: 3, teams: cyc },
        { label: "Semifinal (judged)", phase: 4, teams: sem },
      ];
      return stages.map((s, i) => ({
        ...s,
        drop: i > 0 ? stages[i - 1].teams - s.teams : 0,
        pctOfStart: stages[0].teams ? Math.round((s.teams / stages[0].teams) * 100) : 0,
      }));
    };

    return NextResponse.json({
      divisions: { all: build("all"), high_school: build("high_school"), university: build("university") },
    });
  } catch (e) {
    return safeServerError("Failed to load funnel", e);
  }
}
