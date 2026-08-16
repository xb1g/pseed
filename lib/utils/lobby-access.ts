import type { FullLearningMap } from "@/lib/supabase/maps";
import type { MapNode } from "@/types/map";
import { buildJourneyDays } from "@/lib/utils/map-journey";

/**
 * Micro (free) lobbies see one island: the map's first one. "First island" is
 * day 1 of the same journey the lobby gate advertises -- the nodes a student
 * can start immediately (no prerequisites). A branching map therefore opens
 * every one of its start islands, which is what the gate already promises.
 *
 * Annotations (text/comment nodes) are not islands; they stay visible so the
 * canvas keeps its labels.
 */
export const getFirstIslandNodeIds = (map: FullLearningMap): Set<string> => {
  const nodes = map.map_nodes ?? [];
  const edges = nodes.flatMap((node) =>
    (node.node_paths_source ?? []).map((path) => ({
      source: path.source_node_id,
      destination: path.destination_node_id,
    }))
  );

  const firstDay = buildJourneyDays(nodes, edges)[0];
  return new Set((firstDay?.stops ?? []).map((stop) => stop.id));
};

const ANNOTATION_TYPES = new Set(["text", "comment"]);

const isAnnotation = (node: MapNode): boolean =>
  !!node.node_type && ANNOTATION_TYPES.has(node.node_type);

/** Islands a micro-tier member may not open. Annotations are never locked. */
export const getLockedNodeIds = (
  map: FullLearningMap,
  allowedNodeIds: Set<string>
): string[] =>
  (map.map_nodes ?? [])
    .filter((node) => !allowedNodeIds.has(node.id) && !isAnnotation(node))
    .map((node) => node.id);

/**
 * Strips the payload of every island a micro-tier member may not read, so the
 * locked content never reaches the browser. Island titles and sprites survive
 * -- the rest of the trail stays visible as a locked preview of what the paid
 * tier opens.
 */
export const restrictMapToFirstIsland = (
  map: FullLearningMap,
  allowedNodeIds: Set<string>
): FullLearningMap => ({
  ...map,
  map_nodes: (map.map_nodes ?? []).map((node) => {
    if (allowedNodeIds.has(node.id) || isAnnotation(node)) return node;
    return {
      ...node,
      instructions: null,
      node_content: [],
      node_assessments: [],
    };
  }),
});
