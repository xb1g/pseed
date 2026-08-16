const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Meta's HUMAN_AGENT tag extends the reply window to 7 days, but only for a
 * real human answering a user's question — never automation. Every send we
 * tag this way originates from an admin typing in the inbox, which is exactly
 * the case the tag exists for.
 */
const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Meta's Send API rejects a `messaging_type: RESPONSE` message once more
 * than 24h have passed since the lead's LAST INBOUND message — our own
 * replies never extend the window. This app's follow_up_at reminders
 * actively encourage replying after that window closes, so a send can
 * legitimately fail here; this lets callers warn before attempting it
 * instead of surfacing an opaque Graph API error.
 *
 * Deliberately takes the last-inbound-message timestamp directly rather
 * than the conversation's last_message_at/last_message_direction — those
 * flip to "outbound" as soon as we reply once, which would make a stale
 * thread look open again even though the lead's own message is >24h old.
 */
export function isWithinMessagingWindow(
  lastInboundMessageAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  return elapsedSinceInbound(lastInboundMessageAt, now) < WINDOW_MS;
}

/**
 * How a send to this thread must be tagged, given how long the lead has been
 * silent. Replying by hand in the Instagram app is unaffected by any of this —
 * the windows below are Send API restrictions only.
 *
 *   standard     <24h    normal `messaging_type: RESPONSE`
 *   human_agent  24h-7d  `MESSAGE_TAG` + `HUMAN_AGENT`, human-typed replies only
 *   closed       >7d     no compliant API route; the lead must message first
 */
export type MessagingWindowMode = "standard" | "human_agent" | "closed";

export function getMessagingWindowMode(
  lastInboundMessageAt: string | null | undefined,
  now: number = Date.now()
): MessagingWindowMode {
  const elapsed = elapsedSinceInbound(lastInboundMessageAt, now);
  if (elapsed < WINDOW_MS) return "standard";
  if (elapsed < HUMAN_AGENT_WINDOW_MS) return "human_agent";
  return "closed";
}

/**
 * Milliseconds since the lead last wrote to us. Returns Infinity when there is
 * no usable timestamp so every caller treats "unknown" as "closed" rather than
 * as "wide open" — the safe direction for a send guard.
 */
function elapsedSinceInbound(
  lastInboundMessageAt: string | null | undefined,
  now: number
): number {
  if (!lastInboundMessageAt) return Number.POSITIVE_INFINITY;
  const elapsed = now - new Date(lastInboundMessageAt).getTime();
  if (Number.isNaN(elapsed)) return Number.POSITIVE_INFINITY;
  return elapsed;
}
