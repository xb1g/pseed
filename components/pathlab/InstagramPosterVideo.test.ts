import {
  FPS,
  DURATION_SEC,
  TOTAL_FRAMES,
  WIDTH,
  HEIGHT,
} from "./InstagramPosterVideo.test-fixture";

describe("video timeline constants", () => {
  it("renders 288 frames at 24 fps over 12 seconds", () => {
    expect(FPS).toBe(24);
    expect(DURATION_SEC).toBe(12);
    expect(TOTAL_FRAMES).toBe(288);
    expect(TOTAL_FRAMES / FPS).toBe(DURATION_SEC);
  });

  it("renders at 1080x1350 (4:5 portrait)", () => {
    expect(WIDTH / HEIGHT).toBeCloseTo(4 / 5, 5);
    expect(WIDTH).toBe(1080);
    expect(HEIGHT).toBe(1350);
  });
});