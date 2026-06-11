import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";

export const dynamic = "force-dynamic";

/** Flat CSV export — one row per team, every learning-analytics field + journey + video grade. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const client = createAdminClient();

    const { data: metrics, error } = await client
      .from("hackathon_learning_metrics")
      .select("team_id, learning_index, grappling_score, ai_likelihood, engagement_score, iteration_score, semifinal_total, quadrant, journey_summary, evidence")
      .eq("subject_type", "team");
    if (error) throw error;

    const { data: vids } = await client
      .from("hackathon_submission_signals")
      .select("team_id, signals")
      .eq("submission_scope", "phase4_video");
    const vById = new Map<string, Record<string, unknown>>();
    for (const v of vids ?? []) vById.set(v.team_id as string, (v.signals ?? {}) as Record<string, unknown>);

    const num = (x: unknown) => (x === null || x === undefined ? "" : Number(x));
    const rows = (metrics ?? []).map((r) => {
      const ev = (r.evidence ?? {}) as Record<string, unknown>;
      const v = vById.get(r.team_id as string) ?? {};
      return {
        team: (ev.label as string) ?? "",
        learning_index: num(r.learning_index),
        semifinal_total: num(r.semifinal_total),
        quadrant: (r.quadrant as string) ?? "",
        plan_fidelity: num(r.grappling_score),
        ai_likelihood: num(r.ai_likelihood),
        engagement: num(r.engagement_score),
        iteration: num(r.iteration_score),
        completion: num(ev.completion),
        members: num(ev.members),
        phase3_cycles: num(ev.phase3_cycles),
        scored_subs: num(ev.scored_subs),
        honest_wrongness: ev.honest_wrongness ? "yes" : "no",
        video_total: num(v.total),
        video_ai_likelihood: num(v.ai_likelihood),
        video_story: num(v.story_clarity),
        video_evidence: num(v.evidence_integration),
        video_delivery: num(v.delivery),
        video_demo_shown: v.demo_shown ? "yes" : "no",
        journey_all_phases: (r.journey_summary as string) ?? "",
        journey_in_video: (v.journey_summary as string) ?? "",
        video_url: (v.video_url as string) ?? "",
      };
    });
    rows.sort((a, b) => (Number(b.learning_index) || 0) - (Number(a.learning_index) || 0));

    const headers = Object.keys(rows[0] ?? { team: "" });
    const esc = (x: unknown) => {
      const s = String(x ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hackathon-learning-${date}.csv"`,
      },
    });
  } catch (e) {
    return safeServerError("Failed to export learning analytics", e);
  }
}
