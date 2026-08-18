/**
 * Retires our own replies that were stored as leads in `ig_comments` before
 * the webhook learned to skip them (see lib/meta/self-account.ts).
 *
 * Sets `replied_at` rather than deleting: the rows leave the missed-DM queue
 * and the admin working list, but the record survives and the change can be
 * undone. Pass --apply to write; the default is a dry run.
 */
import { createClient } from "@supabase/supabase-js";
import { isSelfAuthored } from "../lib/meta/self-account";

/**
 * Targets production directly. createAdminClient() reads
 * NEXT_PUBLIC_SUPABASE_URL, which points at the retired local Supabase, so
 * this script uses the HACKATHON_* pair that holds the live credentials.
 */
function productionClient() {
  const url = process.env.HACKATHON_SUPABASE_URL;
  const key = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing HACKATHON_SUPABASE_URL / HACKATHON_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = productionClient();

  // PostgREST caps a response at 1000 rows, so page until a short page
  // arrives; a single select would silently miss everything past the cap.
  const PAGE = 1000;
  const rows: Array<{
    id: string;
    username: string | null;
    ig_user_id: string | null;
    text: string;
    replied_at: string | null;
    commented_at: string;
  }> = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("ig_comments")
      .select("id, username, ig_user_id, text, replied_at, commented_at")
      .order("commented_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to read ig_comments: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  const self = rows.filter((row) =>
    isSelfAuthored({ igUserId: row.ig_user_id, username: row.username })
  );
  const pending = self.filter((row) => !row.replied_at);

  console.log(`ig_comments rows        : ${rows.length}`);
  console.log(`authored by us          : ${self.length}`);
  console.log(`of those, not yet marked: ${pending.length}`);

  if (pending.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  console.log("\nrows that would be marked replied:");
  for (const row of pending.slice(0, 20)) {
    console.log(`  ${row.commented_at}  ${row.username ?? row.ig_user_id}  "${row.text.slice(0, 50)}"`);
  }
  if (pending.length > 20) console.log(`  ... and ${pending.length - 20} more`);

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("ig_comments")
    .update({ replied_at: now })
    .in("id", pending.map((row) => row.id));
  if (updateError) throw new Error(`Failed to update: ${updateError.message}`);

  console.log(`\nMarked ${pending.length} of our own comments as replied.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
