import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, safeServerError } from "@/lib/security/route-guards";
import type { MetaAttachmentType } from "@/lib/meta/graph";

const MAX_SIZE_BYTES: Record<MetaAttachmentType, number> = {
  image: 8 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  file: 10 * 1024 * 1024,
};

function classifyAttachmentType(mime: string): MetaAttachmentType | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || mime.startsWith("application/") || mime === "text/plain") {
    return "file";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard.value;

  const formData = await request.formData();
  const file = formData.get("file");
  const conversationId = formData.get("conversationId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof conversationId !== "string" || !conversationId) {
    return NextResponse.json({ error: "No conversation ID provided" }, { status: 400 });
  }

  const attachmentType = classifyAttachmentType(file.type);
  if (!attachmentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  const maxSize = MAX_SIZE_BYTES[attachmentType];
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File must be under ${Math.floor(maxSize / (1024 * 1024))}MB` },
      { status: 400 }
    );
  }

  const safeConversationId = conversationId.replace(/[^a-zA-Z0-9_-]/g, "");
  const rawExt = file.name.split(".").pop() || "bin";
  const safeExt = rawExt.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const filePath = `dm-attachments/${safeConversationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("seed-assets")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return safeServerError("Failed to upload file", uploadError);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("seed-assets").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl, attachmentType });
  } catch (error) {
    return safeServerError("Failed to upload file", error);
  }
}
