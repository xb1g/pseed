import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("AI Chat reset is authenticated, owner-scoped, and blocked after completion", () => {
  const route = source("app/api/map/assessments/[assessmentId]/ai-chat/route.ts");
  const deleteSection = route.slice(
    route.indexOf("export async function DELETE"),
    route.indexOf("export async function POST"),
  );

  assert.match(deleteSection, /getAuthorizedAssessment\(assessmentId\)/);
  assert.match(deleteSection, /\.eq\("assessment_id", assessmentId\)/);
  assert.match(deleteSection, /\.eq\("user_id", authorized\.user\.id\)/);
  assert.match(deleteSection, /\.eq\("is_completed", false\)/);
  assert.match(deleteSection, /A completed AI Chat cannot be reset/);
});

test("AI Chat UI confirms the destructive reset and restores local progress", () => {
  const component = source("components/map/AIChatAssessment.tsx");

  assert.match(component, /Reset this conversation\?/);
  assert.match(component, /method: "DELETE"/);
  assert.match(component, /setCompletionPercentage\(0\)/);
  assert.match(component, /setTurnCount\(0\)/);
  assert.match(component, /Your other map work is not affected/);
});
