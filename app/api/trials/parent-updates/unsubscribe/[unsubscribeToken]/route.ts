import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeServerError } from "@/lib/security/route-guards";
import { ParentUpdateError, unsubscribeParentUpdates } from "@/lib/trials/parent-updates";
import { createParentUpdateRepository } from "@/lib/trials/parent-updates-server";
import { createServiceRoleClient } from "@/utils/supabase/server";

const bearerSchema = z.string().regex(/^[0-9a-f]{64}$/);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ unsubscribeToken: string }> }
) {
  try {
    const parsed = bearerSchema.safeParse((await params).unsubscribeToken);
    if (!parsed.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const repository = createParentUpdateRepository(createServiceRoleClient());
    return NextResponse.json(await unsubscribeParentUpdates(repository, parsed.data, new Date()));
  } catch (error) {
    if (error instanceof ParentUpdateError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return safeServerError("Unsubscribe is temporarily unavailable", error);
  }
}
