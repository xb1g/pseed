/**
 * Shared between the server action and the client card.
 *
 * A "use server" module may only export async functions, so the cap cannot
 * live in actions.ts and still be read by the UI. Keeping it here lets the
 * button state the real batch size instead of repeating a literal that drifts.
 */

/**
 * Replies posted per run. Sized against `maxDuration` on the page: 50 replies
 * a second apart plus Graph round trips runs near 100s, inside a 300s budget.
 * Raising this without raising that budget truncates the batch mid-run, which
 * is how a "reply to 50" click ended up posting four.
 */
export const BULK_REPLY_BATCH_CAP = 50;
