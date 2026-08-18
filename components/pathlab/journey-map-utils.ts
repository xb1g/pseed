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

export interface TrailStop {
  id: string;
  title: string;
  spriteUrl: string; // never null; fallback applied
  snippet: string | null;
  xPct: number; // 18 | 50 | 82 cycling
  row: number; // 0-based row index
}

export const TRAIL_X_PCT = [18, 50, 82, 50] as const;
export const TRAIL_ROW_PX = 160;
export const FALLBACK_SPRITE = "/islands/crystal.png";

/**
 * Lay the preview's nodes out as a vertical zigzag trail: one 120px row per
 * node, wandering left/center/right so the marketing page shows the map's
 * shape without any canvas chrome.
 */
export function toTrailStops(preview: JourneyPreview): TrailStop[] {
  return preview.nodes.map((node, i) => ({
    id: node.id,
    title: node.title,
    spriteUrl: node.spriteUrl ?? FALLBACK_SPRITE,
    snippet: node.snippet,
    xPct: TRAIL_X_PCT[i % TRAIL_X_PCT.length],
    row: i,
  }));
}

/** Smooth dashed connector through stop centers, in viewBox units (100 wide, 12 per row).
 *  Uses a quadratic bezier with a midpoint control point pushed off-axis between
 *  consecutive stops so the trail weaves left/right with the zigzag instead of
 *  cutting diagonally across each island sprite. */
export function trailPathD(stops: TrailStop[]): string {
  if (stops.length < 2) return "";
  const pts = stops.map((s) => ({ x: s.xPct, y: s.row * 12 + 6 }));

  // Build the polyline as a sequence of short Q segments. Each segment's
  // control point sits on the row's vertical midpoint and shares its x
  // with the start of the segment, so the curve bows horizontally toward
  // the next stop rather than crossing straight through the island sprite
  // at that row.
  const parts: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const midY = (a.y + b.y) / 2;
    parts.push(`Q ${a.x} ${midY} ${(a.x + b.x) / 2} ${midY}`);
    parts.push(`Q ${b.x} ${midY} ${b.x} ${b.y}`);
  }
  return parts.join(" ");
}
