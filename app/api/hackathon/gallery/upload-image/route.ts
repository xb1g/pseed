import { NextRequest, NextResponse } from "next/server";
import { extractHackathonToken, getCorsHeaders } from "@/lib/hackathon/auth";
import { getSessionParticipant, getParticipantTeam } from "@/lib/hackathon/db";
import { b2 } from "@/lib/backblaze";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1600;

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const token = extractHackathonToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  const participant = await getSessionParticipant(token);
  if (!participant) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  const team = await getParticipantTeam(participant.id);
  if (!team) return NextResponse.json({ error: "You must be in a team to upload images" }, { status: 400, headers: corsHeaders });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400, headers: corsHeaders });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400, headers: corsHeaders });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 422, headers: corsHeaders });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 422, headers: corsHeaders });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Lightweight resize — skip blurhash, skip heavy WebP re-encode
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    const needsResize = meta.width && meta.width > MAX_WIDTH;

    let outputBuffer: Buffer;
    let contentType = file.type;

    if (needsResize) {
      // Only resize if wider than MAX_WIDTH, keep original format
      outputBuffer = await sharp(buffer)
        .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
        .toBuffer();
    } else {
      // Already small enough — upload as-is
      outputBuffer = buffer;
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const fileName = `hackathon/gallery/${team.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await b2.uploadImageBuffer(outputBuffer, fileName, contentType);
    return NextResponse.json({ url: result.fileUrl }, { headers: corsHeaders });
  } catch (err) {
    console.error("[gallery/upload-image]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500, headers: corsHeaders });
  }
}
