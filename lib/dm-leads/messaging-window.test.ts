import { isWithinMessagingWindow } from "./messaging-window";

describe("isWithinMessagingWindow", () => {
  it("returns false when there is no inbound message yet", () => {
    expect(isWithinMessagingWindow(null)).toBe(false);
    expect(isWithinMessagingWindow(undefined)).toBe(false);
  });

  it("returns true just under 24h since the last inbound message", () => {
    const at = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    expect(isWithinMessagingWindow(at)).toBe(true);
  });

  it("returns false once 24h have passed", () => {
    const at = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isWithinMessagingWindow(at)).toBe(false);
  });

  it("returns false for an invalid timestamp", () => {
    expect(isWithinMessagingWindow("not-a-date")).toBe(false);
  });
});
