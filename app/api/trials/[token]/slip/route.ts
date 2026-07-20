import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { safeServerError } from "@/lib/security/route-guards";

const tokenSchema = z.string().regex(/^[0-9a-f]{32}$/);
const MAX_SLIP_BYTES = 5 * 1024 * 1024; // 5MB

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
};

function sanitizeFilename(name: string, mimeType: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(-80);
  if (!cleaned) return `slip${MIME_EXTENSION[mimeType] ?? ".jpg"}`;
  if (!cleaned.includes(".")) {
    return `${cleaned}${MIME_EXTENSION[mimeType] ?? ".jpg"}`;
  }
  return cleaned;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const parsed = tokenSchema.safeParse(token);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Public endpoint: look the trial up via the anon-callable RPC
    const supabase = await createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "get_trial_by_token",
      { p_token: parsed.data }
    );

    if (rpcError) {
      return safeServerError("Failed to fetch trial", rpcError);
    }

    const trial = (data ?? null) as { id: string; status: string } | null;
    if (!trial) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (trial.status === "paid") {
      return NextResponse.json({ error: "already_paid" }, { status: 409 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("slip");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "slip file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SLIP_BYTES) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    // Storage uploads and trial updates are service-role only (RLS)
    const service = createServiceRoleClient();
    const slipPath = `${trial.id}/${sanitizeFilename(file.name, file.type)}`;

    const { error: uploadError } = await service.storage
      .from("trial-slips")
      .upload(slipPath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      return safeServerError("Failed to upload slip", uploadError);
    }

    const { error: updateError } = await service
      .from("trial_accesses")
      .update({
        status: "pending",
        slip_path: slipPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trial.id);

    if (updateError) {
      return safeServerError("Failed to update trial", updateError);
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    return safeServerError("Failed to upload slip", error);
  }
}
