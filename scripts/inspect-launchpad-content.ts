import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const s = createAdminClient();
  const { data } = await s
    .from("map_nodes")
    .select("id, title")
    .eq("map_id", "00000000-0000-0000-0000-000000000020");
  for (const n of data ?? []) {
    const { data: c } = await s
      .from("node_content")
      .select("id, content_type, content_title, content_url, display_order")
      .eq("node_id", n.id)
      .order("display_order");
    console.log(n.title);
    for (const row of c ?? [])
      console.log(
        "  ",
        row.display_order,
        row.content_type,
        "| title:",
        row.content_title,
        "| url:",
        row.content_url,
        "| id:",
        row.id
      );
  }
}

main();
