/**
 * Message-level pattern matching for the DM lead playbook.
 *
 * Pure module — takes rows of `dm_messages` and reduces them into the
 * `DmLeadSignals` that `classifyBucket()` consumes. Kept separate from the data
 * layer so the matchers are unit-testable and can run anywhere (a script, the
 * client) without a Supabase client.
 */

import { EMPTY_SIGNALS, type DmLeadSignals } from "@/lib/dm-leads/playbook";
import type { DmMessageDirection } from "@/types/dm-leads";

/** The only columns of `dm_messages` any signal depends on. */
export interface DmMessageSignalRow {
  conversation_id: string;
  direction: DmMessageDirection;
  body: string | null;
  sent_at: string | null;
}

function latestTimestamp(
  current: string | null,
  candidate: string | null
): string | null {
  if (!candidate) return current;
  const candidateTime = Date.parse(candidate);
  if (Number.isNaN(candidateTime)) return current;
  if (!current || candidateTime > Date.parse(current)) return candidate;
  return current;
}

/**
 * A price is stated either as one of the four numbers we actually charge, or in
 * Thai words. The number matcher is bounded by non-digits so "1299" or a phone
 * number fragment does not read as "299".
 */
const PRICE_NUMBER_PATTERN = /(^|[^\d])(299|999|490|1,?000)([^\d]|$)/;
const PRICE_WORD_PATTERN = /ราคา|ค่าใช้จ่าย|บาท/;

/** A `/pathlab` URL, sent by us. */
const PATHLAB_LINK_PATTERN = /\/pathlab/i;

/**
 * We pitched *something*, even without a link or a number: the camp, PathLab by
 * name, or the "5 วัน" shape of the offer.
 */
const OFFER_PATTERN = /ค่าย|pathlab|โปรเจกต์\s*5\s*วัน|4\s*[-–]\s*5\s*วัน/i;

export function mentionsPrice(body: string): boolean {
  return PRICE_NUMBER_PATTERN.test(body) || PRICE_WORD_PATTERN.test(body);
}

export function mentionsPathlabLink(body: string): boolean {
  return PATHLAB_LINK_PATTERN.test(body);
}

export function mentionsOffer(body: string): boolean {
  return OFFER_PATTERN.test(body);
}

/**
 * The three matcher results for one message body, direction-agnostic.
 *
 * Written onto `dm_messages` at insert time so the per-conversation rollup can
 * be a plain SQL aggregate instead of shipping every message body to Node on
 * every request. Keeping the matchers here — rather than porting the regexes
 * into Postgres — is deliberate: `deriveSignalsFromMessages` below and the bulk
 * path must never disagree about a bucket, and two copies of these patterns in
 * two languages is exactly how that starts.
 *
 * Direction rules (a link only counts from us, a price counts from either side)
 * live in the aggregate, not here, so the stored flags stay raw.
 *
 * Editing any pattern above means re-running `scripts/backfill-message-signals.mjs`.
 */
export interface MessageSignalFlags {
  signal_price: boolean;
  signal_pathlab_link: boolean;
  signal_offer: boolean;
}

export function messageSignalFlags(body: string | null | undefined): MessageSignalFlags {
  const text = body ?? "";
  return {
    signal_price: mentionsPrice(text),
    signal_pathlab_link: mentionsPathlabLink(text),
    signal_offer: mentionsOffer(text),
  };
}

/**
 * Folds every message into one `DmLeadSignals` per conversation. Conversations
 * with no messages are absent from the map — callers fall back to
 * `EMPTY_SIGNALS`.
 */
export function reduceMessagesToSignals(
  rows: DmMessageSignalRow[]
): Map<string, DmLeadSignals> {
  const signals = new Map<string, DmLeadSignals>();

  for (const row of rows) {
    const current = signals.get(row.conversation_id) ?? { ...EMPTY_SIGNALS };
    const flags = messageSignalFlags(row.body);
    const outbound = row.direction === "outbound";

    if (row.direction === "inbound") {
      current.hasInbound = true;
      current.lastInboundMessageAt = latestTimestamp(
        current.lastInboundMessageAt,
        row.sent_at
      );
    }
    if (outbound && flags.signal_pathlab_link) current.pathlabLinkSent = true;
    // Price counts from either side — the lead asking "เท่าไหร่ครับ" means the
    // number is on the table, which is what the "hot" bucket is about.
    if (flags.signal_price) current.priceMentioned = true;
    if (outbound && flags.signal_offer) current.offerMade = true;

    signals.set(row.conversation_id, current);
  }

  // A link or a price is itself an offer, whatever the wording was.
  for (const value of signals.values()) {
    value.offerMade = value.offerMade || value.pathlabLinkSent || value.priceMentioned;
  }

  return signals;
}

export function signalsFor(
  signals: Map<string, DmLeadSignals>,
  conversationId: string
): DmLeadSignals {
  return signals.get(conversationId) ?? EMPTY_SIGNALS;
}

/**
 * Single-thread variant for callers that already hold the messages — the admin
 * detail pane, which must never open its own DB connection. Same matchers as
 * the bulk path, so a lead's bucket cannot differ between list and detail.
 */
export function deriveSignalsFromMessages(
  messages: Pick<DmMessageSignalRow, "direction" | "body" | "sent_at">[] | undefined
): DmLeadSignals {
  if (!messages?.length) return EMPTY_SIGNALS;

  const rows = messages.map((message) => ({ ...message, conversation_id: "single" }));
  return signalsFor(reduceMessagesToSignals(rows), "single");
}
