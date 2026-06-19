import { NextRequest, NextResponse } from "next/server";
import { extractHackathonToken, getCorsHeaders } from "@/lib/hackathon/auth";
import { getSessionParticipant, getParticipantTeam } from "@/lib/hackathon/db";
import { storageManager } from "@/lib/storage/storage-manager";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const fileName = `hackathon/gallery/${team.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const result = await storageManager.uploadImage(buffer, fileName, file.type);
    return NextResponse.json({ url: result.url }, { headers: corsHeaders });
  } catch (err) {
    console.error("[gallery/upload-image]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500, headers: corsHeaders });
  }
}
