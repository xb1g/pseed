import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { createServiceRoleClient } from "@/utils/supabase/server";

const querySchema = z.object({
  status: z
    .enum(["active", "pending", "paid", "expired", "all"])
    .default("pending"),
});

const SLIP_URL_TTL_SECONDS = 300;
const MAX_ROWS = 100;

interface TrialRow {
  id: string;
  user_id: string;
  seed_id: string;
  status: string;
  price_amount: number;
  started_at: string;
  payment_deadline: string;
  slip_path: string | null;
  paid_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  admin_note: string | null;
  seed: { title: string } | { title: string }[] | null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { status } = parsed.data;

    // RLS restricts trial_accesses selects to the owner's own rows, so the
    // admin queue must read through the service role.
    const service = createServiceRoleClient();

    let query = service
      .from("trial_accesses")
      .select(
        "id, user_id, seed_id, status, price_amount, started_at, payment_deadline, slip_path, paid_at, verified_by, verified_at, admin_note, seed:seeds!seed_id(title)"
      )
      .order("started_at", { ascending: false })
      .limit(MAX_ROWS);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return safeServerError("Failed to fetch trials", error);
    }

    const rows = (data ?? []) as unknown as TrialRow[];

    // Pending first, then newest
    const ordered = [...rows].sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
    });

    const trials = await Promise.all(
      ordered.map(async (row) => {
        let slipUrl: string | null = null;
        if (row.slip_path) {
          const { data: signed } = await service.storage
            .from("trial-slips")
            .createSignedUrl(row.slip_path, SLIP_URL_TTL_SECONDS);
          slipUrl = signed?.signedUrl ?? null;
        }

        const seedTitle = Array.isArray(row.seed)
          ? row.seed[0]?.title ?? null
          : row.seed?.title ?? null;

        return {
          id: row.id,
          userId: row.user_id,
          seedId: row.seed_id,
          seedTitle,
          status: row.status,
          priceAmount: row.price_amount,
          startedAt: row.started_at,
          paymentDeadline: row.payment_deadline,
          slipPath: row.slip_path,
          slipUrl,
          paidAt: row.paid_at,
          verifiedBy: row.verified_by,
          verifiedAt: row.verified_at,
          adminNote: row.admin_note,
        };
      })
    );

    return NextResponse.json({ trials });
  } catch (error) {
    return safeServerError("Failed to fetch trials", error);
  }
}
