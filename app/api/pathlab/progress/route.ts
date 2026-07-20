import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  addPathActivityTime,
  startPathActivity,
  upsertPathActivityProgress,
} from "@/lib/supabase/pathlab-activities";
import {
  NotFoundError,
  UnauthorizedError,
  verifyEnrollmentActivity,
} from "@/lib/pathlab/authorization";

type ProgressAction = "start" | "heartbeat" | "complete";

const ACTIONS: ProgressAction[] = ["start", "heartbeat", "complete"];

/**
 * Student-side activity progress.
 *
 * - start:     open an activity, creating the progress row if absent
 * - heartbeat: accumulate elapsed seconds while the activity is open
 * - complete:  mark done, banking any final elapsed time
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
    const enrollmentId = body?.enrollmentId as string | undefined;
    const activityId = body?.activityId as string | undefined;
    const action = body?.action as ProgressAction | undefined;

    if (!enrollmentId || !activityId || !action) {
      return NextResponse.json(
        { error: "enrollmentId, activityId, and action are required" },
        { status: 400 }
      );
    }

    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    await verifyEnrollmentActivity(enrollmentId, activityId, user.id);

    const elapsedSeconds = Number(body?.elapsedSeconds);
    const hasElapsed = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0;

    if (action === "start") {
      const progress = await startPathActivity(enrollmentId, activityId);
      return NextResponse.json({ success: true, progress });
    }

    if (action === "heartbeat") {
      const progress = await addPathActivityTime(
        enrollmentId,
        activityId,
        elapsedSeconds
      );
      return NextResponse.json({ success: true, progress });
    }

    // complete
    if (hasElapsed) {
      await addPathActivityTime(enrollmentId, activityId, elapsedSeconds);
    }

    const progress = await upsertPathActivityProgress(enrollmentId, activityId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error?.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}

/**
 * Progress for every activity in an enrollment, keyed by activity id.
 * Replaces the map/node progress endpoint the student runtime used to call.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const enrollmentId = request.nextUrl.searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json({ error: "enrollmentId is required" }, { status: 400 });
    }

    const { data: enrollment } = await supabase
      .from("path_enrollments")
      .select("id, user_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (enrollment.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not own this enrollment" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("path_activity_progress")
      .select("*")
      .eq("enrollment_id", enrollmentId);

    if (error) throw error;

    const progressMap = (data || []).reduce<Record<string, unknown>>(
      (acc, row: any) => {
        acc[row.activity_id] = row;
        return acc;
      },
      {}
    );

    return NextResponse.json({ success: true, progressMap });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load progress" },
      { status: 500 }
    );
  }
}
