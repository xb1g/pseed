import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, safeServerError } from "@/lib/security/route-guards";
import { resolveTrialStatus } from "@/lib/trials/status";

const seedIdSchema = z.object({
  seedId: z.string().uuid(),
});

function payUrlFor(payToken: string): string {
  return `/pay/${payToken}`;
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, userId } = auth.value;

    const body = await request.json().catch(() => ({}));
    const parsed = seedIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { seedId } = parsed.data;

    // Verify the seed exists before starting a trial for it
    const { data: seed, error: seedError } = await supabase
      .from("seeds")
      .select("id")
      .eq("id", seedId)
      .single();

    if (seedError || !seed) {
      return NextResponse.json({ error: "Seed not found" }, { status: 404 });
    }

    // Insert a fresh trial. On unique (user_id, seed_id) conflict, fall back
    // to the existing row so the endpoint is idempotent for the student.
    const { data: inserted, error: insertError } = await supabase
      .from("trial_accesses")
      .insert({
        user_id: userId,
        seed_id: seedId,
        pay_token: randomBytes(16).toString("hex"),
      })
      .select("id, pay_token, status, payment_deadline, paid_at")
      .single();

    let trial = inserted;
    if (insertError) {
      if (insertError.code !== "23505") {
        return safeServerError("Failed to start trial", insertError);
      }
      const { data: existing, error: existingError } = await supabase
        .from("trial_accesses")
        .select("id, pay_token, status, payment_deadline, paid_at")
        .eq("user_id", userId)
        .eq("seed_id", seedId)
        .single();

      if (existingError || !existing) {
        return safeServerError("Failed to load existing trial", existingError);
      }
      trial = existing;
    }

    if (!trial) {
      return safeServerError("Failed to start trial");
    }

    return NextResponse.json({
      trialId: trial.id,
      payToken: trial.pay_token,
      payUrl: payUrlFor(trial.pay_token),
      status: resolveTrialStatus(trial),
      paymentDeadline: trial.payment_deadline,
    });
  } catch (error) {
    return safeServerError("Failed to start trial", error);
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, userId } = auth.value;
    const { searchParams } = new URL(request.url);
    const parsed = seedIdSchema.safeParse({
      seedId: searchParams.get("seedId"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: trial, error } = await supabase
      .from("trial_accesses")
      .select("status, payment_deadline, paid_at, pay_token, slip_path")
      .eq("user_id", userId)
      .eq("seed_id", parsed.data.seedId)
      .maybeSingle();

    if (error) {
      return safeServerError("Failed to fetch trial", error);
    }
    if (!trial) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({
      status: resolveTrialStatus(trial),
      paymentDeadline: trial.payment_deadline,
      payUrl: payUrlFor(trial.pay_token),
      slipUploaded: Boolean(trial.slip_path),
    });
  } catch (error) {
    return safeServerError("Failed to fetch trial", error);
  }
}
