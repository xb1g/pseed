import { chatDeepLink } from "@/lib/dm-leads/chat-link";

const base = { platform: "instagram" as const, platform_user_id: "17841400000" };

describe("chatDeepLink", () => {
  it("builds an Instagram messaging link from the handle", () => {
    expect(chatDeepLink({ ...base, username: "passion_seed.th" })).toBe(
      "https://ig.me/m/passion_seed.th"
    );
  });

  it("strips a leading @", () => {
    expect(chatDeepLink({ ...base, username: "@minmin_01" })).toBe(
      "https://ig.me/m/minmin_01"
    );
  });

  it("uses Messenger for facebook threads", () => {
    expect(
      chatDeepLink({ ...base, platform: "facebook", username: "someone" })
    ).toBe("https://m.me/someone");
  });

  // A profile-page fallback would send the operator somewhere useless only
  // after they had already switched apps.
  it("returns null with no handle rather than guessing a URL", () => {
    expect(chatDeepLink({ ...base, username: null })).toBeNull();
    expect(chatDeepLink({ ...base, username: "   " })).toBeNull();
  });

  it("rejects handles that cannot be real, so a bad row cannot build a bad link", () => {
    expect(chatDeepLink({ ...base, username: "has space" })).toBeNull();
    expect(chatDeepLink({ ...base, username: "../../evil" })).toBeNull();
    expect(chatDeepLink({ ...base, username: "a".repeat(31) })).toBeNull();
  });
});
