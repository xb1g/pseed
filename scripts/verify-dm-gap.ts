/** Double-checks getCommentsMissedByDm() by also matching on username, not just ig_user_id. */
import { createAdminClient } from "../utils/supabase/admin";
import { getCommentsMissedByDm } from "../lib/supabase/ig-comments";

async function main() {
  const missed = await getCommentsMissedByDm();
  const supabase = createAdminClient();

  const { data: allConvos, error } = await supabase
    .from("dm_conversations")
    .select("platform_user_id, username, platform")
    .eq("platform", "instagram");

  if (error) throw error;

  const convoUsernames = new Set(
    (allConvos ?? []).map((c) => c.username?.toLowerCase()).filter(Boolean)
  );
  const convoIds = new Set((allConvos ?? []).map((c) => c.platform_user_id));

  console.log(`Total instagram dm_conversations rows: ${allConvos?.length ?? 0}`);
  console.log(`Candidates from ID-based gap check: ${missed.length}`);

  const falsePositives = missed.filter(
    (c) => c.username && convoUsernames.has(c.username.toLowerCase())
  );
  const idMismatchButUsernameMatch = missed.filter(
    (c) => c.ig_user_id && !convoIds.has(c.ig_user_id) && c.username && convoUsernames.has(c.username.toLowerCase())
  );

  console.log(`\nCandidates whose username DOES appear in dm_conversations (would exclude these): ${falsePositives.length}`);
  for (const c of falsePositives) {
    console.log(`  - ${c.username} (ig_user_id=${c.ig_user_id})`);
  }

  console.log(`\nSafe-to-send count: ${missed.length - falsePositives.length}`);

  // also sanity check: how many distinct ig_user_id among missed vs distinct username
  const distinctIds = new Set(missed.map((c) => c.ig_user_id));
  const distinctUsernames = new Set(missed.map((c) => c.username?.toLowerCase()));
  console.log(`\nDistinct ig_user_id in missed set: ${distinctIds.size}`);
  console.log(`Distinct username in missed set: ${distinctUsernames.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
