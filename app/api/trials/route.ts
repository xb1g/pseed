import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, safeServerError } from "@/lib/security/route-guards";
import { resolveTrialStatus } from "@/lib/trials/status";
import {
  startTrialAndEnrollment,
  TrialLaunchError,
  type TrialLaunchEnrollment,
  type TrialLaunchRepository,
  type TrialLaunchTrial,
} from "@/lib/trials/start-trial";

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
    const { supabase } = auth.value;

    const body = await request.json().catch(() => ({}));
    const parsed = seedIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { seedId } = parsed.data;

    const mapTrial = (row: {
      trial_id: string;
      pay_token: string;
      trial_status: string;
      payment_deadline: string;
      paid_at: string | null;
    }): TrialLaunchTrial => ({
      id: row.trial_id,
      payToken: row.pay_token,
      status: row.trial_status as TrialLaunchTrial["status"],
      paymentDeadline: row.payment_deadline,
      paidAt: row.paid_at,
    });
    const mapEnrollment = (row: {
      enrollment_id: string;
      current_day: number;
      enrollment_status: TrialLaunchEnrollment["status"];
    }): TrialLaunchEnrollment => ({
      id: row.enrollment_id,
      currentDay: row.current_day,
      status: row.enrollment_status,
    });

    const repository: TrialLaunchRepository = {
      async launch(candidateSeedId) {
        const { data, error } = await supabase.rpc("start_pathlab_trial", {
          p_seed_id: candidateSeedId,
        });
        if (error) throw error;

        const row = (Array.isArray(data) ? data[0] : data) as {
          trial_id: string;
          pay_token: string;
          trial_status: TrialLaunchTrial["status"];
          payment_deadline: string;
          paid_at: string | null;
          enrollment_id: string | null;
          current_day: number | null;
          enrollment_status: TrialLaunchEnrollment["status"] | null;
        } | null;
        if (!row) return null;

        return {
          trial: mapTrial(row),
          enrollment:
            row.enrollment_id && row.current_day && row.enrollment_status
              ? mapEnrollment({
                  enrollment_id: row.enrollment_id,
                  current_day: row.current_day,
                  enrollment_status: row.enrollment_status,
                })
              : null,
        };
      },
    };

    const launch = await startTrialAndEnrollment({ seedId }, repository);
    return NextResponse.json(launch);
  } catch (error) {
    if (error instanceof TrialLaunchError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
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
