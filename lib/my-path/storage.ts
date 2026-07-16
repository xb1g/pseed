import type { MyPathDraft } from "./types";
import { myPathDraftSchema } from "./validation";

export const MY_PATH_DRAFT_STORAGE_KEY = "passionseed_my_path_draft_v1";

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadMyPathDraft(
  storage: DraftStorage,
  now = new Date().toISOString()
): MyPathDraft | null {
  const raw = storage.getItem(MY_PATH_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = myPathDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || new Date(parsed.data.expiresAt) <= new Date(now)) {
      storage.removeItem(MY_PATH_DRAFT_STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    storage.removeItem(MY_PATH_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function saveMyPathDraft(storage: DraftStorage, draft: MyPathDraft): void {
  const parsed = myPathDraftSchema.parse(draft);
  storage.setItem(MY_PATH_DRAFT_STORAGE_KEY, JSON.stringify(parsed));
}

export function clearMyPathDraft(storage: DraftStorage): void {
  storage.removeItem(MY_PATH_DRAFT_STORAGE_KEY);
}
