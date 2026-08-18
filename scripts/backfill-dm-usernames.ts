/** One-off: resolves Instagram display names and usernames for existing DM leads. */
import { createAdminClient } from "../utils/supabase/admin";
import { getInstagramProfile } from "../lib/meta/graph";

async function main() {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("dm_conversations")
    .select("id, platform_user_id, username, display_name")
    .eq("platform", "instagram")
    .or("username.is.null,display_name.is.null");

  if (error) throw error;
  console.log(`${rows?.length ?? 0} conversations missing an Instagram profile field.`);

  for (const row of rows ?? []) {
    const profile = await getInstagramProfile(row.platform_user_id);
    if (!profile.username && !profile.displayName) {
      console.log(`  ${row.platform_user_id}: no profile resolved`);
      continue;
    }
    const patch = {
      ...(profile.username ? { username: profile.username } : {}),
      ...(profile.displayName ? { display_name: profile.displayName } : {}),
    };
    await supabase.from("dm_conversations").update(patch).eq("id", row.id);
    console.log(`  ${row.platform_user_id} -> ${profile.displayName ?? row.display_name ?? "(no name)"} (${profile.username ?? row.username ?? "no username"})`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
