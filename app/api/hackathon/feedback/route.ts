import { NextRequest, NextResponse } from "next/server";
import { getSessionParticipant } from "@/lib/hackathon/db";
import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders, extractHackathonToken } from "@/lib/hackathon/auth";
import {
  buildFeedbackRecord,
  getFeedbackVersion,
  hackathonFeedbackSchema,
} from "@/lib/hackathon/feedback";

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

    const parsed = hackathonFeedbackSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "กรุณาตรวจสอบคำตอบที่ยังไม่ครบ",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const feedbackVersion = getFeedbackVersion(participant.grade_level);
    if (
      feedbackVersion === "future_path" &&
      parsed.data.future_path_uncertain === null
    ) {
      return NextResponse.json(
        {
          error: "กรุณาตอบคำถามเกี่ยวกับเส้นทางการเรียนหรืออาชีพ",
          fieldErrors: {
            future_path_uncertain: [
              "กรุณาตอบคำถามเกี่ยวกับเส้นทางการเรียนหรืออาชีพ",
            ],
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }
    if (
      feedbackVersion === "future_path" &&
      parsed.data.product_priority === null
    ) {
      return NextResponse.json(
        {
          error: "กรุณาเลือกสิ่งที่อยากลองก่อน",
          fieldErrors: {
            product_priority: ["กรุณาเลือกสิ่งที่อยากลองก่อน"],
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getAdminClient();
    const payload = buildFeedbackRecord(parsed.data, participant);

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
