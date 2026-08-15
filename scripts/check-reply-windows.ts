import { createAdminClient } from "../utils/supabase/admin";
import { isWithinMessagingWindow } from "../lib/dm-leads/messaging-window";

/**
 * "Which leads can I still reply to right now?"
 *
 * Meta rejects a `messaging_type: RESPONSE` send once 24h have passed since the
 * lead's LAST INBOUND message. Our own replies never reopen that window, so a
 * thread that looks active in the inbox can still be unreachable. This prints
 * the hot-lead list sorted by how much window is left, so a manual reply push
 * starts with the threads that are about to close.
 *
 * Usage:
 *   pnpm dotenv -e .env.local -o -- tsx scripts/check-reply-windows.ts
 *   pnpm dotenv -e .env.local -o -- tsx scripts/check-reply-windows.ts handle1 handle2
 */

/** The 11 real hot leads from docs/research/2026-08-14-top-lead-thread-analysis.md. */
const DEFAULT_HANDLES = [
  "phichyachumwngs",
  "burhnsoul",
  "studygimpi",
  "mzai_mzai1",
  "puynoonpn_3",
  "potato_sweetheart8",
  "beau_t.i",
  "gampun_inwza007",
  "peaceful22_8",
  "phuwxdx.n",
  "pat1107_nni",
];

const WINDOW_MS = 24 * 60 * 60 * 1000;

function formatRemaining(lastInboundAt: string | null): string {
  if (!lastInboundAt) return "no inbound message on record";
  const elapsed = Date.now() - new Date(lastInboundAt).getTime();
  if (Number.isNaN(elapsed)) return "unparseable timestamp";

  const remaining = WINDOW_MS - elapsed;
  if (remaining <= 0) {
    const hoursOver = Math.floor(-remaining / 3_600_000);
    return `CLOSED ${hoursOver}h ago`;
  }
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m left`;
}

async function main() {
  const handles = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_HANDLES;
  const supabase = createAdminClient();

  const { data: conversations, error } = await supabase
    .from("dm_conversations")
    .select("id, username, lead_status")
    .in("username", handles);

  if (error) {
    console.error("Failed to load conversations:", error.message);
    process.exit(1);
  }

  const rows: {
    handle: string;
    lastInboundAt: string | null;
    open: boolean;
  }[] = [];

  for (const handle of handles) {
    const conversation = conversations?.find((c) => c.username === handle);
    if (!conversation) {
      rows.push({ handle, lastInboundAt: null, open: false });
      continue;
    }

    // Latest inbound message only. `last_message_at` on the conversation flips
    // to our own outbound reply and would make a dead thread look open.
    const { data: lastInbound } = await supabase
      .from("dm_messages")
      .select("sent_at")
      .eq("conversation_id", conversation.id)
      .eq("direction", "inbound")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastInboundAt = lastInbound?.sent_at ?? null;
    rows.push({
      handle,
      lastInboundAt,
      open: isWithinMessagingWindow(lastInboundAt),
    });
  }

  // Closing soonest first: that is the order a manual reply push should follow.
  const open = rows
    .filter((r) => r.open)
    .sort(
      (a, b) =>
        new Date(a.lastInboundAt!).getTime() -
        new Date(b.lastInboundAt!).getTime()
    );
  const closed = rows.filter((r) => !r.open);

  console.log(`\nChecked ${rows.length} leads at ${new Date().toISOString()}\n`);

  console.log(`REPLY NOW (${open.length}) - window still open, soonest to close first:`);
  if (open.length === 0) console.log("  (none)");
  for (const r of open) {
    console.log(`  ${r.handle.padEnd(22)} ${formatRemaining(r.lastInboundAt)}`);
  }

  console.log(`\nWINDOW CLOSED (${closed.length}) - normal reply will be rejected by Meta:`);
  if (closed.length === 0) console.log("  (none)");
  for (const r of closed) {
    console.log(`  ${r.handle.padEnd(22)} ${formatRemaining(r.lastInboundAt)}`);
  }
  console.log("");
}

main();
