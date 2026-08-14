import { NextRequest, NextResponse } from "next/server";
import { runDmConversationBackfillBatch, runIgCommentsBackfillBatch } from "@/lib/meta/backfill-runner";

export const maxDuration = 60;

const TIME_BUDGET_MS = 50_000;

function failedBatch(errorCode: string) {
  return {
    processed: 0,
    remaining: -1,
    stoppedReason: "error" as const,
    errorCode,
  };
}

/**
 * Stateless catch-up: derives "already done" straight from the DB each tick,
 * so this can just run every N minutes indefinitely. If Meta's rate limit is
 * blocking us it stops immediately and the next tick tries again for free —
 * no manual retry/cooldown babysitting needed.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + TIME_BUDGET_MS;

  const dmResult = await runDmConversationBackfillBatch(deadline).catch(() => {
    console.error("Meta DM backfill batch failed", { errorCode: "dm_backfill_failed" });
    return failedBatch("dm_backfill_failed");
  });

  const remainingBudget = deadline - Date.now();
  const commentsResult =
    remainingBudget > 5_000
      ? await runIgCommentsBackfillBatch(deadline).catch(() => {
          console.error("Meta comments backfill batch failed", {
            errorCode: "comments_backfill_failed",
          });
          return failedBatch("comments_backfill_failed");
        })
      : { processed: 0, remaining: -1, stoppedReason: "deadline" as const };

  return NextResponse.json({ dm: dmResult, comments: commentsResult });
}
