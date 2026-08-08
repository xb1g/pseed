import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteContext {
  params: Promise<{ mapId: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { mapId } = await context.params;

    // Verify the map exists
    const { data: map, error: mapError } = await supabase
      .from("learning_maps")
      .select("id")
      .eq("id", mapId)
      .single();

    if (mapError || !map) {
      return NextResponse.json({ success: false, error: "Map not found" }, { status: 404 });
    }

    // Upsert enrollment
    const { data, error } = await supabase
      .from("user_map_enrollments")
      .upsert(
        { user_id: user.id, map_id: mapId, progress_percentage: 0 },
        { onConflict: "user_id,map_id", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Successfully enrolled in map",
    });
  } catch (error: any) {
    console.error("Error in POST /api/maps/[mapId]/enroll:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
