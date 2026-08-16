import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { MapEnrollmentTracker } from "../MapEnrollmentTracker";

jest.mock("@/lib/api/enrollment-client", () => ({
  enrollUserInMap: jest.fn().mockResolvedValue(true),
  isUserEnrolledInMap: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Reduced motion: the welcome experience renders its final state immediately.
window.matchMedia = jest.fn().mockImplementation((query: string) => ({
  matches: true,
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  onchange: null,
  dispatchEvent: jest.fn(),
}));

const map = {
  id: "map-1",
  title: "LaunchPad: Startup Sprint",
  description: "A 6-day startup accelerator.",
  creator_id: null,
  created_at: "",
  updated_at: "",
};

describe("MapEnrollmentTracker admin replay", () => {
  beforeEach(() => window.localStorage.clear());

  test("admins see a replay button; clicking it clears the seen-gate and opens the experience", async () => {
    window.localStorage.setItem("map-welcome-tour-seen:map-1", "true");

    render(
      <MapEnrollmentTracker map={map} isAdmin>
        <div>map content</div>
      </MapEnrollmentTracker>
    );

    const replay = await screen.findByRole("button", {
      name: "Replay welcome",
    });
    fireEvent.click(replay);

    expect(
      window.localStorage.getItem("map-welcome-tour-seen:map-1")
    ).toBeNull();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("You're in.")).toBeVisible();

    // Closing re-arms the gate and brings the replay button back
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      window.localStorage.getItem("map-welcome-tour-seen:map-1")
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Replay welcome" })
    ).toBeVisible();
  });

  test("non-admins get no replay button", async () => {
    render(
      <MapEnrollmentTracker map={map}>
        <div>map content</div>
      </MapEnrollmentTracker>
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Replay welcome" })
      ).not.toBeInTheDocument()
    );
  });
});
