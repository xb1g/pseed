import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Public, read-only preview of allowlisted learning maps for the /pathlab
 * marketing page. Anon RLS blocks map_nodes reads for signed-out visitors,
 * so this route uses the service role server-side; the allowlist is the
 * security boundary that keeps it from becoming an arbitrary map dump.
 *
 * force-dynamic: edits to the featured map show up on the next page load.
 */
export const dynamic = "force-dynamic";

const PUBLIC_DEMO_MAP_IDS = new Set(["00000000-0000-0000-0000-000000000020"]);

/* eslint-disable @typescript-eslint/no-explicit-any */

function firstSnippet(content: any[] | null): string | null {
  const text = content?.find(
    (c) => c.content_type === "text" && c.content_body
  )?.content_body;
  if (!text) return null;
  const clean = String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!PUBLIC_DEMO_MAP_IDS.has(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("public-preview: missing Supabase env vars");
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("learning_maps")
    .select(
      `
      id, title, description,
      map_nodes (
        id, title, sprite_url, node_type, metadata,
        node_paths_source:node_paths!source_node_id(id, destination_node_id),
        node_content (content_type, content_body)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("public-preview: map fetch failed", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nodes = (data.map_nodes as any[]).map((node) => ({
    id: node.id as string,
    title: node.title as string,
    nodeType: (node.node_type as string) ?? "learning",
    spriteUrl: (node.sprite_url as string) ?? null,
    position: (node.metadata?.position as { x: number; y: number }) ?? null,
    snippet: firstSnippet(node.node_content),
  }));

  const edges = (data.map_nodes as any[]).flatMap((node) =>
    ((node.node_paths_source as any[]) ?? []).map((p) => ({
      id: p.id as string,
      source: node.id as string,
      target: p.destination_node_id as string,
    }))
  );

  return NextResponse.json(
    {
      map: { id: data.id, title: data.title, description: data.description },
      nodes,
      edges,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
