export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalGap?: number;
  verticalGap?: number;
}

interface LayoutNode {
  id: string;
  data: any;
  type?: string;
  position?: { x: number; y: number };
  [key: string]: any;
}

interface LayoutEdge {
  source: string;
  target: string;
  [key: string]: any;
}

const DEFAULTS = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalGap: 80,
  verticalGap: 150,
};

/**
 * Returns a map of node ID to its depth level based on longest path from roots.
 * Handles cycles by capping traversal at the number of nodes.
 */
export function getNodeDepthMap(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): Map<string, number> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const children = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodeIds) {
    children.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    children.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // BFS from roots using Kahn's algorithm for longest path
  const depth = new Map<string, number>();
  const queue: string[] = [];

  for (const id of nodeIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id);
      depth.set(id, 0);
    }
  }

  // If all nodes are in a cycle, pick one arbitrarily as root
  if (queue.length === 0 && nodeIds.size > 0) {
    const first = nodeIds.values().next().value!;
    queue.push(first);
    depth.set(first, 0);
  }

  let i = 0;
  while (i < queue.length) {
    const id = queue[i++];
    const d = depth.get(id)!;
    for (const child of children.get(id) ?? []) {
      const existing = depth.get(child);
      // Longest path: always take the greater depth
      if (existing === undefined || d + 1 > existing) {
        depth.set(child, d + 1);
        queue.push(child);
      }
    }
    // Safety: prevent infinite loops from cycles
    if (i > nodeIds.size * nodeIds.size) break;
  }

  // Assign any remaining unreached nodes (disconnected cycle members)
  const maxDepth = Math.max(0, ...depth.values());
  for (const id of nodeIds) {
    if (!depth.has(id)) {
      depth.set(id, maxDepth + 1);
    }
  }

  return depth;
}

/**
 * Computes top-to-bottom positions for nodes based on the prerequisite graph.
 * Returns the same nodes array with `position` set.
 */
export function computeTopDownLayout<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  options?: LayoutOptions
): T[] {
  if (nodes.length === 0) return [];

  const opts = { ...DEFAULTS, ...options };
  const depth = getNodeDepthMap(nodes, edges);

  // Group nodes by level
  const levels = new Map<number, string[]>();
  for (const [id, d] of depth) {
    if (!levels.has(d)) levels.set(d, []);
    levels.get(d)!.push(id);
  }

  // Compute positions: center each level horizontally
  const positions = new Map<string, { x: number; y: number }>();
  const cellWidth = opts.nodeWidth + opts.horizontalGap;
  const cellHeight = opts.nodeHeight + opts.verticalGap;

  for (const [level, ids] of levels) {
    const totalWidth = ids.length * cellWidth - opts.horizontalGap;
    const startX = -totalWidth / 2;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * cellWidth,
        y: level * cellHeight,
      });
    });
  }

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
  }));
}
