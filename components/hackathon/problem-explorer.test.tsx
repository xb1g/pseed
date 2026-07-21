import fs from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";

import { ProblemExplorer } from "./problem-explorer";

test("selected problems keep the Dawn lit state across hover and touch", () => {
  render(
    <div className="dawn-theme">
      <ProblemExplorer selectedProblems={["P1"]} onSelectionChange={jest.fn()} />
    </div>
  );

  const selectedProblem = screen
    .getByRole("heading", { name: "สู้กับโรคเรื้อรังในพื้นที่ห่างไกล" })
    .closest('[role="button"]');
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  expect(selectedProblem).toHaveClass("ei-card", "ei-card--lit");
  expect(css).toContain(
    ".dawn-theme .ei-card:not(.ei-card--static):not(.ei-card--lit):hover"
  );
  expect(css).toContain(
    ".dawn-theme .ei-card:not(.ei-card--static):not(.ei-card--lit).in-view"
  );
  expect(css).toMatch(
    /\.dawn-theme \.ei-card--lit,[\s\S]*?\.dawn-theme \.ei-card--lit:hover,[\s\S]*?\.dawn-theme \.ei-card--lit\.in-view\s*\{[\s\S]*?animation: none;/
  );
});
