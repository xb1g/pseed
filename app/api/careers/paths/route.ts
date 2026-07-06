import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: paths, error } = await supabase
      .from("career_paths")
      .select(
        `
        *,
        examples:career_examples(),
        cases:career_cases())
      ` )
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch career paths:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paths: paths || [] });
  } catch (err) {
    console.error("Career paths API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
