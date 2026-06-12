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

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const token = extractHackathonToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    const participant = await getSessionParticipant(token);
    if (!participant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("hackathon_feedback")
      .select("*")
      .eq("participant_id", participant.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null }, { headers: corsHeaders });
      }
      console.error("Error fetching feedback:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ data }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in GET feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const token = extractHackathonToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    const participant = await getSessionParticipant(token);
    if (!participant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      event_takeaways,
      mentorship_rating,
      can_make_social_change,
      would_do_again,
      improvement_suggestions,
      wants_call,
      wants_product_beta,
      wants_continue_mentorship,
    } = body;

    // Validate required fields
    if (
      typeof mentorship_rating !== "number" ||
      mentorship_rating < 1 ||
      mentorship_rating > 5
    ) {
      return NextResponse.json(
        { error: "Mentorship rating must be between 1 and 5" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof can_make_social_change !== "boolean") {
      return NextResponse.json(
        { error: "can_make_social_change must be a boolean" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof would_do_again !== "boolean") {
      return NextResponse.json(
        { error: "would_do_again must be a boolean" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getAdminClient();
    const payload = {
      participant_id: participant.id,
      event_takeaways: event_takeaways?.trim() || null,
      mentorship_rating,
      can_make_social_change,
      would_do_again,
      improvement_suggestions: improvement_suggestions?.trim() || null,
      wants_call: wants_call === true,
      wants_product_beta: wants_product_beta === true,
      wants_continue_mentorship: wants_continue_mentorship === true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("hackathon_feedback")
      .upsert(payload, { onConflict: "participant_id" })
      .select()
      .single();

    if (error) {
      console.error("Error upserting feedback:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, data }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in POST feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
