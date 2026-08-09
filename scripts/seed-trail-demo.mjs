// Seeds a real "Trail Demo" map into the LOCAL Supabase dev database so the
// trail-view prototype (/map/<id>/trail) can be tested end-to-end:
// open node -> view content -> submit quiz assessment -> auto-grade -> advance.
//
// Usage:
//   set -a; source .env.local; set +a; node scripts/seed-trail-demo.mjs
//
// Idempotent: every row uses a fixed UUID and is upserted on its primary key,
// so re-running never duplicates data. INSERTS/UPSERTS ONLY — never deletes.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "   Run with: set -a; source .env.local; set +a; node scripts/seed-trail-demo.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Fixed UUIDs -----------------------------------------------------------
const MAP_ID = "00000000-0000-0000-0000-000000000010";
const NODE_COUNT = 10;

const nodeId = (n) =>
  `00000000-0000-0000-0001-${String(n).padStart(12, "0")}`;
const pathId = (n) =>
  `00000000-0000-0000-0002-${String(n).padStart(12, "0")}`;
const contentId = (n) =>
  `00000000-0000-0000-0003-${String(n).padStart(12, "0")}`;
const assessmentId = (n) =>
  `00000000-0000-0000-0004-${String(n).padStart(12, "0")}`;
const questionId = (n, q) =>
  `00000000-0000-0000-0005-${String(n * 100 + q).padStart(12, "0")}`;

const SPRITES = ["/islands/crystal.png", "/islands/desert.png", "/islands/winter.png"];
const IMAGES = ["/islands/crystal.webp", "/islands/desert.webp", "/islands/winter.webp"];

// --- Rows ------------------------------------------------------------------
const mapRow = {
  id: MAP_ID,
  title: "Trail Demo",
  description:
    "Seeded demo map for testing the trail-view prototype end-to-end (content -> quiz -> auto-advance).",
  creator_id: null,
  difficulty: 2,
  category: "custom",
  visibility: "public",
  map_type: "public",
  metadata: {},
};

const nodeRows = Array.from({ length: NODE_COUNT }, (_, i) => {
  const n = i + 1;
  const isLast = n === NODE_COUNT;
  return {
    id: nodeId(n),
    map_id: MAP_ID,
    title: isLast ? "Final Challenge" : `Step ${n}`,
    instructions: isLast
      ? "One last checkpoint. Answer the quiz to finish the trail."
      : `Read the content below, then pass the quiz to unlock Step ${n + 1}.`,
    difficulty: (i % 3) + 1,
    sprite_url: SPRITES[i % SPRITES.length],
    node_type: isLast ? "end" : "learning",
    metadata: {},
  };
});

const pathRows = Array.from({ length: NODE_COUNT - 1 }, (_, i) => {
  const n = i + 1;
  return {
    id: pathId(n),
    source_node_id: nodeId(n),
    destination_node_id: nodeId(n + 1),
  };
});

// Alternate text / image content per node.
const contentRows = Array.from({ length: NODE_COUNT }, (_, i) => {
  const n = i + 1;
  const isLast = n === NODE_COUNT;
  const title = isLast ? "Final Challenge" : `Step ${n}`;
  if (n % 2 === 1) {
    return {
      id: contentId(n),
      node_id: nodeId(n),
      content_type: "text",
      content_title: `${title} — Briefing`,
      content_body: `<h2>${title}</h2><p>Welcome to <strong>${title}</strong> of the Trail Demo. ` +
        `This is seeded content for exercising the trail view: read this briefing, then complete ` +
        `the quiz below to unlock the next step.</p><ul><li>Difficulty ${(i % 3) + 1}</li>` +
        `<li>Auto-graded quiz (2 questions, 70% to pass)</li></ul>`,
      content_url: null,
      display_order: 0,
    };
  }
  return {
    id: contentId(n),
    node_id: nodeId(n),
    content_type: "image",
    content_title: `${title} — Visual`,
    content_url: IMAGES[i % IMAGES.length],
    content_body: null,
    display_order: 0,
  };
});

// One quiz assessment per node (simplest type the student UI fully supports:
// it renders multiple-choice questions and auto-grades on submit — a score of
// >= 70% flips progress to "passed", which unlocks the next node).
const assessmentRows = Array.from({ length: NODE_COUNT }, (_, i) => {
  const n = i + 1;
  return {
    id: assessmentId(n),
    node_id: nodeId(n),
    assessment_type: "quiz",
    points_possible: 2,
    is_graded: false,
    metadata: {},
  };
});

// Two easy multiple-choice questions per node. options shape matches
// AssessmentSection rendering: [{ option: "A", text: "..." }]; the submitted
// quiz_answers map is { [question.id]: "A" } and auto-grading compares against
// correct_option. Both questions must be correct (2/2 = 100% >= 70%).
const questionRows = nodeRows.flatMap((node, i) => {
  const n = i + 1;
  const aId = assessmentId(n);
  return [
    {
      id: questionId(n, 1),
      assessment_id: aId,
      question_text: `[${node.title}] Which option is the CORRECT one?`,
      options: [
        { option: "A", text: "This one — pick me" },
        { option: "B", text: "Not this one" },
        { option: "C", text: "Definitely not this one" },
      ],
      correct_option: "A",
    },
    {
      id: questionId(n, 2),
      assessment_id: aId,
      question_text: `[${node.title}] 1 + 1 = ?`,
      options: [
        { option: "A", text: "1" },
        { option: "B", text: "2" },
        { option: "C", text: "3" },
      ],
      correct_option: "B",
    },
  ];
});

// --- Upserts (in FK dependency order) --------------------------------------
async function upsert(table, rows) {
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");
  if (error) {
    console.error(`❌ Upsert into ${table} failed:`, error.message);
    console.error(`   details: ${error.details || "(none)"} | hint: ${error.hint || "(none)"}`);
    process.exit(1);
  }
  console.log(`✅ ${table}: ${data.length} row(s) upserted`);
  return data.length;
}

console.log(`Seeding Trail Demo into ${supabaseUrl} ...\n`);

const counts = {};
counts.learning_maps = await upsert("learning_maps", [mapRow]);
counts.map_nodes = await upsert("map_nodes", nodeRows);
counts.node_paths = await upsert("node_paths", pathRows);
counts.node_content = await upsert("node_content", contentRows);
counts.node_assessments = await upsert("node_assessments", assessmentRows);
counts.quiz_questions = await upsert("quiz_questions", questionRows);

console.log("\n--- Summary ---");
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}
console.log(`\nTrail URL: /map/${MAP_ID}/trail`);
