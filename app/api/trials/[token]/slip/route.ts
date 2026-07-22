import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { safeServerError } from "@/lib/security/route-guards";
import { resolveTrialAccessByToken } from "@/lib/trials/trial-token-server";

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

    const service = createServiceRoleClient();
    const trial = await resolveTrialAccessByToken(service, parsed.data);
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
    const slipPath = `${trial.id}/${randomBytes(8).toString("hex")}-${sanitizeFilename(file.name, file.type)}`;

    const { error: uploadError } = await service.storage
      .from("trial-slips")
      .upload(slipPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return safeServerError("Failed to upload slip", uploadError);
    }

    const { data: transitioned, error: updateError } = await service.rpc(
      "submit_trial_payment_slip",
      {
        p_trial_id: trial.id,
        p_slip_path: slipPath,
      }
    );

    if (updateError) {
      return safeServerError("Failed to update trial", updateError);
    }
    if (!transitioned) {
      // The upload has a unique path, so cleanup cannot remove a previously
      // verified slip. The status transition itself is the source of truth.
      await service.storage.from("trial-slips").remove([slipPath]);
      const current = await resolveTrialAccessByToken(service, parsed.data);
      return NextResponse.json(
        { error: current?.status === "paid" ? "already_paid" : "status_changed" },
        { status: 409 }
      );
    }

    return NextResponse.json({ status: transitioned });
  } catch (error) {
    return safeServerError("Failed to upload slip", error);
  }
}
