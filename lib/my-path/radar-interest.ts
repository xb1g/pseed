/**
 * Radar → My Path handoff.
 *
 * A student can leave the plan wizard to read a full Radar field, mark it as
 * interesting there, and come back. The Radar page cannot touch the wizard
 * draft directly (a signed-in draft lives on the server, an anonymous one in
 * localStorage), so the two sides share a tiny slug inbox instead: Radar
 * appends slugs, the wizard drains them into real `career_saved` events.
 */

export const RADAR_INTEREST_STORAGE_KEY = "passionseed_plan_radar_interests_v1";

export interface InterestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readRadarInterests(storage: InterestStorage): string[] {
  const raw = storage.getItem(RADAR_INTEREST_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (slug): slug is string => typeof slug === "string" && slug.length > 0
    );
  } catch {
    storage.removeItem(RADAR_INTEREST_STORAGE_KEY);
    return [];
  }
}

export function toggleRadarInterest(
  storage: InterestStorage,
  slug: string
): string[] {
  const current = readRadarInterests(storage);
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
  storage.setItem(RADAR_INTEREST_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearRadarInterests(storage: InterestStorage): void {
  storage.removeItem(RADAR_INTEREST_STORAGE_KEY);
}
