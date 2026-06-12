import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";

export const dynamic = "force-dynamic";

/**
 * Judge score vs prior hackathon experience per team.
 * Returns teams that have a semifinal score, with avg member experience_level (1–10).
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const client = createAdminClient();

    // Get semifinal scores
    const { data: scores, error: scoresErr } = await client
      .from("hackathon_semifinal_scores")
      .select("team_id, raw_team_name, division, total")
      .not("team_id", "is", null);
    if (scoresErr) throw scoresErr;

    const teamIds = (scores ?? []).map((s) => s.team_id as string);
    if (!teamIds.length) return NextResponse.json({ teams: [] });

    // Get team members with their experience_level
    const { data: members, error: membersErr } = await client
      .from("hackathon_team_members")
      .select("team_id, participant_id")
      .in("team_id", teamIds);
    if (membersErr) throw membersErr;

    const participantIds = [...new Set((members ?? []).map((m) => m.participant_id as string))];

    const { data: participants, error: partErr } = await client
      .from("hackathon_participants")
      .select("id, experience_level")
      .in("id", participantIds);
    if (partErr) throw partErr;

    const expByParticipant = new Map<string, number>(
      (participants ?? []).map((p) => [p.id as string, p.experience_level as number]),
    );

    // Avg experience per team
    const teamMembers = new Map<string, number[]>();
    for (const m of members ?? []) {
      const tid = m.team_id as string;
      const exp = expByParticipant.get(m.participant_id as string);
      if (exp != null) {
        const arr = teamMembers.get(tid) ?? [];
        arr.push(exp);
        teamMembers.set(tid, arr);
      }
    }

    // Get round1 scores for cross-referencing
    const { data: round1Data, error: round1Err } = await client
      .from("hackathon_round1_scores")
      .select("team_id, total, raw_team_name, division")
      .not("team_id", "is", null);
    if (round1Err) throw round1Err;

    // Build round1 map by team_id
    const round1Map = new Map<string, number>(
      (round1Data ?? []).map((r) => [r.team_id as string, Number(r.total)]),
    );

    // Also build a map from raw_team_name to round1 total for teams without matched team_id
    const round1ByName = new Map<string, number>(
      (round1Data ?? []).map((r) => [r.raw_team_name as string, Number(r.total)]),
    );

    // Get all semifinal team_ids for lookup in round1
    const teams = (scores ?? []).map((s) => {
      const tid = s.team_id as string;
      const exps = teamMembers.get(tid) ?? [];
      const avgExp = exps.length
        ? Math.round((exps.reduce((a, b) => a + b, 0) / exps.length) * 10) / 10
        : null;
      const round1 = round1Map.get(tid) ?? round1ByName.get(s.raw_team_name as string) ?? null;
      return {
        teamId: tid,
        label: s.raw_team_name as string,
        division: (s.division as string) ?? null,
        semifinal: s.total === null ? null : Number(s.total),
        round1,
        avgExperience: avgExp,
        memberExperiences: exps,
        members: exps.length,
      };
    }).filter((t) => t.semifinal !== null && t.avgExperience !== null);

    return NextResponse.json({ teams });
  } catch (e) {
    return safeServerError("Failed to load experience vs score data", e);
  }
}
