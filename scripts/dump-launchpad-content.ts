/**
 * Dump the LaunchPad: Startup Sprint map's full story/content tree to
 * artifacts/launchpad-content-dump.json for review and rewrite planning.
 *
 * Run: npx tsx scripts/dump-launchpad-content.ts
 */
import { writeFileSync } from "fs";
import { createAdminClient } from "../utils/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: maps, error: mapErr } = await supabase
    .from("learning_maps")
    .select("id, title, description")
    .ilike("title", "%launchpad%");
  if (mapErr) throw mapErr;
  if (!maps?.length) {
    console.error("No LaunchPad map found");
    process.exit(1);
  }
  console.log("Maps found:", maps.map((m) => `${m.id} ${m.title}`));

  const dump: Record<string, unknown> = { maps };

  for (const map of maps) {
    // Legacy node system
    const { data: nodes } = await supabase
      .from("map_nodes")
      .select("id, title, instructions, difficulty")
      .eq("map_id", map.id)
      .order("created_at", { ascending: true });

    const nodeContent = [];
    for (const node of nodes ?? []) {
      const { data: content } = await supabase
        .from("node_content")
        .select("id, content_type, content_title, content_body")
        .eq("node_id", node.id);
      nodeContent.push({ ...node, content });
    }

    // Seed/PathLab system
    const { data: seeds } = await supabase
      .from("seeds")
      .select("id, title, description, seed_type")
      .eq("map_id", map.id);

    const pathsDump = [];
    for (const seed of seeds ?? []) {
      const { data: paths } = await supabase
        .from("paths")
        .select(
          `id, total_days,
           path_days (
             id, day_number, context_text, reflection_prompts,
             path_activities (
               id, title, instructions, display_order, is_draft,
               path_content (id, content_type, content_title, content_body, display_order)
             )
           )`
        )
        .eq("seed_id", seed.id);
      pathsDump.push({ seed, paths });
    }

    dump[map.id] = { title: map.title, nodeContent, pathsDump };
  }

  writeFileSync(
    "artifacts/launchpad-content-dump.json",
    JSON.stringify(dump, null, 2)
  );
  console.log("Wrote artifacts/launchpad-content-dump.json");
}

main();
