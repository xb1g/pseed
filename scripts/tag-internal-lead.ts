/**
 * Tags a DM lead as `internal` (founder, team accounts): the admin views then
 * exclude the thread, and stale intent flags from the classifier are cleared.
 *
 * Usage: pnpm tag:internal-lead <username>
 */
import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const username = process.argv[2]?.trim();
  if (!username) {
    console.error("Usage: pnpm tag:internal-lead <username>");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("dm_conversations")
    .select("id, username, admin_tags")
    .ilike("username", username);

  if (error) throw error;
  if (!rows || rows.length === 0) {
    console.error(`No dm_conversations found for username "${username}".`);
    process.exit(1);
  }

  for (const row of rows) {
    const tags = new Set(row.admin_tags ?? []);
    tags.add("internal");

    const { error: updateError } = await supabase
      .from("dm_conversations")
      .update({
        admin_tags: [...tags],
        wants_pathlab: false,
        pathlab_pay_ready: false,
        wants_community: false,
        wants_talent: false,
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
    console.log(
      `@${row.username} (${row.id}): admin_tags=[${[...tags].join(", ")}], intent flags cleared.`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
