import { isExcludedFromAutoReply } from "@/lib/meta/reply-exclusions";

describe("isExcludedFromAutoReply", () => {
  it.each(["tlezjps", "ph.rch", "TLEZJPS", "  Ph.Rch  "])(
    "excludes %p",
    (handle) => expect(isExcludedFromAutoReply(handle)).toBe(true)
  );

  it.each(["jesada_03", "palita_khamma", "", null, undefined])(
    "does not exclude %p",
    (handle) => expect(isExcludedFromAutoReply(handle as string | null | undefined)).toBe(false)
  );

  it("does not match a handle that merely contains an excluded one", () => {
    expect(isExcludedFromAutoReply("tlezjps_backup")).toBe(false);
  });
});
