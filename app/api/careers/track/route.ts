import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { view_type, event_type, payload = {}, session_id } = body;

    if (!view_type || !event_type || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields: view_type, event_type, session_id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("view_test_events").insert({
      session_id,
      user_id: user?.id || null,
      view_type,
      event_type,
      payload,
    });

    if (error) {
      console.error("Failed to track event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
