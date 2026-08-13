/** Re-runs classifyConversationText over all existing leads/comments with the improved regex. */
import { createAdminClient } from "../utils/supabase/admin";
import { applyClassification } from "../lib/supabase/dm-leads";
import { applyCommentClassification } from "../lib/supabase/ig-comments";
import { classifyConversationText } from "../lib/meta/classify";

async function main() {
  const supabase = createAdminClient();

  const { count: convoCount } = await supabase
    .from("dm_conversations")
    .select("id", { count: "exact", head: true });
  const { data: conversations } = await supabase.from("dm_conversations").select("id").limit(2000);
  console.log(`Total conversations in table: ${convoCount}. Fetched: ${conversations?.length ?? 0}`);
  let changed = 0;
  for (const convo of conversations ?? []) {
    try {
      const { data: messages } = await supabase
        .from("dm_messages")
        .select("body, direction")
        .eq("conversation_id", convo.id)
        .eq("direction", "inbound");

      const bodies = (messages ?? []).map((m) => m.body);
      const classification = classifyConversationText(bodies);
      await applyClassification(convo.id, classification);
      changed += 1;
    } catch (error) {
      console.error(`  skipped conversation ${convo.id}:`, error instanceof Error ? error.message : error);
    }
  }
  console.log(`Reclassified ${changed} conversations.`);

  const { count: commentCount } = await supabase
    .from("ig_comments")
    .select("id", { count: "exact", head: true });
  const { data: comments } = await supabase.from("ig_comments").select("id, text").limit(2000);
  console.log(`Total comments in table: ${commentCount}. Fetched: ${comments?.length ?? 0}`);
  let commentsChanged = 0;
  for (const comment of comments ?? []) {
    try {
      const classification = classifyConversationText([comment.text]);
      await applyCommentClassification(comment.id, classification);
      commentsChanged += 1;
    } catch (error) {
      console.error(`  skipped comment ${comment.id}:`, error instanceof Error ? error.message : error);
    }
  }
  console.log(`Reclassified ${commentsChanged} comments.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
