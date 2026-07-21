import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, safeServerError } from "@/lib/security/route-guards";
import {
  ParentUpdateError,
  maskEmail,
  parentUpdateSubscribeSchema,
  subscribeParentUpdates,
} from "@/lib/trials/parent-updates";
import { configuredParentEmailTransport, buildVerificationEmail } from "@/lib/trials/parent-email";
import {
  createParentUpdateRepository,
  parentUpdateTokenSecret,
  revokeParentUpdatesForTrial,
} from "@/lib/trials/parent-updates-server";
import { createServiceRoleClient } from "@/utils/supabase/server";

const tokenSchema = z.string().regex(/^[0-9a-f]{32}$/);

function parentError(error: unknown) {
  if (error instanceof ParentUpdateError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  return safeServerError("Parent updates are temporarily unavailable", error);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    const body = await request.json().catch(() => null);
    const parsedBody = parentUpdateSubscribeSchema.safeParse(body);
    if (!parsedToken.success || !parsedBody.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();
    const repository = createParentUpdateRepository(serviceClient);
    const transport = configuredParentEmailTransport();
    const result = await subscribeParentUpdates({
      payToken: parsedToken.data,
      input: parsedBody.data,
      repository,
      sendVerification: async (email) => {
        const content = buildVerificationEmail(email);
        return transport.send({ to: email.to, ...content });
      },
      now: new Date(),
      tokenSecret: parentUpdateTokenSecret(),
      origin: request.nextUrl.origin,
    });
    return NextResponse.json(result, { status: result.status === "verification_sent" ? 202 : 200 });
  } catch (error) {
    return parentError(error);
  }
}

async function ownedTrial(token: string) {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const serviceClient = createServiceRoleClient();
  const { data: trial, error } = await serviceClient
    .from("trial_accesses")
    .select("id")
    .eq("pay_token", token)
    .eq("user_id", auth.value.userId)
    .maybeSingle();
  if (error) throw error;
  return { ok: true as const, trial, serviceClient };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const parsed = tokenSchema.safeParse((await params).token);
    if (!parsed.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const owner = await ownedTrial(parsed.data);
    if (!owner.ok) return owner.response;
    if (!owner.trial) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { data, error } = await owner.serviceClient
      .from("parent_pathlab_subscriptions")
      .select("normalized_email, verified_at, unsubscribed_at, revoked_at")
      .eq("trial_access_id", owner.trial.id)
      .maybeSingle();
    if (error) throw error;
    const active = data?.verified_at && !data.unsubscribed_at && !data.revoked_at;
    return NextResponse.json({
      verified: Boolean(active),
      maskedEmail: active ? maskEmail(data.normalized_email) : null,
    });
  } catch (error) {
    return parentError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const parsed = tokenSchema.safeParse((await params).token);
    if (!parsed.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const owner = await ownedTrial(parsed.data);
    if (!owner.ok) return owner.response;
    if (!owner.trial) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const revokedAt = new Date().toISOString();
    await revokeParentUpdatesForTrial(
      owner.serviceClient,
      owner.trial.id,
      revokedAt
    );
    return NextResponse.json({ status: "revoked" });
  } catch (error) {
    return parentError(error);
  }
}
