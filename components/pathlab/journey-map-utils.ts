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
export const TRAIL_ROW_PX = 120;
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

/** Smooth dashed connector through stop centers, in viewBox units (100 wide, 12 per row). */
export function trailPathD(stops: TrailStop[]): string {
  if (stops.length < 2) return "";
  const pts = stops.map((s) => ({ x: s.xPct, y: s.row * 12 + 6 }));
  return pts.reduce(
    (d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`),
    ""
  );
}
