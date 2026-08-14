const WINDOW_MS = 24 * 60 * 60 * 1000;

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
export function isWithinMessagingWindow(lastInboundMessageAt: string | null | undefined): boolean {
  if (!lastInboundMessageAt) return false;
  const elapsed = Date.now() - new Date(lastInboundMessageAt).getTime();
  if (Number.isNaN(elapsed)) return false;
  return elapsed < WINDOW_MS;
}
