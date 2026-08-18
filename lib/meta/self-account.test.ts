import { isSelfAuthored } from "@/lib/meta/self-account";

describe("isSelfAuthored", () => {
  const ORIGINAL_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  afterEach(() => {
    if (ORIGINAL_ID === undefined) delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    else process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = ORIGINAL_ID;
  });

  it("matches our own account by id", () => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "17841400000000000";
    expect(isSelfAuthored({ igUserId: "17841400000000000", username: null })).toBe(true);
  });

  it("matches our own account by username when the env var is unset", () => {
    delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    expect(isSelfAuthored({ igUserId: "999", username: "passion_seed.th" })).toBe(true);
  });

  it("ignores case and surrounding whitespace on the username", () => {
    delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    expect(isSelfAuthored({ igUserId: null, username: "  Passion_Seed.TH " })).toBe(true);
  });

  it("does not match a real commenter", () => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "17841400000000000";
    expect(isSelfAuthored({ igUserId: "555", username: "chirathita_v2" })).toBe(false);
  });

  it("does not match when both signals are absent", () => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "17841400000000000";
    expect(isSelfAuthored({ igUserId: null, username: null })).toBe(false);
  });

  it("does not treat an empty env var as a wildcard", () => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "";
    expect(isSelfAuthored({ igUserId: "", username: "someone_else" })).toBe(false);
  });
});
