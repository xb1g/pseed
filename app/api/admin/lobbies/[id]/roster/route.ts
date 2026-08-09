import { NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { getLobbyRoster } from "@/lib/supabase/lobbies";

/**
 * GET /api/admin/lobbies/<id>/roster
 * Returns the roster for a single lobby.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Invalid id: must be a valid UUID" },
      { status: 400 }
    );
  }

  try {
    const roster = await getLobbyRoster(id);
    return NextResponse.json({ roster });
  } catch (error) {
    return safeServerError("Failed to fetch lobby roster", error);
  }
}
