import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: conversations } = await supabase
    .from("dm_conversations")
    .select("id")
    .is("last_message_direction", null);

  console.log(`${conversations?.length ?? 0} conversations missing last_message_direction.`);

  for (const convo of conversations ?? []) {
    const { data: latest } = await supabase
      .from("dm_messages")
      .select("direction")
      .eq("conversation_id", convo.id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) continue;

    await supabase
      .from("dm_conversations")
      .update({ last_message_direction: latest.direction })
      .eq("id", convo.id);
  }

  console.log("Done.");
}

main();
