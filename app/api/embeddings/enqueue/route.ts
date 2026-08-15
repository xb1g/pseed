import { NextResponse } from "next/server";
import { enqueueEmbedJob } from "@/lib/embeddings/jobs";
import { requireAdmin } from "@/lib/security/route-guards";

/**
 * Enqueues an embedding job for a team.
 *
 * Authenticated callers must be admins. Internal automation (cron / worker)
 * may authenticate with the shared CRON_SECRET bearer token instead.
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

export async function POST(request: Request) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, triggerSource = "manual" } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    const jobId = await enqueueEmbedJob(teamId, triggerSource as any);

    return NextResponse.json({
      jobId,
      status: "pending",
      message: "Job created. Poll /api/embeddings/status/{jobId} for results.",
    });
  } catch (error) {
    console.error("Error enqueueing embed job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
