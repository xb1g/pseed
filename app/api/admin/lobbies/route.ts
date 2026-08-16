import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import {
  getLobbiesForMap,
  createLobby,
  setLobbyOpen,
  setLobbyAccessTier,
} from "@/lib/supabase/lobbies";
import { isLobbyAccessTier } from "@/types/lobby";

/**
 * GET /api/admin/lobbies?mapId=<uuid>
 * Returns all lobbies for a map with member counts.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(request.url);
  const mapId = url.searchParams.get("mapId");

  if (!mapId) {
    return NextResponse.json(
      { error: "Missing required query parameter: mapId" },
      { status: 400 }
    );
  }

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(mapId)) {
    return NextResponse.json(
      { error: "Invalid mapId: must be a valid UUID" },
      { status: 400 }
    );
  }

  try {
    const lobbies = await getLobbiesForMap(mapId);
    return NextResponse.json({ lobbies });
  } catch (error) {
    return safeServerError("Failed to fetch lobbies", error);
  }
}

/**
 * POST /api/admin/lobbies
 * Body: { mapId: string, name: string, accessTier?: "full" | "micro" }
 * Creates a new lobby for the given map. Defaults to the full-map tier.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { mapId, name, accessTier } = body as Record<string, unknown>;

  if (!mapId || typeof mapId !== "string") {
    return NextResponse.json(
      { error: "Missing required field: mapId" },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: name" },
      { status: 400 }
    );
  }

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(mapId)) {
    return NextResponse.json(
      { error: "Invalid mapId: must be a valid UUID" },
      { status: 400 }
    );
  }

  if (accessTier !== undefined && !isLobbyAccessTier(accessTier)) {
    return NextResponse.json(
      { error: 'Invalid accessTier: must be "full" or "micro"' },
      { status: 400 }
    );
  }

  try {
    const lobby = await createLobby(
      mapId,
      name.trim(),
      accessTier ?? "full"
    );
    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create lobby";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/lobbies
 * Body: { lobbyId: string, isOpen?: boolean, accessTier?: "full" | "micro" }
 * Opens or closes a lobby, and/or changes its access tier. At least one of
 * isOpen and accessTier must be present.
 */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { lobbyId, isOpen, accessTier } = body as Record<string, unknown>;

  if (!lobbyId || typeof lobbyId !== "string") {
    return NextResponse.json(
      { error: "Missing required field: lobbyId" },
      { status: 400 }
    );
  }

  if (isOpen !== undefined && typeof isOpen !== "boolean") {
    return NextResponse.json(
      { error: "Invalid field: isOpen (must be boolean)" },
      { status: 400 }
    );
  }

  if (accessTier !== undefined && !isLobbyAccessTier(accessTier)) {
    return NextResponse.json(
      { error: 'Invalid accessTier: must be "full" or "micro"' },
      { status: 400 }
    );
  }

  if (isOpen === undefined && accessTier === undefined) {
    return NextResponse.json(
      { error: "Nothing to update: provide isOpen and/or accessTier" },
      { status: 400 }
    );
  }

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(lobbyId)) {
    return NextResponse.json(
      { error: "Invalid lobbyId: must be a valid UUID" },
      { status: 400 }
    );
  }

  try {
    if (typeof isOpen === "boolean") {
      await setLobbyOpen(lobbyId, isOpen);
    }
    if (accessTier !== undefined) {
      await setLobbyAccessTier(lobbyId, accessTier);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update lobby";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
