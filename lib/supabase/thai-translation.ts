/**
 * Client-side utilities for creating Thai translation nodes
 * linked to existing English (primary) learning map nodes.
 *
 * A translation node clones the primary node's structure (content rows,
 * assessment, image references) with the English text as placeholder,
 * then the teacher edits the Thai text inline via the edit-mode toggle.
 */

import { createClient } from "@/utils/supabase/client";
import { MapNode } from "@/types/map";

/**
 * Create a Thai translation node for a given primary (English) node.
 *
 * What gets created:
 * - A `map_nodes` row with `metadata.language = "th"` and
 *   `metadata.translation_of` pointing to the primary node.
 * - Cloned `node_content` rows: image rows share the same URL;
 *   text rows copy the English body as a placeholder to translate.
 * - A `node_assessments` row with the same type and cloned metadata
 *   (English prompt as placeholder).
 * - A `node_paths` row from the previous Thai node in the day chain
 *   (if one exists) to the new node, so the Thai track is walkable.
 *
 * After creation, the caller should refresh map data (e.g. via
 * `window.dispatchEvent(new CustomEvent("map_node_updated"))` or a
 * page reload) so the new translation appears in the translation map.
 */
export async function createThaiTranslation(
  primaryNode: MapNode,
  mapId: string,
): Promise<MapNode> {
  const supabase = createClient();

  // 1. Create the Thai map_nodes row
  const primaryMeta = (primaryNode.metadata as any) ?? {};
  const thaiTitle = `[ไทย] ${primaryNode.title}`;
  const thaiNodeData: Partial<MapNode> = {
    map_id: mapId,
    title: thaiTitle,
    instructions: primaryNode.instructions ?? null, // placeholder
    difficulty: primaryNode.difficulty,
    sprite_url: primaryNode.sprite_url,
    node_type: primaryNode.node_type ?? "learning",
    metadata: {
      ...primaryMeta,
      language: "th",
      translation_of: primaryNode.id,
      position: {
        x: (primaryMeta.position?.x ?? 240) + 180,
        y: (primaryMeta.position?.y ?? 0) + 20,
      },
    },
  };

  const { data: newNode, error: nodeError } = await supabase
    .from("map_nodes")
    .insert([thaiNodeData])
    .select()
    .single();

  if (nodeError || !newNode) {
    throw new Error(`Could not create Thai node: ${nodeError?.message}`);
  }

  // 2. Clone node_content rows from the primary node
  const { data: primaryContent, error: contentFetchError } = await supabase
    .from("node_content")
    .select("*")
    .eq("node_id", primaryNode.id)
    .order("display_order");

  if (contentFetchError) {
    console.warn("Could not fetch primary content for cloning:", contentFetchError);
  }

  if (primaryContent && primaryContent.length > 0) {
    const thaiContentRows = primaryContent.map((row) => ({
      node_id: newNode.id,
      content_type: row.content_type,
      content_title: row.content_title, // placeholder, teacher translates
      content_url: row.content_url, // images shared
      content_body: row.content_body, // placeholder, teacher translates
      display_order: row.display_order,
    }));

    const { error: contentInsertError } = await supabase
      .from("node_content")
      .insert(thaiContentRows);

    if (contentInsertError) {
      console.warn("Could not clone content rows:", contentInsertError);
    }
  }

  // 3. Clone the assessment from the primary node
  const { data: primaryAssessments, error: assessFetchError } = await supabase
    .from("node_assessments")
    .select("*")
    .eq("node_id", primaryNode.id);

  if (assessFetchError) {
    console.warn("Could not fetch primary assessment for cloning:", assessFetchError);
  }

  if (primaryAssessments && primaryAssessments.length > 0) {
    for (const assess of primaryAssessments) {
      const { quiz_questions, node_id, id, ...assessData } = assess;
      const thaiAssess = {
        ...assessData,
        node_id: newNode.id,
        // metadata prompt is English placeholder, teacher translates
      };

      const { data: newAssess, error: assessInsertError } = await supabase
        .from("node_assessments")
        .insert([thaiAssess])
        .select()
        .single();

      if (assessInsertError) {
        console.warn("Could not clone assessment:", assessInsertError);
        continue;
      }

      // Clone quiz questions if the assessment is a quiz
      if (assess.assessment_type === "quiz" && quiz_questions) {
        const { data: questions, error: qFetchError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("assessment_id", assess.id);

        if (!qFetchError && questions) {
          const thaiQuestions = questions.map((q) => ({
            assessment_id: newAssess.id,
            question_text: q.question_text, // placeholder
            options: q.options, // same options
            correct_option: q.correct_option,
          }));

          await supabase.from("quiz_questions").insert(thaiQuestions);
        }
      }
    }
  }

  // 4. Link from the previous Thai node in the chain (if one exists)
  const day = primaryMeta.day;
  if (day && day > 1) {
    // Look for a Thai node for the previous day
    const { data: allNodes } = await supabase
      .from("map_nodes")
      .select("id, metadata")
      .eq("map_id", mapId);

    const prevThaiNode = (allNodes ?? []).find(
      (n) =>
        n.metadata?.language === "th" &&
        n.metadata?.day === day - 1 &&
        n.id !== newNode.id,
    );

    if (prevThaiNode) {
      await supabase.from("node_paths").insert([
        {
          source_node_id: prevThaiNode.id,
          destination_node_id: newNode.id,
        },
      ]);
    }
  }

  return newNode as MapNode;
}
