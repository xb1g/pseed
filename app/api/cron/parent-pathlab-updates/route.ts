import { NextRequest, NextResponse } from "next/server";
import { safeServerError } from "@/lib/security/route-guards";
import { buildParentUpdateEmail, configuredParentEmailTransport } from "@/lib/trials/parent-email";
import { processClaimedParentUpdates } from "@/lib/trials/parent-updates";
import {
  claimDueParentUpdates,
  createParentUpdateRepository,
  parentUpdateTokenSecret,
} from "@/lib/trials/parent-updates-server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const serviceClient = createServiceRoleClient();
    const repository = createParentUpdateRepository(await createClient(), serviceClient);
    const rows = await claimDueParentUpdates(serviceClient, now);
    const transport = configuredParentEmailTransport();
    await processClaimedParentUpdates({
      rows,
      repository,
      send: async (email) => {
        const content = buildParentUpdateEmail(email);
        return transport.send({ to: email.to, ...content });
      },
      now,
      origin: request.nextUrl.origin,
      tokenSecret: parentUpdateTokenSecret(),
    });
    return NextResponse.json({ claimed: rows.length });
  } catch (error) {
    return safeServerError("Parent update delivery failed", error);
  }
}
