import { createAdminClient } from "../utils/supabase/admin";
import * as fs from "fs";
import * as path from "path";

const OUT_DIR = "/Users/bunyasit/.gemini/antigravity-cli/brain/356db63f-e1b1-4daa-9139-f81286233a36/scratch";

async function main() {
  const supabase = createAdminClient();
  console.log("Fetching conversations...");
  
  // 1. Fetch all conversations (paginated if needed)
  let allConversations: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("dm_conversations")
      .select("*")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error("Error fetching dm_conversations:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allConversations = allConversations.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Fetched ${allConversations.length} conversations.`);

  // 2. Fetch all messages
  let allMessages: any[] = [];
  page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("dm_messages")
      .select("*")
      .order("sent_at", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error("Error fetching dm_messages:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allMessages = allMessages.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Fetched ${allMessages.length} messages.`);

  // 3. Fetch all IG comments
  let allComments: any[] = [];
  page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ig_comments")
      .select("*")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error("Error fetching ig_comments:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allComments = allComments.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Fetched ${allComments.length} comments.`);

  // Join messages to conversations
  const messagesByConvo: Record<string, any[]> = {};
  for (const msg of allMessages) {
    if (!messagesByConvo[msg.conversation_id]) {
      messagesByConvo[msg.conversation_id] = [];
    }
    messagesByConvo[msg.conversation_id].push(msg);
  }

  const enrichedConversations = allConversations.map((c) => ({
    ...c,
    messages: messagesByConvo[c.id] || [],
    message_count: (messagesByConvo[c.id] || []).length,
    inbound_count: (messagesByConvo[c.id] || []).filter((m) => m.direction === "inbound").length,
    outbound_count: (messagesByConvo[c.id] || []).filter((m) => m.direction === "outbound").length,
  }));

  // Save to scratch
  fs.writeFileSync(
    path.join(OUT_DIR, "conversations.json"),
    JSON.stringify(enrichedConversations, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "messages.json"),
    JSON.stringify(allMessages, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "ig_comments.json"),
    JSON.stringify(allComments, null, 2)
  );

  console.log("Successfully exported dataset to", OUT_DIR);
}

main().catch(console.error);
