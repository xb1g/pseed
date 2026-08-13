/** Prints commenters the DM automation never reached (see getCommentsMissedByDm). */
import { getCommentsMissedByDm } from "../lib/supabase/ig-comments";

async function main() {
  const missed = await getCommentsMissedByDm();
  console.log(`${missed.length} commenters never received a DM (within 7-day window):\n`);
  for (const c of missed) {
    console.log(`- ${c.username ?? c.ig_user_id} [${c.stage}] "${c.text.slice(0, 60)}" @ ${c.commented_at}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
