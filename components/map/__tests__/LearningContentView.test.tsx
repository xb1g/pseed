import { render, screen, fireEvent } from "@testing-library/react";

// Mock the heavy ESM modules so the test doesn't need a transform pass.
// `processTextContent` (in nodeViewHelpers) is the only public entry point
// that pulls these in; the wiring test only cares that an inline <img> lands
// in the DOM and triggers the delegated click handler. We delegate straight
// to a passthrough sanitizer that preserves <img> src/alt.
jest.mock("marked", () => ({
  __esModule: true,
  marked: {
    setOptions: jest.fn(),
    parse: (input: string) => input,
  },
}));
jest.mock("@/lib/security/sanitize-html", () => ({
  __esModule: true,
  sanitizeHtml: (input: string) => input,
}));

import LearningContentView from "../LearningContentView";
import type { NodeContent } from "@/types/map";

function makeImageContent(overrides: Partial<NodeContent> = {}): NodeContent {
  return {
    id: "img-1",
    node_id: "node-1",
    content_type: "image",
    content_title: "Reference photo",
    content_url: "https://example.com/photo.png",
    content_body: null,
    display_order: 0,
    created_at: "",
    ...overrides,
  };
}

function makeTextContent(body: string, overrides: Partial<NodeContent> = {}): NodeContent {
  return {
    id: "txt-1",
    node_id: "node-1",
    content_type: "text",
    content_title: null,
    content_url: null,
    content_body: body,
    display_order: 0,
    created_at: "",
    ...overrides,
  };
}

describe("LearningContentView fullscreen wiring", () => {
  test("clicking an image content block opens the fullscreen viewer", () => {
    render(
      <LearningContentView
        nodeContent={[makeImageContent()]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /expand image/i }));

    const dialogImg = screen.getByRole("img", { name: "Reference photo" });
    expect(dialogImg).toHaveAttribute("src", "https://example.com/photo.png");
    // The caption <p> inside the dialog carries the content_title.
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Reference photo");
  });

  test("clicking an inline <img> inside text content opens the viewer", () => {
    const html = '<p>see <img src="https://example.com/inline.png" alt="Inline diagram" /></p>';
    render(
      <LearningContentView
        nodeContent={[makeTextContent(html)]}
        nodeTitle="Test node"
      />
    );

    const inline = screen.getByRole("img", { name: "Inline diagram" });
    fireEvent.click(inline);

    const dialogImg = screen.getByRole("img", { name: "Inline diagram" });
    expect(dialogImg).toHaveAttribute("src", "https://example.com/inline.png");
  });

  test("clicking a non-image element inside text content does NOT open the viewer", () => {
    const html = "<p>plain paragraph, no images</p>";
    render(
      <LearningContentView
        nodeContent={[makeTextContent(html)]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByText("plain paragraph, no images"));

    // No viewer close button rendered => viewer did not open.
    expect(
      screen.queryByRole("button", { name: /close image viewer/i })
    ).not.toBeInTheDocument();
  });

  test("Escape closes the viewer", () => {
    render(
      <LearningContentView
        nodeContent={[makeImageContent()]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /expand image/i }));
    expect(
      screen.getByRole("button", { name: /close image viewer/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("button", { name: /close image viewer/i })
    ).not.toBeInTheDocument();
  });
});