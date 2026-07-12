import { NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import { loadCanonicalRadarField } from "@/lib/radar/admin-canonical";
import {
  createRadarDraftStore,
} from "@/lib/radar/admin-draft-store";
import { z } from "zod";

const wysiwygDraftSchema = z.object({
  field: z.record(z.unknown()),
  cards: z.array(z.record(z.unknown())).max(50),
  expectedRevision: z.number().int().positive().nullable(),
});

function draftErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("radar_drafts") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  ) {
    return NextResponse.json(
      {
        error:
          "Draft storage is not installed yet. Apply the pending Radar database migrations.",
        code: "RADAR_DRAFT_STORAGE_MISSING",
      },
      { status: 503 }
    );
  }
  if (message === "RADAR_DRAFT_CONFLICT") {
    return NextResponse.json(
      { error: "This draft changed in another session. Reload before saving." },
      { status: 409 }
    );
  }
  return safeServerError("Failed to save Radar draft", error);
}

function createStore(
  supabase: Awaited<ReturnType<typeof import("@/utils/supabase/server").createClient>>
) {
  const drafts = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { content: unknown; revision: number; updated_at: string } | null;
            error: { code?: string; message: string } | null;
          }>;
        };
      };
      upsert: (
        value: Record<string, unknown>,
        options: { onConflict: string }
      ) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: { revision: number; updated_at: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  return createRadarDraftStore({
    loadCanonical: (id: string) => loadCanonicalRadarField(supabase, id),
    loadDraft: async (id: string) => {
      const { data, error } = await drafts
        .from("radar_drafts")
        .select("content, revision, updated_at")
        .eq("field_id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as never;
    },
    persistDraft: async ({ fieldId, content, actorId, expectedRevision }) => {
      const current = await drafts
        .from("radar_drafts")
        .select("content, revision, updated_at")
        .eq("field_id", fieldId)
        .maybeSingle();
      if (current.error) throw new Error(current.error.message);
      if (
        expectedRevision !== null &&
        current.data?.revision !== expectedRevision
      ) {
        throw new Error("RADAR_DRAFT_CONFLICT");
      }
      const { data, error } = await drafts
        .from("radar_drafts")
        .upsert(
          {
            field_id: fieldId,
            content,
            updated_by: actorId,
            revision: (current.data?.revision ?? 0) + 1,
          },
          { onConflict: "field_id" }
        )
        .select("revision, updated_at")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Draft save failed");
      return data;
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { fieldId } = await params;
    const store = createStore(admin.value.supabase);
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

  const parsed = wysiwygDraftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Radar draft", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const { fieldId } = await params;
    const store = createStore(admin.value.supabase);
    const saved = await store.save(
      fieldId,
      { field: parsed.data.field, cards: parsed.data.cards },
      admin.value.userId,
      parsed.data.expectedRevision
    );
    return NextResponse.json({ status: "saved", ...saved });
  } catch (error) {
    return draftErrorResponse(error);
  }
}
