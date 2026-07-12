import { NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { loadCanonicalRadarField } from "@/lib/radar/admin-canonical";
import {
  RadarDraftNotConfiguredError,
  createRadarDraftStore,
} from "@/lib/radar/admin-draft-store";
import { radarContentDraftSchema } from "@/lib/radar/admin-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { fieldId } = await params;
    const store = createRadarDraftStore({
      loadCanonical: (id: string) =>
        loadCanonicalRadarField(admin.value.supabase, id),
    });
    const result = await store.read(fieldId);

    if (!result.canonical) {
      return NextResponse.json({ error: "Radar field not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return safeServerError("Failed to load Radar draft", error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const parsed = radarContentDraftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Radar draft", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const { fieldId } = await params;
    const store = createRadarDraftStore({
      loadCanonical: (id: string) =>
        loadCanonicalRadarField(admin.value.supabase, id),
    });
    await store.save(fieldId, parsed.data, admin.value.userId);
  } catch (error) {
    if (error instanceof RadarDraftNotConfiguredError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 501 }
      );
    }
    return safeServerError("Failed to save Radar draft", error);
  }
}
