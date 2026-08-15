import { NextResponse } from "next/server";
import { getJob, claimJob, completeJob, failJob } from "@/lib/embeddings/jobs";
import { createTeamDirectionSnapshot } from "@/lib/embeddings/team-direction";
import { requireAdmin } from "@/lib/security/route-guards";

/**
 * Executes a queued embedding job (runs paid LLM/embedding calls).
 *
 * Authenticated callers must be admins. The internal worker authenticates
 * with the shared CRON_SECRET bearer token.
 */
async function authorize(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (cronSecret && authorization === `Bearer ${cronSecret}`) {
    return true;
  }
  const admin = await requireAdmin();
  return admin.ok;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "completed" || job.status === "failed") {
      return NextResponse.json({ jobId, status: job.status, message: "Job already finalized" });
    }

    const claimed = await claimJob(jobId);
    if (!claimed) {
      return NextResponse.json(
        { jobId, status: "processing", message: "Job already being processed" },
        { status: 202 }
      );
    }

    try {
      await createTeamDirectionSnapshot(job.team_id);
      await completeJob(jobId);

      return NextResponse.json({
        jobId,
        status: "completed",
        message: "Snapshot created successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failJob(jobId, message);
      return NextResponse.json(
        { jobId, status: "failed", error: message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing embed job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
