/**
 * Project tags — free text the participant types, normalized so the room can
 * actually find each other on them.
 *
 * Lives outside `actions/projectseed.ts` because a `"use server"` module may
 * only export async functions, and both the form and the action need the same
 * rules — a client that normalizes differently from the server produces tags
 * that look right and never match.
 */

export const PSEED_MAX_TAGS = 5;
export const PSEED_MAX_TAG_LENGTH = 24;

/**
 * Lowercased and stripped of a leading `#`, because `React`, `react` and
 * `#react` are one topic. A tag list that treats them as three is worse than no
 * tag list: the entire point is finding the other person working on your thing.
 */
export function normalizeTag(raw: string): string {
  return String(raw)
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, PSEED_MAX_TAG_LENGTH);
}

/** Normalizes, drops blanks and duplicates, and caps the list at five. */
export function normalizeTags(input: string[] | null | undefined): string[] {
  const seen = new Set<string>();

  for (const raw of input ?? []) {
    const tag = normalizeTag(raw);
    if (tag) seen.add(tag);
    if (seen.size >= PSEED_MAX_TAGS) break;
  }

  return [...seen];
}
