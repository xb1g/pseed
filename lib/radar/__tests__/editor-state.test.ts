import {
  moveRadarEditorCard,
  updateRadarEditorContent,
} from "../editor-state";

describe("Radar WYSIWYG editor state", () => {
  const cards = [
    { id: "one", kind: "hook", position: 0, content_th: { title: "One" } },
    { id: "two", kind: "text", position: 10, content_th: { title: "Two" } },
  ];

  it("updates nested visible content without losing sibling fields", () => {
    expect(
      updateRadarEditorContent(cards[0], "th", ["title"], "Updated").content_th
    ).toEqual({ title: "Updated" });
  });

  it("updates paragraph fields inside structured arrays without losing siblings", () => {
    const card = {
      id: "jobs",
      kind: "jobs",
      position: 0,
      content_th: {
        jobs: [
          { title: "Data Analyst", note: "Old note", salary: "30k" },
          { title: "Researcher", note: "Keep me" },
        ],
      },
    };

    expect(
      updateRadarEditorContent(
        card,
        "th",
        ["jobs", "0", "note"],
        "Updated note"
      ).content_th
    ).toEqual({
      jobs: [
        { title: "Data Analyst", note: "Updated note", salary: "30k" },
        { title: "Researcher", note: "Keep me" },
      ],
    });
  });

  it("reorders chapters and normalizes their positions", () => {
    expect(moveRadarEditorCard(cards, 1, -1)).toEqual([
      { ...cards[1], position: 0 },
      { ...cards[0], position: 10 },
    ]);
  });
});
