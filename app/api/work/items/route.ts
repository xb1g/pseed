import { NextRequest, NextResponse } from "next/server";

import { requireWorkApiAccess } from "@/lib/work/access";
import {
  isWorkspaceTableMissing,
  workAreaSchema,
  workItemInputSchema,
  workItemPatchSchema,
} from "@/lib/work/work-items";
import { createWorkItem, listWorkItems, updateWorkItem } from "@/lib/work/work-items-server";

function databaseError(error: { code?: string; message?: string } | null) {
  if (isWorkspaceTableMissing(error)) {
    return NextResponse.json(
      {
        error: "Work persistence is not installed yet.",
        code: "WORKSPACE_NOT_MIGRATED",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  if (process.env.NODE_ENV !== "production" && error) {
    console.error("[work-items] database operation failed", error);
  }
  return NextResponse.json({ error: "Could not save work right now." }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const auth = await requireWorkApiAccess();
  if (!auth.ok) return auth.response;

  const parsedArea = workAreaSchema.safeParse(request.nextUrl.searchParams.get("area"));
  if (!parsedArea.success) {
    return NextResponse.json({ error: "A valid work area is required." }, { status: 400 });
  }

  const result = await listWorkItems(auth.value.supabase, parsedArea.data);
  if (result.error) return databaseError(result.error);
  return NextResponse.json({ items: result.items });
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkApiAccess();
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  const parsed = workItemInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the fields and try again.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createWorkItem(auth.value.supabase, auth.value.userId, parsed.data);
  if (result.error || !result.item) return databaseError(result.error);
  return NextResponse.json({ item: result.item }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireWorkApiAccess();
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  const parsed = workItemPatchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the fields and try again.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateWorkItem(auth.value.supabase, parsed.data);
  if (result.error || !result.item) return databaseError(result.error);
  return NextResponse.json({ item: result.item });
}
