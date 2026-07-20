import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitPathAssessment } from "@/lib/supabase/pathlab-activities";

/**
 * Student assessment submission.
 *
 * Scoring happens server-side in submitPathAssessment — the client never sends
 * a score, and correct options are never exposed to it.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const progressId = body?.progress_id as string | undefined;
    const assessmentId = body?.assessment_id as string | undefined;

    if (!progressId || !assessmentId) {
      return NextResponse.json(
        { error: "progress_id and assessment_id are required" },
        { status: 400 }
      );
    }

    // The progress row is the authorization anchor: it carries the enrollment,
    // and the enrollment carries the owning user.
    const { data: progress } = await supabase
      .from("path_activity_progress")
      .select("id, enrollment:path_enrollments!inner(user_id)")
      .eq("id", progressId)
      .maybeSingle();

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    const ownerId = (progress as { enrollment?: { user_id?: string } }).enrollment
      ?.user_id;

    if (ownerId !== user.id) {
      return NextResponse.json(
        { error: "You do not own this submission" },
        { status: 403 }
      );
    }

    const submission = await submitPathAssessment({
      progress_id: progressId,
      assessment_id: assessmentId,
      text_answer: body?.text_answer,
      file_urls: body?.file_urls,
      image_url: body?.image_url,
      quiz_answers: body?.quiz_answers,
      metadata: body?.metadata,
    });

    // Never return correct answers to the student client
    const { rubric_scores, ...safe } = submission as unknown as Record<
      string,
      unknown
    >;

    return NextResponse.json({ success: true, submission: safe });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
