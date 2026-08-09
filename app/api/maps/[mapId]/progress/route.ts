import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteContext {
  params: Promise<{ mapId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { mapId } = await context.params;
    const nodeId = request.nextUrl.searchParams.get("node_id");

    if (nodeId) {
      const { data, error } = await supabase
        .from("student_node_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("node_id", nodeId)
        .single();

      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || null });
    }

    // Get all progress for this map's nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("map_nodes")
      .select("id")
      .eq("map_id", mapId);

    if (nodesError) {
      return NextResponse.json({ success: false, error: nodesError.message }, { status: 500 });
    }

    const nodeIds = (nodes || []).map((n) => n.id);

    if (nodeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { map_id: mapId, user_id: user.id, progress_map: {}, all_progress: [] },
      });
    }

    const { data: progress, error: progressError } = await supabase
      .from("student_node_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("node_id", nodeIds);

    if (progressError) {
      return NextResponse.json({ success: false, error: progressError.message }, { status: 500 });
    }

    const progressMap: Record<string, any> = {};
    (progress || []).forEach((p: any) => {
      progressMap[p.node_id] = p;
    });

    return NextResponse.json({
      success: true,
      data: {
        map_id: mapId,
        user_id: user.id,
        progress_map: progressMap,
        all_progress: progress || [],
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/maps/[mapId]/progress:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { mapId } = await context.params;
    const body = await request.json();
    const { node_id, status, arrived_at, started_at, submitted_at } = body;

    if (!node_id || !status) {
      return NextResponse.json({ success: false, error: "node_id and status are required" }, { status: 400 });
    }

    // Verify the node belongs to this map
    const { data: node, error: nodeError } = await supabase
      .from("map_nodes")
      .select("id")
      .eq("id", node_id)
      .eq("map_id", mapId)
      .single();

    if (nodeError || !node) {
      return NextResponse.json({ success: false, error: "Node not found in this map" }, { status: 404 });
    }

    const upsertData: any = {
      user_id: user.id,
      node_id,
      status,
    };
    if (arrived_at) upsertData.arrived_at = arrived_at;
    if (started_at) upsertData.started_at = started_at;
    if (submitted_at) upsertData.submitted_at = submitted_at;

    const { data, error } = await supabase
      .from("student_node_progress")
      .upsert(upsertData, { onConflict: "user_id,node_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: `Progress updated to ${status}` });
  } catch (error: any) {
    console.error("Error in POST /api/maps/[mapId]/progress:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
