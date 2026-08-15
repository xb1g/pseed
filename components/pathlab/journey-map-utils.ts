import type { Edge, Node } from "@xyflow/react";

/** Response shape of GET /api/maps/public-preview/:id. */
export interface JourneyPreviewNode {
  id: string;
  title: string;
  nodeType: string;
  spriteUrl: string | null;
  position: { x: number; y: number } | null;
  snippet: string | null;
}

export interface JourneyPreviewEdge {
  id: string;
  source: string;
  target: string;
}

export interface JourneyPreview {
  map: { id: string; title: string; description: string | null };
  nodes: JourneyPreviewNode[];
  edges: JourneyPreviewEdge[];
}

/**
 * Fallback trail for nodes without a stored canvas position: a gentle
 * left/right wander walking downward, echoing the real viewer's trailMode.
 */
const FALLBACK_GAP_X = 180;
const FALLBACK_STEP_Y = 140;

export function toFlowNodes(
  preview: JourneyPreview,
  selectedId: string | null
): Node[] {
  return preview.nodes.map((node, i) => ({
    id: node.id,
    type: "journeyGame",
    position: node.position ?? {
      x: (i % 2) * FALLBACK_GAP_X,
      y: i * FALLBACK_STEP_Y,
    },
    draggable: false,
    data: {
      id: node.id,
      title: node.title,
      node_type: node.nodeType,
      sprite_url: node.spriteUrl,
      snippet: node.snippet,
      selected: node.id === selectedId,
    },
    /* GameNode paints its own card; the React Flow wrapper stays invisible. */
    style: { backgroundColor: "transparent", border: "none", padding: 0 },
  }));
}

export function toFlowEdges(preview: JourneyPreview): Edge[] {
  return preview.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    style: {
      stroke: "rgba(196, 62, 29, 0.4)",
      strokeWidth: 2,
      strokeDasharray: "7 7",
    },
  }));
}
