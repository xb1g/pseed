import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeServerError } from "@/lib/security/route-guards";
import { ParentUpdateError, unsubscribeParentUpdates } from "@/lib/trials/parent-updates";
import { createParentUpdateRepository } from "@/lib/trials/parent-updates-server";
import { configuredParentAppOrigin } from "@/lib/trials/app-origin";
import { createServiceRoleClient } from "@/utils/supabase/server";

const bearerSchema = z.string().regex(/^[0-9a-f]{64}$/);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ unsubscribeToken: string }> }
) {
  const parsed = bearerSchema.safeParse((await params).unsubscribeToken);
  if (!parsed.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.redirect(
    new URL(
      `/parent-updates/unsubscribe/${parsed.data}`,
      configuredParentAppOrigin()
    ),
    307
  );
}

function statusRedirect(token: string, status: string) {
  const target = new URL(
    `/parent-updates/unsubscribe/${token}`,
    configuredParentAppOrigin()
  );
  target.searchParams.set("status", status);
  return NextResponse.redirect(target, 303);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ unsubscribeToken: string }> }
) {
  const parsed = bearerSchema.safeParse((await params).unsubscribeToken);
  if (!parsed.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const repository = createParentUpdateRepository(createServiceRoleClient());
    await unsubscribeParentUpdates(repository, parsed.data, new Date());
    return statusRedirect(parsed.data, "unsubscribed");
  } catch (error) {
    if (error instanceof ParentUpdateError) {
      return statusRedirect(parsed.data, "not-found");
    }
    return safeServerError("Unsubscribe is temporarily unavailable", error);
  }
}
