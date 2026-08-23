import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("AI Chat reset is authenticated, owner-scoped, and requires explicit retry after completion", () => {
  const route = source("app/api/map/assessments/[assessmentId]/ai-chat/route.ts");
  const deleteSection = route.slice(
    route.indexOf("export async function DELETE"),
    route.indexOf("export async function POST"),
  );

  assert.match(deleteSection, /getAuthorizedAssessment\(assessmentId\)/);
  assert.match(deleteSection, /\.eq\("assessment_id", assessmentId\)/);
  assert.match(deleteSection, /\.eq\("user_id", authorized\.user\.id\)/);
  assert.match(deleteSection, /\.eq\("is_completed", false\)/);
  assert.match(deleteSection, /searchParams\.get\("retry"\) === "1"/);
  assert.match(deleteSection, /session\?\.is_completed && !isRetry/);
  assert.match(deleteSection, /reset_completed_ai_chat_attempt/);
  assert.match(deleteSection, /p_user_id: authorized\.user\.id/);
  assert.match(deleteSection, /p_node_id: authorized\.assessment\.node_id/);
});

test("AI Chat UI confirms the destructive reset and restores local progress", () => {
  const component = source("components/map/AIChatAssessment.tsx");

  assert.match(component, /Reset this conversation\?/);
  assert.match(component, /method: "DELETE"/);
  assert.match(component, /setCompletionPercentage\(0\)/);
  assert.match(component, /setTurnCount\(0\)/);
  assert.match(component, /Your other map work is not affected/);
  assert.match(component, /Retry conversation/);
  assert.match(component, /\?retry=1/);
  assert.match(component, /This removes this completed result, feedback, and chat transcript/);
});

test("AI Chat completion refreshes progress without auto-closing the selected node", () => {
  const panel = source("components/map/NodeViewPanel.tsx");
  const callbacks = panel.match(
    /onAIChatComplete=\{async \(\) => \{\s*await loadProgress\(\);\s*onProgressUpdate\?\.\(\);\s*\}\}/g,
  );

  assert.equal(callbacks?.length, 2);
});

test("completed retry cleanup is atomic and limited to the owned AI Chat attempt", () => {
  const migration = source(
    "supabase/migrations/20260822133000_add_ai_chat_completed_retry.sql",
  );

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.reset_completed_ai_chat_attempt/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /s\.user_id = p_user_id/);
  assert.match(migration, /metadata @> jsonb_build_object\('ai_chat_session_id', p_session_id\)/);
  assert.match(migration, /status = 'in_progress'/);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/);
});

test("AI Chat exposes the admin persona and never names the provider while typing", () => {
  const route = source("app/api/map/assessments/[assessmentId]/ai-chat/route.ts");
  const component = source("components/map/AIChatAssessment.tsx");
  const editor = source("components/map/AssessmentEditor/AIChatEditor.tsx");

  assert.match(route, /persona_name: config\.personaName/);
  assert.match(editor, /Persona name/);
  assert.match(component, /\{personaName\} is typing/);
  assert.match(component, /animate-bounce/);
  assert.match(component, /motion-reduce:animate-none/);
  assert.doesNotMatch(component, /Kimi is thinking/);
});

test("AI Chat keeps submission scrolling inside a stable transcript area", () => {
  const component = source("components/map/AIChatAssessment.tsx");

  assert.match(component, /chatLog\.scrollTo/);
  assert.match(component, /top: chatLog\.scrollHeight/);
  assert.match(component, /h-\[22rem\]/);
  assert.match(component, /sm:h-\[28rem\]/);
  assert.match(component, /overscroll-contain/);
  assert.doesNotMatch(component, /scrollIntoView/);
});
