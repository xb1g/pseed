import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RadarTerritoryExperience } from "../RadarTerritoryExperience";
import { recordRadarPathIntent } from "@/lib/supabase/radar";
import type { Territory } from "@/lib/radar/territory";

jest.mock("@/lib/supabase/radar", () => ({
  recordRadarPathIntent: jest.fn(),
}));

const territory: Territory = {
  key: "business",
  label_th: "ธุรกิจ",
  label_en: "Business",
  professions: [
    {
      id: "profession-1",
      slug: "sales",
      name_th: "นักขาย",
      name_en: "Sales",
      tagline_th: "ทำให้ลูกค้าเห็นคุณค่า",
      emoji: "🤝",
      color: "#f59e0b",
      copy: {
        collection: "business",
        is_index: false,
        reveal_th: "เปลี่ยนความต้องการของลูกค้าให้เป็นรายได้",
        fantasy_th: null,
        reality_th: null,
        sits_th: null,
        is_composite: false,
      },
      skills: [],
    },
  ],
  composite: null,
  skills: [],
  startOptions: [],
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("restores the reaction buttons and logs when recording fails", async () => {
  const writeError = new Error("write failed");
  jest.mocked(recordRadarPathIntent).mockRejectedValueOnce(writeError);
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

  render(<RadarTerritoryExperience territory={territory} />);
  fireEvent.click(screen.getByRole("button", { name: /นักขาย/ }));
  fireEvent.click(screen.getByRole("button", { name: "อยากรู้เพิ่ม" }));

  expect(screen.getByText("บันทึกว่าสนใจแล้ว")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "อยากรู้เพิ่ม" })).toBeInTheDocument()
  );
  expect(consoleError).toHaveBeenCalledWith(
    "Error recording radar territory reaction:",
    writeError
  );
});

test("restores the reaction buttons when the database write reports failure", async () => {
  jest.mocked(recordRadarPathIntent).mockResolvedValueOnce("failed");

  render(<RadarTerritoryExperience territory={territory} />);
  fireEvent.click(screen.getByRole("button", { name: /นักขาย/ }));
  fireEvent.click(screen.getByRole("button", { name: "อยากรู้เพิ่ม" }));

  expect(screen.getByText("บันทึกว่าสนใจแล้ว")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "อยากรู้เพิ่ม" })).toBeInTheDocument()
  );
});

test("keeps the recorded state when recording succeeds", async () => {
  jest.mocked(recordRadarPathIntent).mockResolvedValueOnce("recorded");

  render(<RadarTerritoryExperience territory={territory} />);
  fireEvent.click(screen.getByRole("button", { name: /นักขาย/ }));
  fireEvent.click(screen.getByRole("button", { name: "อยากรู้เพิ่ม" }));

  await waitFor(() => expect(recordRadarPathIntent).toHaveBeenCalledTimes(1));
  expect(screen.getByText("บันทึกว่าสนใจแล้ว")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "อยากรู้เพิ่ม" })).not.toBeInTheDocument();
});
