import { render, screen, fireEvent } from "@testing-library/react";

import { FullscreenImageViewer } from "../FullscreenImageViewer";

describe("FullscreenImageViewer", () => {
  test("renders the image with src and alt", () => {
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={jest.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "A reference photo" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.png");
  });

  test("renders the caption when provided", () => {
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        caption="Figure 3: pipeline"
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Figure 3: pipeline")).toBeInTheDocument();
  });

  test("omits the caption when not provided", () => {
    const { container } = render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={jest.fn()}
      />
    );
    // No <p> caption rendered. The image and close button are still present.
    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "A reference photo" })).toBeInTheDocument();
  });

  test("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /close image viewer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});