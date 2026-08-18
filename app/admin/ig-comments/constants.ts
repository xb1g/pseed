/**
 * Shared between the server action and the client card.
 *
 * A "use server" module may only export async functions, so the cap cannot
 * live in actions.ts and still be read by the UI. Keeping it here lets the
 * button state the real batch size instead of repeating a literal that drifts.
 */

/**
 * Replies posted per run.
 *
 * The plan caps a serverless function at 60s. Observed sends run about 2s each
 * including the 1s spacing, so 15 replies is roughly 30s: half the budget,
 * leaving room for a slow Graph response without truncating the run. Raising
 * this without raising `maxDuration` on the page is what turned an earlier
 * "reply to 50" click into four replies and a 504.
 *
 * A queue longer than one pass is handled by the card running the action again
 * rather than by making any single run longer.
 */
export const BULK_REPLY_BATCH_CAP = 15;
