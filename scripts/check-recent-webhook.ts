import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: convos } = await supabase
    .from("dm_conversations")
    .select("username, created_at, updated_at, last_message_at")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log("Most recent dm_conversations by created_at:");
  console.log(convos);

  const { data: comments } = await supabase
    .from("ig_comments")
    .select("username, created_at, commented_at")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log("\nMost recent ig_comments by created_at:");
  console.log(comments);

  console.log("\nNow:", new Date().toISOString());
}

main();
