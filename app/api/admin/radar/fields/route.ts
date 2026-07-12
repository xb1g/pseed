import { NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { listCanonicalRadarFields } from "@/lib/radar/admin-canonical";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const fields = await listCanonicalRadarFields(admin.value.supabase);
    return NextResponse.json({ fields, draftPersistence: "not_configured" });
  } catch (error) {
    return safeServerError("Failed to load Radar fields", error);
  }
}
