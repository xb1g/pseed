import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  MapWelcomeExperience,
  isLaunchpadMap,
  getDifficultyLabel,
} from "../MapWelcomeExperience";

const genericMap = {
  id: "map-2",
  title: "3D Game Worlds",
  description: "Build your first 3D island. Then keep going.",
  creator_id: null,
  created_at: "",
  updated_at: "",
  node_count: 12,
  avg_difficulty: 5,
};

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  }));
}

describe("helpers", () => {
  test("isLaunchpadMap is case-insensitive", () => {
    expect(isLaunchpadMap("LaunchPad: Startup Sprint")).toBe(true);
    expect(isLaunchpadMap("launchpad trial")).toBe(true);
    expect(isLaunchpadMap("3D Game Worlds")).toBe(false);
  });

  test("getDifficultyLabel thresholds", () => {
    expect(getDifficultyLabel(2)).toBe("Beginner");
    expect(getDifficultyLabel(5)).toBe("Intermediate");
    expect(getDifficultyLabel(7)).toBe("Advanced");
    expect(getDifficultyLabel(9)).toBe("Expert");
    expect(getDifficultyLabel(undefined)).toBe("Intermediate");
  });
});

describe("generic variant (reduced motion = final state immediately)", () => {
  beforeEach(() => mockMatchMedia(true));

  test("renders keynote, title, real stats, and generic CTA", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={genericMap} />
    );
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.getByText("3D Game Worlds")).toBeVisible();
    expect(screen.getByText("12 islands")).toBeVisible();
    expect(screen.getByText(/Intermediate level/)).toBeVisible();
    expect(screen.getByText("Build your first 3D island.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Exploring" })).toBeVisible();
    expect(screen.queryByText("Pitch Day")).not.toBeInTheDocument();
  });

  test("CTA, skip link, and Escape all close", () => {
    const onOpenChange = jest.fn();
    render(
      <MapWelcomeExperience isOpen onOpenChange={onOpenChange} map={genericMap} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Start Exploring" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  test("renders nothing when closed", () => {
    const { container } = render(
      <MapWelcomeExperience
        isOpen={false}
        onOpenChange={jest.fn()}
        map={genericMap}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("staged reveal (motion allowed)", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test("stages advance on timers; clicking anywhere skips to final", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={genericMap} />
    );
    expect(screen.queryByText("You're in.")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(900));
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.queryByText("Start Exploring")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("button", { name: "Start Exploring" })).toBeVisible();
  });
});

const launchpadMap = {
  id: "map-1",
  title: "LaunchPad: Startup Sprint",
  description:
    "A 6-day startup accelerator for high school builders. Spot real problems.",
  creator_id: null,
  created_at: "",
  updated_at: "",
  node_count: 6,
  avg_difficulty: 5,
};

describe("LaunchPad variant (reduced motion)", () => {
  beforeEach(() => mockMatchMedia(true));

  test("renders story, all six day labels, eyebrow, and CTA", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={launchpadMap} />
    );
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.getByText("6-Day Startup Accelerator")).toBeVisible();
    expect(
      screen.getByText(/For the next 6 days, you're a founder\./)
    ).toBeVisible();
    expect(screen.getByText(/SeniorPass/)).toBeInTheDocument();
    for (const day of [
      "Spot the Problem",
      "Find Your Customer",
      "Napkin Economics",
      "Ship the MVP",
      "First 50 Users",
      "Pitch Day",
    ]) {
      expect(screen.getByText(day)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Begin Day 1" })).toBeVisible();
    expect(screen.queryByText(/islands/)).not.toBeInTheDocument();
  });
});
