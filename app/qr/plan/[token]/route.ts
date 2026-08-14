import { NextRequest, NextResponse } from "next/server";
import { incrementPlanQrScan } from "@/lib/supabase/student-plans";

export const dynamic = "force-dynamic";

/**
 * Poster QR landing route.
 *
 * Every QR code printed on a student plan poster points here. We record the
 * scan against the exact plan (student_plans.qr_scan_count) and redirect to
 * /pathlab with utm params so downstream analytics can attribute the visit
 * to "this exact plan + qr".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Fire-and-forget: never delay the redirect on tracking.
  incrementPlanQrScan(token).catch((err) =>
    console.error("Failed to record plan QR scan:", err)
  );

  const target = new URL("/pathlab", request.url);
  target.searchParams.set("utm_source", "plan_poster");
  target.searchParams.set("utm_medium", "qr");
  target.searchParams.set("utm_campaign", token);

  return NextResponse.redirect(target, 302);
}
