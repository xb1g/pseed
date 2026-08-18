/**
 * Recognises comments authored by our own Instagram account.
 *
 * Instagram delivers a `comments` webhook for every comment on our media —
 * including the replies we post ourselves. Without this check those replies
 * land in `ig_comments` as if a lead had written them, which inflates the
 * admin queue, runs lead classification over our own copy, and (should a
 * commenter ever lack a `dm_conversations` row) lets the bulk reply answer
 * our own comments.
 *
 * Identity is matched on two independent signals because
 * INSTAGRAM_BUSINESS_ACCOUNT_ID is not guaranteed to be set in every
 * environment: when it is absent the username still catches our own rows,
 * and when the handle changes the ID still does.
 */

/** Our handle, lowercased. Kept here so the fallback survives a missing env var. */
const SELF_USERNAME = "passion_seed.th";

function selfAccountId(): string | null {
  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  return id ? id : null;
}

export function isSelfAuthored(author: {
  igUserId?: string | null;
  username?: string | null;
}): boolean {
  const selfId = selfAccountId();
  if (selfId && author.igUserId && author.igUserId === selfId) return true;

  const username = author.username?.trim().toLowerCase();
  return Boolean(username) && username === SELF_USERNAME;
}
