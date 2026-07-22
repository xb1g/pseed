import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeServerError } from "@/lib/security/route-guards";
import { ParentUpdateError, verifyParentUpdates } from "@/lib/trials/parent-updates";
import { createParentUpdateRepository } from "@/lib/trials/parent-updates-server";
import { configuredParentAppOrigin } from "@/lib/trials/app-origin";
import { createServiceRoleClient } from "@/utils/supabase/server";

const bearerSchema = z.string().regex(/^[0-9a-f]{64}$/);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ verificationToken: string }> }
) {
  const parsed = bearerSchema.safeParse((await params).verificationToken);
  if (!parsed.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.redirect(
    new URL(
      `/parent-updates/verify/${parsed.data}`,
      configuredParentAppOrigin()
    ),
    307
  );
}

function statusRedirect(token: string, status: string) {
  const target = new URL(
    `/parent-updates/verify/${token}`,
    configuredParentAppOrigin()
  );
  target.searchParams.set("status", status);
  return NextResponse.redirect(target, 303);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ verificationToken: string }> }
) {
  const parsed = bearerSchema.safeParse((await params).verificationToken);
  if (!parsed.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const repository = createParentUpdateRepository(createServiceRoleClient());
    await verifyParentUpdates(repository, parsed.data, new Date());
    return statusRedirect(parsed.data, "verified");
  } catch (error) {
    if (error instanceof ParentUpdateError) {
      return statusRedirect(
        parsed.data,
        error.code === "verification_expired" ? "expired" : "not-found"
      );
    }
    return safeServerError("Verification is temporarily unavailable", error);
  }
}
