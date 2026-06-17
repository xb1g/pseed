import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_id, session_id, match_score, answers } = body;

  if (!product_id || typeof product_id !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 422 });
  }
  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "session_id required" }, { status: 422 });
  }
  if (typeof match_score !== "number") {
    return NextResponse.json({ error: "match_score required" }, { status: 422 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 422 });
  }

  const { error } = await getClient()
    .from("hackathon_gallery_matches")
    .insert({ product_id, session_id, match_score, answers });

  if (error) {
    console.error("[gallery/match]", error);
    return NextResponse.json({ error: "Failed to record match" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
