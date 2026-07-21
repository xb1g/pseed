import { NextRequest, NextResponse } from "next/server";
import { safeServerError } from "@/lib/security/route-guards";
import { buildParentUpdateEmail, configuredParentEmailTransport } from "@/lib/trials/parent-email";
import { configuredParentAppOrigin } from "@/lib/trials/app-origin";
import { processClaimedParentUpdates } from "@/lib/trials/parent-updates";
import {
  claimDueParentUpdates,
  createParentUpdateRepository,
  parentUpdateTokenSecret,
} from "@/lib/trials/parent-updates-server";
import { createServiceRoleClient } from "@/utils/supabase/server";

export const maxDuration = 60;

const PARENT_UPDATE_CLAIM_LIMIT = 5;
const PARENT_UPDATE_DELIVERY_BUDGET_MS = 45_000;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const deliveryDeadline = Date.now() + PARENT_UPDATE_DELIVERY_BUDGET_MS;
    const serviceClient = createServiceRoleClient();
    const repository = createParentUpdateRepository(serviceClient);
    const rows = await claimDueParentUpdates(
      serviceClient,
      now,
      PARENT_UPDATE_CLAIM_LIMIT
    );
    const transport = configuredParentEmailTransport();
    await processClaimedParentUpdates({
      rows,
      repository,
      send: async (email) => {
        const content = buildParentUpdateEmail(email);
        return transport.send({
          to: email.to,
          ...content,
          idempotencyKey: email.idempotencyKey,
        });
      },
      now,
      origin: configuredParentAppOrigin(),
      tokenSecret: parentUpdateTokenSecret(),
      shouldContinue: () => Date.now() < deliveryDeadline,
    });
    return NextResponse.json({ claimed: rows.length });
  } catch (error) {
    return safeServerError("Parent update delivery failed", error);
  }
}
