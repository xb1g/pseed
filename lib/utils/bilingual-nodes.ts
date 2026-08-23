/**
 * Utilities for bilingual (Thai/English) learning map nodes.
 *
 * Translation nodes carry `metadata.language = "th"` and
 * `metadata.translation_of = "<primary-node-id>"` linking them to their
 * English counterpart. These helpers build lookups and filter the canvas
 * so students see one node per day instead of parallel language tracks.
 */

import { MapNode } from "@/types/map";

/** A map from primary node ID to its translation node (if any). */
export type TranslationMap = Record<string, MapNode>;

/**
 * Check whether a node is a translation node (not a primary node).
 * Translation nodes have `metadata.language` set to a non-empty string.
 */
export function isTranslationNode(node: MapNode): boolean {
  return !!(node.metadata as any)?.language;
}

/**
 * Check whether a primary node has a linked translation.
 */
export function hasTranslation(node: MapNode, translationMap: TranslationMap): boolean {
  return !!translationMap[node.id];
}

/**
 * Build a lookup from primary node ID -> translation node.
 *
 * Scans all nodes for `metadata.translation_of` and maps the target
 * primary node ID to the translation node. If multiple translations exist
 * for the same primary (e.g. both `th` and a future `ja`), the first one
 * wins for now.
 */
export function buildTranslationMap(nodes: MapNode[]): TranslationMap {
  const map: TranslationMap = {};
  for (const node of nodes) {
    const lang = (node.metadata as any)?.language;
    const translationOf = (node.metadata as any)?.translation_of;
    if (lang && translationOf && !map[translationOf]) {
      map[translationOf] = node;
    }
  }
  return map;
}

/**
 * Get the translation node for a given primary node, or null.
 */
export function getTranslationNode(
  primaryNodeId: string,
  translationMap: TranslationMap
): MapNode | null {
  return translationMap[primaryNodeId] ?? null;
}

/**
 * Filter out translation nodes, returning only primary nodes for canvas display.
 */
export function filterPrimaryNodes(nodes: MapNode[]): MapNode[] {
  return nodes.filter((node) => !isTranslationNode(node));
}
