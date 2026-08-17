/**
 * Deep links from a lead row into the real chat app.
 *
 * The operator needs an escape hatch out of this admin panel: once a thread is
 * past Meta's 7-day window the Send API cannot touch it, but replying by hand
 * in Instagram still works. Nothing in this app can do that for them, so it has
 * to hand them the door.
 *
 * Uses `ig.me/m/<username>`, Instagram's own messaging deep link, rather than
 * `instagram.com/direct/t/<id>`: the Graph API thread id is not the id the web
 * client's direct URL expects, so that route lands on an error page. The
 * username link opens (or starts) the thread with that person in the app on
 * mobile and on the web elsewhere.
 */

import type { DmPlatform } from "@/types/dm-leads";

export interface ChatLinkSource {
  platform: DmPlatform;
  username: string | null;
  platform_user_id: string;
}

/** Instagram handles are alphanumerics, dots and underscores. */
const HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

function normalizeHandle(username: string | null): string | null {
  const handle = username?.trim().replace(/^@+/, "");
  if (!handle || !HANDLE_PATTERN.test(handle)) return null;
  return handle;
}

/**
 * The URL that opens this conversation in the native app, or null when we hold
 * no handle to address it with.
 *
 * Returns null rather than a profile URL on purpose: a button labelled "open
 * chat" that lands on a profile page is worse than an absent button, because
 * the operator only finds out after the context switch.
 */
export function chatDeepLink(source: ChatLinkSource): string | null {
  const handle = normalizeHandle(source.username);
  if (!handle) return null;

  switch (source.platform) {
    case "instagram":
      return `https://ig.me/m/${handle}`;
    case "facebook":
      return `https://m.me/${handle}`;
    default:
      return null;
  }
}
