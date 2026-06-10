import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getAuthedSupabase(req: NextRequest) {
  const supabase = await createClient();
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await supabase.auth.setSession({ access_token: token, refresh_token: "" });
  }
  return supabase;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAuthedSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.is_done === "boolean") patch.is_done = body.is_done;
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.due_date === "string") patch.due_date = body.due_date;

  const { error } = await supabase
    .from("build_todos")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
