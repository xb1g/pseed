import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/hackathon/db";
import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders, extractHackathonToken } from "@/lib/hackathon/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FINISH_THRESHOLD = 0.85; // P1 + P2 + P3 (0.25 + 0.35 + 0.25)

/** Team learning stats for the currently logged-in hackathon participant. */
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const token = extractHackathonToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const participant = await getSessionParticipant(token);
    if (!participant) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = getAdminClient();

    // Find the participant's team membership.
    const { data: membership, error: membershipError } = await supabase
      .from("hackathon_team_members")
      .select("team_id")
      .eq("participant_id", participant.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { data: null },
        { headers: corsHeaders }
      );
    }

    const teamId = membership.team_id as string;

    const [metricsRes, round1Res] = await Promise.all([
      supabase
        .from("hackathon_learning_metrics")
        .select(
          "team_id, learning_index, grappling_score, ai_likelihood, engagement_score, iteration_score, semifinal_total, quadrant, evidence"
        )
        .eq("subject_type", "team")
        .eq("team_id", teamId)
        .single(),
      supabase
        .from("hackathon_round1_scores")
        .select("team_id, total")
        .eq("team_id", teamId)
        .single(),
    ]);

    if (metricsRes.error) {
      if (metricsRes.error.code === "PGRST116") {
        return NextResponse.json({ data: null }, { headers: corsHeaders });
      }
      console.error("Error fetching team learning metrics:", metricsRes.error);
      return NextResponse.json(
        { error: "Failed to fetch team stats" },
        { status: 500, headers: corsHeaders }
      );
    }

    const r = metricsRes.data;
    const ev = (r.evidence ?? {}) as Record<string, unknown>;
    const completion = (ev.completion as number | null) ?? null;

    const stats = {
      teamId,
      label: (ev.label as string) ?? participant.team_name ?? "ทีมของคุณ",
      members: (ev.members as number) ?? 0,
      cycles: (ev.phase3_cycles as number) ?? 0,
      completion,
      scoredSubs: (ev.scored_subs as number) ?? 0,
      honestWrongness: Boolean(ev.honest_wrongness),
      learningIndex:
        r.learning_index === null ? null : Number(r.learning_index),
      fidelity: r.grappling_score === null ? null : Number(r.grappling_score),
      aiLikelihood:
        r.ai_likelihood === null ? null : Number(r.ai_likelihood),
      engagement: Number(r.engagement_score ?? 0),
      iteration: Number(r.iteration_score ?? 0),
      semifinal:
        r.semifinal_total === null ? null : Number(r.semifinal_total),
      round1:
        round1Res.error || !round1Res.data
          ? null
          : Number(round1Res.data.total),
      quadrant: (r.quadrant as string) ?? null,
      finished: completion !== null && completion >= FINISH_THRESHOLD,
    };

    return NextResponse.json({ data: stats }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in GET hackathon/learning/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
