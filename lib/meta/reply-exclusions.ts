/**
 * People we never send the automated public comment reply to.
 *
 * Reasons vary and are deliberately not encoded: already handled by hand,
 * asked us to stop, a colleague's account, or someone we spoke to off
 * platform. The list is small and manual on purpose, so adding a name is a
 * decision someone makes rather than a rule that might sweep others in.
 *
 * Matched on the handle, lowercased, since that is what `ig_comments` stores.
 * Keep entries lowercase.
 */
const EXCLUDED_USERNAMES = new Set([
  "tlezjps",
  "ph.rch",
]);

export function isExcludedFromAutoReply(username: string | null | undefined): boolean {
  const handle = username?.trim().toLowerCase();
  return Boolean(handle) && EXCLUDED_USERNAMES.has(handle!);
}
