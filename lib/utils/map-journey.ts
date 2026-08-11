/**
 * Builds the day-by-day journey shown on the map lobby gate.
 *
 * Maps have no authored "day" field, so days are derived from the path
 * graph: a node's day is its longest-path depth from a start node (a node
 * with no incoming paths). Day 1 is everything you can start immediately,
 * day 2 is what those unlock, and so on. Branching maps simply show
 * several stops on the same day.
 *
 * Text and comment nodes are canvas annotations, not learning steps, so
 * they are excluded. The "end" node is kept as the finale.
 */

export interface JourneyNodeInput {
  id: string;
  title: string;
  sprite_url?: string | null;
  difficulty?: number | null;
  node_type?: string | null;
}

export interface JourneyEdgeInput {
  source: string;
  destination: string;
}

export interface JourneyStop {
  id: string;
  title: string;
  sprite_url: string | null;
  difficulty: number;
  node_type: string | null;
}

export interface JourneyDay {
  day: number;
  stops: JourneyStop[];
}

/** Node types that are annotations on the canvas, not learning stops. */
const NON_STEP_TYPES = new Set(["text", "comment"]);

/** Fallback grouping when a map has no paths: stops per improvised day. */
const UNSORTED_DAY_SIZE = 3;

export function buildJourneyDays(
  nodes: JourneyNodeInput[],
  edges: JourneyEdgeInput[]
): JourneyDay[] {
  const steps = new Map<string, JourneyStop>();

  for (const node of nodes) {
    if (node.node_type && NON_STEP_TYPES.has(node.node_type)) continue;
    steps.set(node.id, {
      id: node.id,
      title: node.title,
      sprite_url: node.sprite_url ?? null,
      difficulty: node.difficulty ?? 1,
      node_type: node.node_type ?? null,
    });
  }

  if (steps.size === 0) return [];

  // No paths authored: improvise days by difficulty so the rail still
  // reads as a progression rather than one flat list.
  if (edges.length === 0) {
    const sorted = [...steps.values()].sort(compareStops);
    const days: JourneyDay[] = [];
    for (let i = 0; i < sorted.length; i += UNSORTED_DAY_SIZE) {
      days.push({
        day: days.length + 1,
        stops: sorted.slice(i, i + UNSORTED_DAY_SIZE),
      });
    }
    return days;
  }

  // Longest-path layering: depth(n) = 1 + max(depth of predecessors).
  // Kahn's algorithm over in-degrees, but a node only joins its layer once
  // every predecessor has been placed, so diamond shapes land correctly.
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of steps.keys()) {
    inDegree.set(id, 0);
    outgoing.set(id, []);
  }
  for (const edge of edges) {
    // Edges pointing at filtered-out (annotation) nodes are ignored.
    if (!steps.has(edge.source) || !steps.has(edge.destination)) continue;
    inDegree.set(edge.destination, (inDegree.get(edge.destination) ?? 0) + 1);
    outgoing.get(edge.source)!.push(edge.destination);
  }

  const depth = new Map<string, number>();
  // Seed with every in-degree-0 node; each is its own day-1 stop.
  let frontier = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);
  for (const id of frontier) depth.set(id, 1);

  let placed = frontier.length;
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const target of outgoing.get(id) ?? []) {
        const remaining = (inDegree.get(target) ?? 0) - 1;
        inDegree.set(target, remaining);
        depth.set(
          target,
          Math.max(depth.get(target) ?? 0, (depth.get(id) ?? 0) + 1)
        );
        if (remaining === 0) {
          next.push(target);
          placed += 1;
        }
      }
    }
    frontier = next;
  }

  // Cycle guard: any node never reached by the layering is part of (or
  // downstream of) a cycle. Surface it on the final day rather than
  // dropping it — a broken map should not hide authored content.
  const maxDepth = Math.max(0, ...depth.values());
  for (const id of steps.keys()) {
    if (!depth.has(id)) depth.set(id, maxDepth + 1);
  }

  const byDay = new Map<number, JourneyStop[]>();
  for (const [id, day] of depth) {
    const list = byDay.get(day) ?? [];
    list.push(steps.get(id)!);
    byDay.set(day, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, stops]) => ({ day, stops: stops.sort(compareStops) }));
}

/** Easier stops first, then alphabetical for a stable, gentle ramp. */
function compareStops(a: JourneyStop, b: JourneyStop): number {
  if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
  return a.title.localeCompare(b.title);
}
