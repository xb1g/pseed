// 1. Initialize dotenv immediately at the entrypoint
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: true });

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type {
  PathLabGeneratorDraft,
  PathLabGeneratorRequest,
  PathLabGeneratorNodeDraft,
  PathLabGeneratorAssessmentDraft,
} from "../types/pathlab-generator";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CATEGORY_ID = "86e5a6c8-c9ed-41f7-a182-d378a9772192"; // Course category

// PathLab Generator Request file paths
const REQUEST_FILES = [
  {
    career: "AI x Business (AI Product & Strategy)",
    path: "/Users/bunyasit/.gemini/antigravity-cli/brain/a74ad24f-c3e8-4cf7-bcd3-1c37c43758f0/ai_business_pathlab_request.json",
  },
  {
    career: "Data Analyst",
    path: "/Users/bunyasit/.gemini/antigravity-cli/brain/220ed15e-4c9d-417a-85d9-a2c3c58e5083/data_analyst_pathlab_request.json",
  },
  {
    career: "UX/UI Designer",
    path: "/Users/bunyasit/.gemini/antigravity-cli/brain/c22a3c52-ac07-4ca4-bce4-3060d4af5c2a/ux_design_pathlab_request.json",
  },
];

function difficultyToNumber(difficulty: "beginner" | "intermediate" | "advanced"): number {
  switch (difficulty) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default:
      return 1;
  }
}

function getNodePosition(index: number) {
  const row = Math.floor(index / 2);
  const col = index % 2;
  return {
    x: 100 + col * 300,
    y: 100 + row * 150,
  };
}

function buildAssessmentRow(nodeId: string, assessment: PathLabGeneratorAssessmentDraft) {
  if (assessment.type === "none") return null;

  const assessmentType = assessment.type;
  let metadata: Record<string, any> | null = null;
  if (assessmentType === "checklist") {
    metadata = { items: assessment.checklist_items || [] };
  } else if (assessment.prompt) {
    metadata = { prompt: assessment.prompt };
  }

  return {
    node_id: nodeId,
    assessment_type: assessmentType,
    metadata,
    points_possible: assessment.points_possible ?? (assessmentType === "quiz" ? 10 : null),
    is_graded: assessmentType === "quiz",
  };
}

async function persistPathLab(request: PathLabGeneratorRequest, draft: PathLabGeneratorDraft) {
  console.log(`\n💾 Persisting draft: "${draft.seed.title}" to database...`);

  // 1. Create Learning Map
  const { data: map, error: mapError } = await supabase
    .from("learning_maps")
    .insert({
      title: `${draft.seed.title} Map`,
      description: draft.seed.description,
      creator_id: ADMIN_ID,
      map_type: "private",
      visibility: "private",
    })
    .select("id")
    .single();

  if (mapError || !map) {
    throw new Error(`Failed to create learning map: ${mapError?.message}`);
  }

  const mapId = map.id;

  try {
    // 2. Create Seed
    const { data: seed, error: seedError } = await supabase
      .from("seeds")
      .insert({
        map_id: mapId,
        title: draft.seed.title,
        slogan: draft.seed.slogan,
        description: draft.seed.description,
        category_id: request.categoryId || CATEGORY_ID,
        seed_type: "pathlab",
        created_by: ADMIN_ID,
      })
      .select("id")
      .single();

    if (seedError || !seed) {
      throw new Error(`Failed to create seed: ${seedError?.message}`);
    }

    // 3. Create Path Configuration
    const { data: pathRow, error: pathError } = await supabase
      .from("paths")
      .insert({
        seed_id: seed.id,
        total_days: draft.path.total_days,
        created_by: ADMIN_ID,
      })
      .select("id")
      .single();

    if (pathError || !pathRow) {
      throw new Error(`Failed to create path: ${pathError?.message}`);
    }

    const pathId = pathRow.id;

    // 4. Create Nodes (Map Nodes)
    const keyToNodeId = new Map<string, string>();
    const nodeRows = draft.nodes.map((node, index) => {
      const nodeId = crypto.randomUUID();
      keyToNodeId.set(node.key, nodeId);
      return {
        id: nodeId,
        map_id: mapId,
        title: node.title,
        instructions: node.instructions,
        difficulty: difficultyToNumber(node.difficulty),
        sprite_url: null,
        node_type: "learning",
        metadata: {
          position: getNodePosition(index),
          generated_key: node.key,
          generated: true,
        },
      };
    });

    if (nodeRows.length > 0) {
      const { error: insertNodesError } = await supabase.from("map_nodes").insert(nodeRows);
      if (insertNodesError) throw new Error(`Failed to insert map nodes: ${insertNodesError.message}`);
    }

    // 5. Create Node Content
    const contentRows: any[] = [];
    const assessmentsToCreate: any[] = [];

    draft.nodes.forEach((node) => {
      const nodeId = keyToNodeId.get(node.key);
      if (!nodeId) return;

      node.content.forEach((content, contentIndex) => {
        contentRows.push({
          node_id: nodeId,
          content_type: content.type,
          content_title: content.title || null,
          content_url: content.url || null,
          content_body: content.body || null,
          display_order: contentIndex,
        });
      });

      const assessmentRow = buildAssessmentRow(nodeId, node.assessment);
      if (assessmentRow) {
        assessmentsToCreate.push({
          nodeKey: node.key,
          row: assessmentRow,
        });
      }
    });

    if (contentRows.length > 0) {
      const { error: contentError } = await supabase.from("node_content").insert(contentRows);
      if (contentError) throw new Error(`Failed to insert node content: ${contentError.message}`);
    }

    // 6. Create Node Assessments & Quiz Questions
    if (assessmentsToCreate.length > 0) {
      const { data: createdAssessments, error: assessmentError } = await supabase
        .from("node_assessments")
        .insert(assessmentsToCreate.map((entry) => entry.row))
        .select("id, node_id");

      if (assessmentError) throw new Error(`Failed to insert node assessments: ${assessmentError.message}`);

      const assessmentIdByNodeId = new Map<string, string>();
      for (const assessment of createdAssessments || []) {
        assessmentIdByNodeId.set(assessment.node_id, assessment.id);
      }

      const quizRows: any[] = [];
      draft.nodes.forEach((node) => {
        if (node.assessment.type !== "quiz") return;

        const nodeId = keyToNodeId.get(node.key);
        if (!nodeId) return;
        const assessmentId = assessmentIdByNodeId.get(nodeId);
        if (!assessmentId) return;

        (node.assessment.quiz_questions || []).forEach((question) => {
          quizRows.push({
            assessment_id: assessmentId,
            question_text: question.question_text,
            options: question.options,
            correct_option: question.correct_option,
          });
        });
      });

      if (quizRows.length > 0) {
        const { error: quizError } = await supabase.from("quiz_questions").insert(quizRows);
        if (quizError) throw new Error(`Failed to insert quiz questions: ${quizError.message}`);
      }
    }

    // 7. Create Edges (Node Paths)
    const edgeRows = draft.edges
      .map((edge) => {
        const sourceNodeId = keyToNodeId.get(edge.source_key);
        const destinationNodeId = keyToNodeId.get(edge.destination_key);
        if (!sourceNodeId || !destinationNodeId) return null;
        return {
          source_node_id: sourceNodeId,
          destination_node_id: destinationNodeId,
        };
      })
      .filter((edge): edge is { source_node_id: string; destination_node_id: string } => !!edge);

    if (edgeRows.length > 0) {
      const { error: edgeError } = await supabase.from("node_paths").insert(edgeRows);
      if (edgeError) throw new Error(`Failed to insert edges/paths: ${edgeError.message}`);
    }

    // 8. Create Path Days
    const dayRows = draft.days.map((day) => ({
      path_id: pathId,
      day_number: day.day_number,
      title: day.title || null,
      context_text: day.context_text,
      reflection_prompts: day.reflection_prompts,
      node_ids: day.node_keys
        .map((key) => keyToNodeId.get(key))
        .filter((nodeId): nodeId is string => !!nodeId),
    }));

    if (dayRows.length > 0) {
      const { error: dayError } = await supabase.from("path_days").insert(dayRows);
      if (dayError) throw new Error(`Failed to insert path days: ${dayError.message}`);
    }

    // 9. Update Learning Map Type to "seed" and set Visibility to "public"
    const { error: updateMapError } = await supabase
      .from("learning_maps")
      .update({
        map_type: "seed",
        parent_seed_id: seed.id,
        visibility: "public",
      })
      .eq("id", mapId);

    if (updateMapError) {
      throw new Error(`Failed to update learning map details: ${updateMapError.message}`);
    }

    console.log(`✅ Shipped: ${draft.seed.title}`);
    console.log(`   - Map ID: ${mapId}`);
    console.log(`   - Seed ID: ${seed.id}`);
    console.log(`   - Path ID: ${pathId}`);
    console.log(`   - Days: ${dayRows.length}, Nodes: ${nodeRows.length}`);
  } catch (err) {
    // Cleanup Learning Map on error
    await supabase.from("learning_maps").delete().eq("id", mapId);
    throw err;
  }
}

async function main() {
  console.log("🚀 Starting PathLab Generation and Seeding Pipeline...\n");

  // Dynamic import internal generator/validator after env variables have been resolved
  const { generatePathLabDraft } = await import("../lib/ai/pathlab-generator");
  const { validatePathLabDraft } = await import("../lib/pathlab/generation-quality");

  for (const file of REQUEST_FILES) {
    try {
      console.log(`\n==================================================`);
      console.log(`👤 Career: ${file.career}`);
      console.log(`📄 File: ${path.basename(file.path)}`);
      console.log(`==================================================`);

      const raw = await fs.readFile(file.path, "utf8");
      const request: any = JSON.parse(raw);

      // Clean request data array types if generated as raw strings
      if (request.expertContext?.careerTruths) {
        const truths = request.expertContext.careerTruths;
        Object.keys(truths).forEach((key) => {
          if (typeof truths[key] === "string") {
            truths[key] = [truths[key]];
          }
        });
      }

      console.log(`🤖 Generating PathLab draft from Gemini...`);
      let draft: any = null;
      let attempts = 3;
      while (attempts > 0) {
        try {
          draft = await generatePathLabDraft(request as PathLabGeneratorRequest);
          break;
        } catch (e: any) {
          attempts--;
          console.warn(`   ⚠️ Generation attempt failed (${attempts} retries remaining): ${e.message}`);
          if (attempts === 0) throw e;
          // Add 2s delay before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log(`🔍 Running structural and editorial validation...`);
      const quality = validatePathLabDraft(draft, request as PathLabGeneratorRequest);

      if (!quality.valid) {
        console.error(`❌ Draft failed validation checks:`);
        quality.errors.forEach((err) => console.error(`   - [ERROR] ${err.code}: ${err.message}`));
        quality.warnings.forEach((warn) => console.warn(`   - [WARN] ${warn.code}: ${warn.message}`));
        throw new Error("Draft validation failed");
      }

      if (quality.warnings.length > 0) {
        console.log(`⚠️ Warnings encountered:`);
        quality.warnings.forEach((warn) => console.log(`   - [WARN] ${warn.code}: ${warn.message}`));
      } else {
        console.log(`✅ Validation passed cleanly with 0 errors and 0 warnings.`);
      }

      await persistPathLab(request as PathLabGeneratorRequest, draft);
    } catch (error: any) {
      console.error(`❌ Failed processing ${file.career}:`, error.message || error);
    }
  }

  console.log("\n🏁 Seeding pipeline complete!");
}

main().catch(console.error);
