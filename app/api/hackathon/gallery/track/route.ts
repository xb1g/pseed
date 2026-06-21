import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.HACKATHON_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { page, product_id, session_id } = await req.json();

    if (!page || !["gallery", "product", "test_click"].includes(page)) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const supabase = getAdminClient();
    await supabase.from("hackathon_gallery_views").insert({
      page,
      product_id: product_id || null,
      session_id: session_id || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
