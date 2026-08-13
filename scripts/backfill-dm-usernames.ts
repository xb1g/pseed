/** One-off: resolves username for existing dm_conversations rows that are missing it. */
import { createAdminClient } from "../utils/supabase/admin";
import { getInstagramUsername } from "../lib/meta/graph";

async function main() {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("dm_conversations")
    .select("id, platform_user_id")
    .eq("platform", "instagram")
    .is("username", null);

  if (error) throw error;
  console.log(`${rows?.length ?? 0} conversations missing username.`);

  for (const row of rows ?? []) {
    const username = await getInstagramUsername(row.platform_user_id);
    if (!username) {
      console.log(`  ${row.platform_user_id}: no username resolved`);
      continue;
    }
    await supabase.from("dm_conversations").update({ username }).eq("id", row.id);
    console.log(`  ${row.platform_user_id} -> ${username}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
