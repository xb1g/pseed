import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { count: convoCount, error: e1 } = await supabase
    .from("dm_conversations")
    .select("*", { count: "exact", head: true });
  console.log("dm_conversations count:", convoCount, e1);

  const { count: msgCount, error: e2 } = await supabase
    .from("dm_messages")
    .select("*", { count: "exact", head: true });
  console.log("dm_messages count:", msgCount, e2);

  const { count: commentCount, error: e3 } = await supabase
    .from("ig_comments")
    .select("*", { count: "exact", head: true });
  console.log("ig_comments count:", commentCount, e3);
}

main();
