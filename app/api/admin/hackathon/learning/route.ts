import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";

export const dynamic = "force-dynamic";

/** Learning-analytics overview: per-team Learning Index vs semifinal + quadrants. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const client = createAdminClient();
    const [metricsRes, round1Res] = await Promise.all([
      client
        .from("hackathon_learning_metrics")
        .select(
          "team_id, learning_index, grappling_score, ai_likelihood, engagement_score, iteration_score, semifinal_total, quadrant, evidence",
        )
        .eq("subject_type", "team"),
      client
        .from("hackathon_round1_scores")
        .select("team_id, total"),
    ]);
    if (metricsRes.error) throw metricsRes.error;
    if (round1Res.error) throw round1Res.error;

    const round1Map = new Map<string, number>(
      (round1Res.data ?? [])
        .filter((r) => r.team_id != null)
        .map((r) => [r.team_id as string, Number(r.total)]),
    );

    const teams = (metricsRes.data ?? []).map((r) => {
      const ev = (r.evidence ?? {}) as Record<string, unknown>;
      const teamId = r.team_id as string;
      return {
        teamId,
        label: (ev.label as string) ?? "(unnamed)",
        members: (ev.members as number) ?? 0,
        cycles: (ev.phase3_cycles as number) ?? 0,
        completion: (ev.completion as number) ?? null,
        scoredSubs: (ev.scored_subs as number) ?? 0,
        honestWrongness: Boolean(ev.honest_wrongness),
        learningIndex: r.learning_index === null ? null : Number(r.learning_index),
        fidelity: r.grappling_score === null ? null : Number(r.grappling_score),
        aiLikelihood: r.ai_likelihood === null ? null : Number(r.ai_likelihood),
        engagement: Number(r.engagement_score ?? 0),
        iteration: Number(r.iteration_score ?? 0),
        semifinal: r.semifinal_total === null ? null : Number(r.semifinal_total),
        round1: round1Map.get(teamId) ?? null,
        quadrant: (r.quadrant as string) ?? null,
      };
    });

    const finalists = teams.filter((t) => t.semifinal !== null);
    const round1Teams = teams.filter((t) => t.round1 !== null);
    const med = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s.length ? s[Math.floor(s.length / 2)] : 0;
    };
    return NextResponse.json({
      teams,
      medians: {
        learning: med(finalists.map((t) => t.learningIndex ?? 0)),
        semifinal: med(finalists.map((t) => t.semifinal as number)),
        round1: med(round1Teams.map((t) => t.round1 as number)),
      },
      counts: { total: teams.length, finalists: finalists.length, round1: round1Teams.length },
    });
  } catch (e) {
    return safeServerError("Failed to load learning analytics", e);
  }
}
