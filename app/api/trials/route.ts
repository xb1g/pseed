import { randomBytes } from "crypto";
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
    const { supabase, userId } = auth.value;

    const body = await request.json().catch(() => ({}));
    const parsed = seedIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { seedId } = parsed.data;

    const mapTrial = (row: {
      id: string;
      pay_token: string;
      status: string;
      payment_deadline: string;
      paid_at: string | null;
    }): TrialLaunchTrial => ({
      id: row.id,
      payToken: row.pay_token,
      status: resolveTrialStatus({
        status: row.status as TrialLaunchTrial["status"],
        payment_deadline: row.payment_deadline,
        paid_at: row.paid_at,
      }),
      paymentDeadline: row.payment_deadline,
      paidAt: row.paid_at,
    });
    const mapEnrollment = (row: {
      id: string;
      current_day: number;
      status: TrialLaunchEnrollment["status"];
    }): TrialLaunchEnrollment => ({
      id: row.id,
      currentDay: row.current_day,
      status: row.status,
    });

    const repository: TrialLaunchRepository = {
      async findPathLabSeed(candidateSeedId) {
        const { data: seed, error: seedError } = await supabase
          .from("seeds")
          .select("id, seed_type")
          .eq("id", candidateSeedId)
          .maybeSingle();
        if (seedError) throw seedError;
        if (!seed || seed.seed_type !== "pathlab") return null;
        const { data: path, error: pathError } = await supabase
          .from("paths")
          .select("id")
          .eq("seed_id", candidateSeedId)
          .maybeSingle();
        if (pathError) throw pathError;
        return path ? { id: seed.id, pathId: path.id } : null;
      },
      async createTrial(candidateUserId, candidateSeedId) {
        const { data, error } = await supabase
          .from("trial_accesses")
          .insert({
            user_id: candidateUserId,
            seed_id: candidateSeedId,
            pay_token: randomBytes(16).toString("hex"),
          })
          .select("id, pay_token, status, payment_deadline, paid_at")
          .single();
        if (error) throw error;
        return mapTrial(data);
      },
      async findTrial(candidateUserId, candidateSeedId) {
        const { data, error } = await supabase
          .from("trial_accesses")
          .select("id, pay_token, status, payment_deadline, paid_at")
          .eq("user_id", candidateUserId)
          .eq("seed_id", candidateSeedId)
          .maybeSingle();
        if (error) throw error;
        return data ? mapTrial(data) : null;
      },
      async findEnrollment(candidateUserId, pathId) {
        const { data, error } = await supabase
          .from("path_enrollments")
          .select("id, current_day, status")
          .eq("user_id", candidateUserId)
          .eq("path_id", pathId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        if (data.status === "paused" || data.status === "quit") {
          const { data: resumed, error: resumeError } = await supabase
            .from("path_enrollments")
            .update({ status: "active", completed_at: null })
            .eq("id", data.id)
            .select("id, current_day, status")
            .single();
          if (resumeError) throw resumeError;
          return mapEnrollment(resumed);
        }
        return mapEnrollment(data);
      },
      async createEnrollment(candidateUserId, pathId) {
        const { data, error } = await supabase
          .from("path_enrollments")
          .insert({
            user_id: candidateUserId,
            path_id: pathId,
            current_day: 1,
            status: "active",
          })
          .select("id, current_day, status")
          .single();
        if (error) throw error;
        return mapEnrollment(data);
      },
    };

    const launch = await startTrialAndEnrollment({ userId, seedId }, repository);
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
