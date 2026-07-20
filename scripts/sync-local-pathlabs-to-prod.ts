import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: true });

import { createClient } from "@supabase/supabase-js";

const LOCAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const LOCAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROD_URL = process.env.HACKATHON_SUPABASE_URL;
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY;

if (!LOCAL_KEY) {
  console.error("❌ Missing LOCAL_KEY (SUPABASE_SERVICE_ROLE_KEY) in environment");
  process.exit(1);
}

if (!PROD_URL || !PROD_KEY) {
  console.error("❌ Missing HACKATHON_SUPABASE_URL or HACKATHON_SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const localSupabase = createClient(LOCAL_URL, LOCAL_KEY);
const prodSupabase = createClient(PROD_URL, PROD_KEY);

const MAP_IDS = [
  "8d33d3cb-c2d7-4a30-964c-c07c5905ae1e", // AI x Business
  "237549ab-a84e-4e47-b970-1d52e2980e52", // Data Analyst
  "dc3e98b8-dacf-4101-ac4b-71fce033c9ff", // UX/UI Designer
];

// Production Category Mapping
function getProductionCategoryId(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("ai") || lowerTitle.includes("business")) {
    return "eb35ccde-22b2-4a99-be3c-d62fe35a837d"; // Business category in prod
  }
  return "3264387a-42ce-403e-8878-31414dc03098"; // TechSeed category in prod
}

async function syncMap(mapId: string) {
  console.log(`\n==================================================`);
  console.log(`🌀 Syncing Learning Map: ${mapId}`);
  console.log(`==================================================`);

  // 1. Fetch from local DB
  // learning_maps
  const { data: map, error: mapErr } = await localSupabase.from("learning_maps").select("*").eq("id", mapId).single();
  if (mapErr || !map) throw new Error(`Failed to fetch map: ${mapErr?.message}`);

  // seeds
  const { data: seed, error: seedErr } = await localSupabase.from("seeds").select("*").eq("map_id", mapId).single();
  if (seedErr || !seed) throw new Error(`Failed to fetch seed: ${seedErr?.message}`);

  // paths
  const { data: path, error: pathErr } = await localSupabase.from("paths").select("*").eq("seed_id", seed.id).single();
  if (pathErr || !path) throw new Error(`Failed to fetch path: ${pathErr?.message}`);

  // path_days
  const { data: days, error: daysErr } = await localSupabase.from("path_days").select("*").eq("path_id", path.id);
  if (daysErr) throw new Error(`Failed to fetch path_days: ${daysErr.message}`);

  // map_nodes
  const { data: nodes, error: nodesErr } = await localSupabase.from("map_nodes").select("*").eq("map_id", mapId);
  if (nodesErr) throw new Error(`Failed to fetch map_nodes: ${nodesErr.message}`);

  const nodeIds = (nodes || []).map((n) => n.id);

  // node_content
  let contents: any[] = [];
  if (nodeIds.length > 0) {
    const { data, error } = await localSupabase.from("node_content").select("*").in("node_id", nodeIds);
    if (error) throw new Error(`Failed to fetch node_content: ${error.message}`);
    contents = data || [];
  }

  // node_assessments
  let assessments: any[] = [];
  if (nodeIds.length > 0) {
    const { data, error } = await localSupabase.from("node_assessments").select("*").in("node_id", nodeIds);
    if (error) throw new Error(`Failed to fetch node_assessments: ${error.message}`);
    assessments = data || [];
  }

  const assessmentIds = assessments.map((a) => a.id);

  // quiz_questions
  let quizzes: any[] = [];
  if (assessmentIds.length > 0) {
    const { data, error } = await localSupabase.from("quiz_questions").select("*").in("assessment_id", assessmentIds);
    if (error) throw new Error(`Failed to fetch quiz_questions: ${error.message}`);
    quizzes = data || [];
  }

  // node_paths (edges)
  let edges: any[] = [];
  if (nodeIds.length > 0) {
    const { data, error } = await localSupabase.from("node_paths").select("*").in("source_node_id", nodeIds);
    if (error) throw new Error(`Failed to fetch node_paths: ${error.message}`);
    edges = data || [];
  }

  console.log(`📖 Loaded local data:`);
  console.log(`   - Seed: "${seed.title}"`);
  console.log(`   - Days: ${days?.length}, Nodes: ${nodes?.length}, Contents: ${contents.length}, Assessments: ${assessments.length}`);

  // Map seed category ID to valid prod category ID
  const prodSeed = {
    ...seed,
    category_id: getProductionCategoryId(seed.title),
  };

  // 2. Write to Production with foreign key and check dependency order
  // Step 2a. Upsert learning map as private/null to bypass DB check and FK constraints
  const tempMap = { ...map, map_type: "private", parent_seed_id: null };
  const { error: pMapErr } = await prodSupabase.from("learning_maps").upsert(tempMap);
  if (pMapErr) throw new Error(`Prod insert learning_maps (temp) failed: ${pMapErr.message}`);

  // Step 2b. Upsert seed with correct category mapping
  const { error: pSeedErr } = await prodSupabase.from("seeds").upsert(prodSeed);
  if (pSeedErr) throw new Error(`Prod insert seeds failed: ${pSeedErr.message}`);

  // Step 2c. Upsert paths
  const { error: pPathErr } = await prodSupabase.from("paths").upsert(path);
  if (pPathErr) throw new Error(`Prod insert paths failed: ${pPathErr.message}`);

  // Step 2d. Upsert map_nodes
  if (nodes && nodes.length > 0) {
    const { error: pNodesErr } = await prodSupabase.from("map_nodes").upsert(nodes);
    if (pNodesErr) throw new Error(`Prod insert map_nodes failed: ${pNodesErr.message}`);
  }

  // Step 2e. Upsert node_content
  if (contents.length > 0) {
    const { error: pContentErr } = await prodSupabase.from("node_content").upsert(contents);
    if (pContentErr) throw new Error(`Prod insert node_content failed: ${pContentErr.message}`);
  }

  // Step 2f. Upsert node_assessments
  if (assessments.length > 0) {
    const { error: pAssessErr } = await prodSupabase.from("node_assessments").upsert(assessments);
    if (pAssessErr) throw new Error(`Prod insert node_assessments failed: ${pAssessErr.message}`);
  }

  // Step 2g. Upsert quiz_questions
  if (quizzes.length > 0) {
    const { error: pQuizErr } = await prodSupabase.from("quiz_questions").upsert(quizzes);
    if (pQuizErr) throw new Error(`Prod insert quiz_questions failed: ${pQuizErr.message}`);
  }

  // Step 2h. Upsert node_paths (edges)
  if (edges.length > 0) {
    const { error: pEdgeErr } = await prodSupabase.from("node_paths").upsert(edges);
    if (pEdgeErr) throw new Error(`Prod insert node_paths failed: ${pEdgeErr.message}`);
  }

  // Step 2i. Upsert path_days
  if (days && days.length > 0) {
    const { error: pDaysErr } = await prodSupabase.from("path_days").upsert(days);
    if (pDaysErr) throw new Error(`Prod insert path_days failed: ${pDaysErr.message}`);
  }

  // Step 2j. Finalize parent_seed_id & map_type updates on learning map
  const { error: pFinalMapErr } = await prodSupabase
    .from("learning_maps")
    .update({
      map_type: map.map_type,
      parent_seed_id: seed.id,
    })
    .eq("id", mapId);
  if (pFinalMapErr) throw new Error(`Prod finalize learning_maps failed: ${pFinalMapErr.message}`);

  console.log(`🚀 Production DB sync complete for: "${seed.title}"`);
}

async function main() {
  console.log("🌟 Starting Production Database Sync for Expert PathLabs...\n");

  for (const id of MAP_IDS) {
    try {
      await syncMap(id);
    } catch (err: any) {
      console.error(`❌ Failed syncing map ${id}:`, err.message || err);
    }
  }

  console.log("\n🏁 Production database sync complete!");
}

main().catch(console.error);
