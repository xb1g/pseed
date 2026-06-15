import { NextRequest, NextResponse } from "next/server";
import { extractHackathonToken, getCorsHeaders } from "@/lib/hackathon/auth";
import { getSessionParticipant, getParticipantTeam } from "@/lib/hackathon/db";
import { upsertGalleryProduct, ALLOWED_TAGS, type GalleryProductInput } from "@/lib/hackathon/gallery";

export const runtime = "nodejs";

const ALLOWED_TAG_SET = new Set(ALLOWED_TAGS as unknown as string[]);

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const token = extractHackathonToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const participant = await getSessionParticipant(token);
  if (!participant) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const team = await getParticipantTeam(participant.id);
  if (!team) return NextResponse.json({ error: "You must be in a team to submit" }, { status: 400, headers: corsHeaders });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const errors: string[] = [];

  const product_name = (body.product_name ?? "").toString().trim();
  if (!product_name) errors.push("product_name is required");
  else if (product_name.length > 80) errors.push("product_name must be 80 characters or fewer");

  const problem_statement = (body.problem_statement ?? "").toString().trim();
  if (!problem_statement) errors.push("problem_statement is required");
  else if (problem_statement.length > 300) errors.push("problem_statement must be 300 characters or fewer");

  const solution_description = (body.solution_description ?? "").toString().trim();
  if (!solution_description) errors.push("solution_description is required");
  else if (solution_description.length > 1000) errors.push("solution_description must be 1000 characters or fewer");

  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];
  if (tags.length < 1) errors.push("At least one tag is required");
  else if (tags.length > 5) errors.push("Maximum 5 tags allowed");
  else if (tags.some((t) => !ALLOWED_TAG_SET.has(t))) errors.push("One or more tags are not from the allowed list");

  const demo_url = body.demo_url ? (body.demo_url as string).trim() : null;
  if (demo_url && !isValidUrl(demo_url)) errors.push("demo_url must be a valid URL");

  const cover_image_url = body.cover_image_url ? (body.cover_image_url as string).trim() : null;
  if (cover_image_url && !isValidUrl(cover_image_url)) errors.push("cover_image_url must be a valid URL");

  const additional_images: string[] = Array.isArray(body.additional_images) ? body.additional_images : [];
  if (additional_images.length > 4) errors.push("Maximum 4 additional images allowed");
  if (additional_images.some((u) => !isValidUrl(u))) errors.push("One or more additional_images URLs are invalid");

  const line_qr_url = body.line_qr_url ? (body.line_qr_url as string).trim() : null;
  if (line_qr_url && !isValidUrl(line_qr_url)) errors.push("line_qr_url must be a valid URL");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 422, headers: corsHeaders });
  }

  const input: GalleryProductInput = {
    product_name,
    problem_statement,
    solution_description,
    tags,
    demo_url,
    cover_image_url,
    additional_images,
    line_qr_url,
  };

  try {
    const product = await upsertGalleryProduct(team.id, input);
    return NextResponse.json({ product }, { headers: corsHeaders });
  } catch (err) {
    console.error("[gallery/submit]", err);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500, headers: corsHeaders });
  }
}
