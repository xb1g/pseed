import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteContext {
  params: Promise<{ mapId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: true,
        data: { isEnrolled: false, hasStarted: false },
      });
    }

    const { mapId } = await context.params;

    const { data, error } = await supabase
      .from("user_map_enrollments")
      .select("id, progress_percentage, enrolled_at")
      .eq("user_id", user.id)
      .eq("map_id", mapId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        isEnrolled: !!data,
        hasStarted: data ? (data.progress_percentage ?? 0) > 0 : false,
        enrollment: data || null,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/maps/[mapId]/enrollment:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
