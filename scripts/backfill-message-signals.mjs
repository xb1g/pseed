/**
 * Backfills dm_messages.signal_* for rows written before the columns existed.
 *
 * The matchers live in TypeScript (lib/dm-leads/signals.ts) and now run on the
 * write path, so this only has to catch up history — and has to be re-run after
 * any edit to those patterns, since the stored flags are a cache of them.
 *
 * Idempotent: recomputes and writes every row, so a partial run is safe to
 * repeat. Run with `node scripts/backfill-message-signals.mjs`.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Kept byte-identical to lib/dm-leads/signals.ts. This script is plain .mjs so
// it can run without a TS build step; if you change a pattern there, change it
// here in the same commit.
const PRICE_NUMBER_PATTERN = /(^|[^\d])(299|999|490|1,?000)([^\d]|$)/;
const PRICE_WORD_PATTERN = /ราคา|ค่าใช้จ่าย|บาท/;
const PATHLAB_LINK_PATTERN = /\/pathlab/i;
const OFFER_PATTERN = /ค่าย|pathlab|โปรเจกต์\s*5\s*วัน|4\s*[-–]\s*5\s*วัน/i;

function flagsFor(body) {
  const text = body ?? "";
  return {
    signal_price: PRICE_NUMBER_PATTERN.test(text) || PRICE_WORD_PATTERN.test(text),
    signal_pathlab_link: PATHLAB_LINK_PATTERN.test(text),
    signal_offer: OFFER_PATTERN.test(text),
  };
}

const PAGE_SIZE = 1000;
const supabase = createClient(supabaseUrl, supabaseKey);

let scanned = 0;
let changed = 0;

for (let offset = 0; ; offset += PAGE_SIZE) {
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, body, signal_price, signal_pathlab_link, signal_offer")
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error("❌ Failed to read dm_messages:", error.message);
    process.exit(1);
  }

  const page = data ?? [];
  scanned += page.length;

  const updates = page
    .map((row) => ({ id: row.id, ...flagsFor(row.body) }))
    .filter((next) => {
      const row = page.find((r) => r.id === next.id);
      return (
        row.signal_price !== next.signal_price ||
        row.signal_pathlab_link !== next.signal_pathlab_link ||
        row.signal_offer !== next.signal_offer
      );
    });

  for (const update of updates) {
    const { id, ...flags } = update;
    const { error: updateError } = await supabase
      .from("dm_messages")
      .update(flags)
      .eq("id", id);
    if (updateError) {
      console.error(`❌ Failed to update message ${id}:`, updateError.message);
      process.exit(1);
    }
    changed += 1;
  }

  console.log(`  scanned ${scanned}, updated ${changed}`);
  if (page.length < PAGE_SIZE) break;
}

console.log(`✅ Done. ${scanned} messages scanned, ${changed} updated.`);
