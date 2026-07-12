import { NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { loadCanonicalRadarField } from "@/lib/radar/admin-canonical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { fieldId } = await params;
    const canonical = await loadCanonicalRadarField(
      admin.value.supabase,
      fieldId
    );

    if (!canonical) {
      return NextResponse.json({ error: "Radar field not found" }, { status: 404 });
    }

    return NextResponse.json({
      canonical,
      draft: null,
      draftPersistence: "not_configured",
    });
  } catch (error) {
    return safeServerError("Failed to load Radar field", error);
  }
}
