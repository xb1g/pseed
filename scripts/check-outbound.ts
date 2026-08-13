import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const { count: outbound } = await supabase
    .from("dm_messages")
    .select("*", { count: "exact", head: true })
    .eq("direction", "outbound");
  const { count: inbound } = await supabase
    .from("dm_messages")
    .select("*", { count: "exact", head: true })
    .eq("direction", "inbound");
  console.log(`outbound: ${outbound}, inbound: ${inbound}`);

  const { data: sample } = await supabase
    .from("dm_conversations")
    .select("username, dm_messages(direction, body)")
    .not("username", "is", null)
    .limit(3);
  for (const c of sample ?? []) {
    console.log(`${c.username}: ${(c.dm_messages as { direction: string }[]).length} messages, directions: ${(c.dm_messages as { direction: string }[]).map((m) => m.direction).join(",")}`);
  }
}
main();
