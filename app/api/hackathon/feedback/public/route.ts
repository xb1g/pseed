import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildFeedbackRecord,
  hackathonFeedbackSchema,
} from "@/lib/hackathon/feedback";
import { z } from "zod";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const publicFeedbackSchema = z.object({
  nickname: z.string().trim().min(1, "Please enter your nickname").max(120),
  team_name: z.string().trim().max(120).default(""),
  feedback: hackathonFeedbackSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = publicFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check your answers",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nickname, team_name, feedback } = parsed.data;

    // Build the feedback record with a dummy participant (no participant_id)
    const record = buildFeedbackRecord(feedback, {
      id: "00000000-0000-0000-0000-000000000000", // placeholder, won't be used
      grade_level: "",
    });

    // Remove participant_id and set nickname/team_name instead
    const { participant_id: _, ...recordWithoutParticipant } = record as any;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("hackathon_feedback")
      .insert({
        ...recordWithoutParticipant,
        participant_id: null,
        nickname,
        team_name: team_name || null,
        feedback_version: "project_growth",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting public feedback:", error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in POST public feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
