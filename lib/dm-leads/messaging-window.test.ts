import { getMessagingWindowMode, isWithinMessagingWindow } from "./messaging-window";

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

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

describe("getMessagingWindowMode", () => {
  it("uses the standard RESPONSE window inside 24h", () => {
    expect(getMessagingWindowMode(hoursAgo(3))).toBe("standard");
    expect(getMessagingWindowMode(hoursAgo(23))).toBe("standard");
  });

  it("falls back to the human agent tag between 24h and 7 days", () => {
    expect(getMessagingWindowMode(hoursAgo(25))).toBe("human_agent");
    expect(getMessagingWindowMode(hoursAgo(24 * 6))).toBe("human_agent");
  });

  it("is closed past 7 days", () => {
    expect(getMessagingWindowMode(hoursAgo(24 * 8))).toBe("closed");
  });

  it("treats a missing or unparseable timestamp as closed, never as open", () => {
    expect(getMessagingWindowMode(null)).toBe("closed");
    expect(getMessagingWindowMode(undefined)).toBe("closed");
    expect(getMessagingWindowMode("not-a-date")).toBe("closed");
  });
});
