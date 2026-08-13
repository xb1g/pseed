import { writeFileSync } from "fs";
import { createAdminClient } from "../utils/supabase/admin";

const OUT = process.env.DUMP_OUT || "/tmp/dm-dump.json";

async function fetchAll<T>(
  table: string,
  columns: string,
  order: { column: string; ascending: boolean },
): Promise<T[]> {
  const supabase = createAdminClient();
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order.column, { ascending: order.ascending })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const conversations = await fetchAll(
    "dm_conversations",
    "*",
    { column: "last_message_at", ascending: false },
  );
  const messages = await fetchAll(
    "dm_messages",
    "id,conversation_id,direction,sender_type,body,sent_at",
    { column: "sent_at", ascending: true },
  );
  let comments: unknown[] = [];
  try {
    comments = await fetchAll("ig_comments", "*", {
      column: "created_at",
      ascending: false,
    });
  } catch (error) {
    console.error("ig_comments skipped:", error);
  }

  writeFileSync(OUT, JSON.stringify({ conversations, messages, comments }, null, 2));
  console.log(
    `conversations=${conversations.length} messages=${messages.length} comments=${comments.length} -> ${OUT}`,
  );
}

main();
