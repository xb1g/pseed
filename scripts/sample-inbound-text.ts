import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: messages } = await supabase
    .from("dm_messages")
    .select("body")
    .eq("direction", "inbound")
    .order("sent_at", { ascending: false })
    .limit(500);

  const { data: comments } = await supabase
    .from("ig_comments")
    .select("text")
    .order("commented_at", { ascending: false })
    .limit(500);

  const allText = [
    ...(messages ?? []).map((m) => m.body),
    ...(comments ?? []).map((c) => c.text),
  ];

  // dedupe, drop pure "Port" triggers, print unique longer texts
  const seen = new Set<string>();
  const interesting = allText.filter((t) => {
    const norm = t.trim().toLowerCase();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return norm.length > 3 && norm !== "port" && norm !== "port.";
  });

  console.log(`Total: ${allText.length}, unique non-trivial: ${interesting.length}\n`);
  for (const t of interesting) {
    console.log("---");
    console.log(t);
  }
}

main();
