import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminGetAllProducts } from "@/lib/hackathon/gallery";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");
  if (!roles || roles.length === 0) return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  try {
    const products = await adminGetAllProducts();
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[admin/gallery GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
