import { shouldSkipRadarAnalytics } from "@/lib/radar/analytics-host";

describe("shouldSkipRadarAnalytics", () => {
  it("skips localhost and loopback hosts", () => {
    for (const hostname of [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "app.localhost",
      "radar.local",
    ]) {
      expect(shouldSkipRadarAnalytics(hostname)).toBe(true);
    }
  });

  it("skips private LAN hosts used for device testing", () => {
    for (const hostname of ["192.168.1.20", "10.0.0.5", "172.16.4.8"]) {
      expect(shouldSkipRadarAnalytics(hostname)).toBe(true);
    }
  });

  it("allows production hosts", () => {
    for (const hostname of [
      "passionseed.com",
      "www.passionseed.com",
      "app.example.com",
    ]) {
      expect(shouldSkipRadarAnalytics(hostname)).toBe(false);
    }
  });

  it("skips empty hostname (SSR / unknown)", () => {
    expect(shouldSkipRadarAnalytics("")).toBe(true);
  });
});
