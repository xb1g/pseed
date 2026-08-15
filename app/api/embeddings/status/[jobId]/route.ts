import { NextResponse } from "next/server";
import { getJob } from "@/lib/embeddings/jobs";
import { requireUser } from "@/lib/security/route-guards";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user.ok) return user.response;

    const { jobId } = await params;
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      attempts: job.attempts,
      error: job.error,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error("Error fetching embed job status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
