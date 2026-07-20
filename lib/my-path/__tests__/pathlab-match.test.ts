import assert from "node:assert/strict";

import {
  isSeedMatched,
  matchSeedsToInterests,
  type SeedPathlab,
} from "../pathlab-match";
import { planningRegistry } from "../registry";

function seed(id: string, title: string, description: string | null = null): SeedPathlab {
  return {
    id,
    title,
    description,
    coverImageUrl: null,
    categoryName: null,
    totalDays: null,
  };
}

const aiSeed = seed(
  "seed-ai",
  "AI Engineer PathLab",
  "Build a small neural project with machine learning"
);
const fashionSeed = seed("seed-fashion", "Fashion Design Studio", "ออกแบบเสื้อผ้าของตัวเอง");
const communitySeed = seed("seed-community", "Community Volunteering Day");

test("matched PathLabs come first while unmatched seeds keep their original order", () => {
  const ordered = matchSeedsToInterests(
    ["ai-engineer"],
    [fashionSeed, aiSeed, communitySeed],
    planningRegistry
  );

  assert.deepEqual(
    ordered.map((item) => item.id),
    ["seed-ai", "seed-fashion", "seed-community"]
  );
});

test("an empty selection preserves the input order", () => {
  const input = [fashionSeed, aiSeed, communitySeed];
  const ordered = matchSeedsToInterests([], input, planningRegistry);

  assert.deepEqual(ordered, input);
});

test("a selection that matches nothing preserves the input order", () => {
  const input = [fashionSeed, communitySeed];
  const ordered = matchSeedsToInterests(["teacher"], input, planningRegistry);

  assert.deepEqual(ordered, input);
});

test("isSeedMatched reports whether a seed relates to the selected interests", () => {
  assert.equal(isSeedMatched(aiSeed, ["ai-engineer"], planningRegistry), true);
  assert.equal(isSeedMatched(fashionSeed, ["ai-engineer"], planningRegistry), false);
  assert.equal(isSeedMatched(aiSeed, [], planningRegistry), false);
});
