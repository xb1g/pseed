import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { formatCycleForPrompt } from "@/lib/hackathon/phase3-grading";

export const dynamic = "force-dynamic";

/** Per-team drill-down: every scored submission + cycle with its rationale (the proof). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ teamId: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { teamId } = await ctx.params;

  try {
    const client = createAdminClient();

    // all signals for this team (team_id backfilled across scopes)
    const { data: signals, error } = await client
      .from("hackathon_submission_signals")
      .select("submission_id, submission_scope, grappling, ai_likelihood, signals")
      .eq("team_id", teamId);
    if (error) throw error;

    // cross-phase journey (synthesized across ALL phases), distinct from the video-pitch journey
    const { data: metric } = await client
      .from("hackathon_learning_metrics")
      .select("journey_summary")
      .eq("team_id", teamId)
      .eq("subject_type", "team")
      .maybeSingle();
    const journey = (metric?.journey_summary as string | null) ?? null;

    const indivIds = (signals ?? []).filter((s) => s.submission_scope === "individual").map((s) => s.submission_id);
    const teamIds = (signals ?? []).filter((s) => s.submission_scope === "team").map((s) => s.submission_id);

    // resolve activity title + the student's actual submission text (the proof)
    const subMap = new Map<string, { title: string; text: string | null; image: string | null }>();
    if (indivIds.length) {
      const { data } = await client
        .from("hackathon_phase_activity_submissions")
        .select("id, text_answer, image_url, hackathon_phase_activities(title)")
        .in("id", indivIds);
      for (const r of data ?? []) subMap.set(r.id, {
        title: (r as any).hackathon_phase_activities?.title ?? "?",
        text: (r as any).text_answer ?? null, image: (r as any).image_url ?? null,
      });
    }
    if (teamIds.length) {
      const { data } = await client
        .from("hackathon_phase_activity_team_submissions")
        .select("id, text_answer, image_url, hackathon_phase_activities(title)")
        .in("id", teamIds);
      for (const r of data ?? []) subMap.set(r.id, {
        title: (r as any).hackathon_phase_activities?.title ?? "?",
        text: (r as any).text_answer ?? null, image: (r as any).image_url ?? null,
      });
    }

    // Phase-4 / Round-1 video pitch: dedicated block (the one-line journey + pitch scores).
    const vsig = (signals ?? []).find((s) => s.submission_scope === "phase4_video");
    const vj = (vsig?.signals ?? {}) as Record<string, unknown>;
    const video = vsig
      ? {
          total: (vj.total as number) ?? Math.round(Number(vsig.grappling) * 100),
          aiLikelihood: (vj.ai_likelihood as number) ?? null,
          journey: (vj.journey_summary as string) ?? null,
          summary: (vj.summary as string) ?? null,
          storyClarity: (vj.story_clarity as number) ?? null,
          evidenceIntegration: (vj.evidence_integration as number) ?? null,
          delivery: (vj.delivery as number) ?? null,
          problemShown: Boolean(vj.problem_shown),
          solutionShown: Boolean(vj.solution_shown),
          demoShown: Boolean(vj.demo_shown),
          videoUrl: (vj.video_url as string) ?? null,
          rationale: (vj.rationale as string) ?? "",
        }
      : null;

    const submissions = (signals ?? [])
      .filter((s) => s.submission_scope !== "phase3_cycle" && s.submission_scope !== "phase4_video")
      .map((s) => {
        const sj = (s.signals ?? {}) as Record<string, unknown>;
        const sub = subMap.get(s.submission_id);
        return {
          scope: s.submission_scope,
          activity: sub?.title ?? "?",
          text: sub?.text ?? null,
          image: sub?.image ?? null,
          fidelity: s.grappling === null ? null : Math.round(Number(s.grappling) * 100),
          ai: s.ai_likelihood === null ? null : Math.round(Number(s.ai_likelihood) * 100),
          exemplar: (sj.exemplar_proximity as string) ?? null,
          criteriaMet: (sj.criteria_met as string[]) ?? [],
          redFlags: (sj.red_flags_hit as string[]) ?? [],
          rationale: (sj.rationale as string) ?? "",
        };
      })
      .sort((a, b) => (b.fidelity ?? 0) - (a.fidelity ?? 0));

    // fetch the actual cycle content (the team's work) for the proof
    const cycleIds = (signals ?? []).filter((s) => s.submission_scope === "phase3_cycle").map((s) => s.submission_id);
    const cycleWork = new Map<string, { work: string; n: number }>();
    if (cycleIds.length) {
      const { data } = await client
        .from("hackathon_phase3_cycles")
        .select("id, cycle_number, hypothesis_who, hypothesis_will_do, hypothesis_because, hypothesis_measured_by, variable_changed, prior_variable, pretotype_method, pretotype_description, synthesis_result, synthesis_what_changed, synthesis_honest_wrongness")
        .in("id", cycleIds);
      for (const c of data ?? []) cycleWork.set(c.id, { work: formatCycleForPrompt(c as any), n: (c as any).cycle_number });
    }

    const cycles = (signals ?? [])
      .filter((s) => s.submission_scope === "phase3_cycle")
      .map((s) => {
        const sj = (s.signals ?? {}) as Record<string, unknown>;
        const cw = cycleWork.get(s.submission_id);
        return {
          cycleNumber: cw?.n ?? null,
          work: cw?.work ?? null,
          total: (sj.total as number) ?? Math.round(Number(s.grappling) * 100),
          honestWrongness: Boolean(sj.honest_wrongness),
          rationale: (sj.rationale as string) ?? "",
        };
      })
      .sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0));

    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    return NextResponse.json({
      journey,
      submissions,
      cycles,
      video,
      summary: {
        avgFidelity: avg(submissions.map((s) => s.fidelity ?? 0)),
        avgCycleRigor: avg(cycles.map((c) => c.total)),
        scoredSubmissions: submissions.length,
        scoredCycles: cycles.length,
      },
    });
  } catch (e) {
    return safeServerError("Failed to load team breakdown", e);
  }
}
