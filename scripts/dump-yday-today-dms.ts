/**
 * Dumps all conversations with messages that received any inbound traffic on
 * 2026-08-18 (yesterday) or 2026-08-19 (today, UTC). Each conversation gets
 * its full message thread, sorted oldest first, so we can read end-to-end.
 *
 * Output is a single JSON file at /tmp/dm-yday-today.json. Read this file
 * directly when reviewing why leads are not converting.
 */
import { writeFileSync } from "fs";
import { createAdminClient } from "../utils/supabase/admin";

const OUT = process.env.OUT || "/tmp/dm-yday-today.json";

const YESTERDAY_UTC_START = "2026-08-18T00:00:00.000Z";
const TODAY_UTC_END = "2026-08-19T23:59:59.999Z";

async function fetchPage<T>(
  supabase: ReturnType<typeof createAdminClient>,
  table: "dm_conversations" | "dm_messages",
  select: string,
  rangeFrom: number,
  rangeTo: number,
  order: { column: string; ascending: boolean }
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order(order.column, { ascending: order.ascending })
    .range(rangeFrom, rangeTo);
  if (error) throw error;
  return (data ?? []) as T[];
}

async function fetchAll<T>(
  supabase: ReturnType<typeof createAdminClient>,
  table: "dm_conversations" | "dm_messages",
  select: string,
  order: { column: string; ascending: boolean }
): Promise<T[]> {
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const page = await fetchPage<T>(supabase, table, select, from, from + PAGE - 1, order);
    if (!page.length) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

async function main() {
  const supabase = createAdminClient();

  console.log("Pulling conversations...");
  const conversations = await fetchAll<any>(
    supabase,
    "dm_conversations",
    "*",
    { column: "last_message_at", ascending: false }
  );
  console.log(`  total conversations: ${conversations.length}`);

  console.log("Pulling all messages...");
  const messages = await fetchAll<any>(
    supabase,
    "dm_messages",
    "id, conversation_id, direction, sender_type, body, sent_at, message_type, send_status, delivered_at, read_at",
    { column: "sent_at", ascending: true }
  );
  console.log(`  total messages: ${messages.length}`);

  const messagesByConvo: Record<string, any[]> = {};
  for (const msg of messages) {
    if (!messagesByConvo[msg.conversation_id]) messagesByConvo[msg.conversation_id] = [];
    messagesByConvo[msg.conversation_id].push(msg);
  }

  const ydayStartMs = Date.parse(YESTERDAY_UTC_START);
  const todayEndMs = Date.parse(TODAY_UTC_END);

  const window = conversations.filter((c) => {
    const t = c.last_message_at ? Date.parse(c.last_message_at) : 0;
    return t >= ydayStartMs && t <= todayEndMs;
  });
  console.log(`  conversations active in window: ${window.length}`);

  const enriched = window
    .map((c) => {
      const msgs = messagesByConvo[c.id] ?? [];
      const inbound = msgs.filter((m) => m.direction === "inbound");
      const outbound = msgs.filter((m) => m.direction === "outbound");
      const inboundBodies = inbound.map((m) => (m.body ?? "").trim()).filter(Boolean);
      const outboundBodies = outbound.map((m) => (m.body ?? "").trim()).filter(Boolean);
      const firstInboundAt = inbound[0]?.sent_at ?? null;
      const lastInboundAt = inbound[inbound.length - 1]?.sent_at ?? null;
      const lastOutboundAt = outbound[outbound.length - 1]?.sent_at ?? null;

      return {
        id: c.id,
        platform: c.platform,
        username: c.username,
        display_name: c.display_name,
        stage: c.stage,
        status: c.status,
        admin_tags: c.admin_tags,
        lead_score: c.lead_score,
        wants_pathlab: c.wants_pathlab,
        wants_community: c.wants_community,
        wants_talent: c.wants_talent,
        pathlab_pay_ready: c.pathlab_pay_ready,
        interests: c.interests,
        classification: c.classification,
        last_message_at: c.last_message_at,
        last_message_direction: c.last_message_direction,
        created_at: c.created_at,
        updated_at: c.updated_at,
        inbound_count: inbound.length,
        outbound_count: outbound.length,
        first_inbound_at: firstInboundAt,
        last_inbound_at: lastInboundAt,
        last_outbound_at: lastOutboundAt,
        messages: msgs,
      };
    })
    .sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at));

  writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), window: { from: YESTERDAY_UTC_START, to: TODAY_UTC_END }, conversations: enriched }, null, 2));
  console.log(`Wrote ${enriched.length} conversations -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
