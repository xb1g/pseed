import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: convos } = await supabase
    .from("dm_conversations")
    .select("username, created_at, last_message_at")
    .order("created_at", { ascending: true })
    .limit(10);
  console.log("Oldest 10 dm_conversations by created_at:");
  console.log(convos);

  const { data: convosNewest } = await supabase
    .from("dm_conversations")
    .select("username, created_at, last_message_at")
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("\nNewest 10 dm_conversations by created_at:");
  console.log(convosNewest);

  const { data: msgs } = await supabase
    .from("dm_messages")
    .select("direction, sent_at, created_at")
    .order("sent_at", { ascending: false })
    .limit(15);
  console.log("\nNewest 15 dm_messages by sent_at:");
  console.log(msgs);
}

main();
