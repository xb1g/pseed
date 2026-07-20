import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { safeServerError } from "@/lib/security/route-guards";
import { resolveTrialStatus, type TrialStatus } from "@/lib/trials/status";

const tokenSchema = z.string().regex(/^[0-9a-f]{32}$/);

// Shape returned by the get_trial_by_token RPC (json)
interface TrialByToken {
  id: string;
  status: TrialStatus;
  priceAmount: number;
  startedAt: string;
  paymentDeadline: string;
  paidAt: string | null;
  seedId: string;
  seedTitle: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const parsed = tokenSchema.safeParse(token);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Public endpoint: get_trial_by_token is callable by anon
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_trial_by_token", {
      p_token: parsed.data,
    });

    if (error) {
      return safeServerError("Failed to fetch trial", error);
    }

    const trial = (data ?? null) as TrialByToken | null;
    if (!trial) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Resolve lazily so an overdue "active" trial reports as expired
    const status = resolveTrialStatus({
      status: trial.status,
      payment_deadline: trial.paymentDeadline,
      paid_at: trial.paidAt,
    });

    return NextResponse.json({
      status,
      priceAmount: trial.priceAmount,
      paymentDeadline: trial.paymentDeadline,
      seedTitle: trial.seedTitle,
      paidAt: trial.paidAt,
    });
  } catch (error) {
    return safeServerError("Failed to fetch trial", error);
  }
}
