import {
  getAgeYears,
  isProfileComplete,
  requiresGuardianConsent,
} from "./profile-completion";

const minorProfile = {
  full_name: "Narin Seed",
  username: "narin",
  date_of_birth: "2008-03-12",
};

const adultProfile = {
  full_name: "Adult Seed",
  username: "adult",
  date_of_birth: "2000-01-01",
};

const guardianConsent = {
  guardian_phone: "+66 81 234 5678",
  guardian_relationship: "Mom",
  consent_confirmed_at: "2026-08-11T08:00:00.000Z",
};

const asOf = new Date("2026-08-11T12:00:00.000Z");

describe("getAgeYears", () => {
  it("computes whole years before birthday", () => {
    expect(getAgeYears("2008-03-12", asOf)).toBe(18);
  });

  it("subtracts a year when birthday has not occurred yet", () => {
    expect(getAgeYears("2008-12-01", asOf)).toBe(17);
  });
});

describe("requiresGuardianConsent", () => {
  it("requires consent for 18 and under", () => {
    expect(requiresGuardianConsent("2008-03-12", asOf)).toBe(true);
    expect(requiresGuardianConsent("2010-01-01", asOf)).toBe(true);
  });

  it("skips consent for 19+", () => {
    expect(requiresGuardianConsent("2000-01-01", asOf)).toBe(false);
    expect(requiresGuardianConsent("2007-08-10", asOf)).toBe(false);
  });
});

describe("isProfileComplete", () => {
  it("accepts a minor profile with guardian consent", () => {
    expect(isProfileComplete(minorProfile, guardianConsent, asOf)).toBe(true);
  });

  it("accepts an adult profile without guardian consent", () => {
    expect(isProfileComplete(adultProfile, null, asOf)).toBe(true);
  });

  it.each([
    "guardian_phone",
    "guardian_relationship",
    "consent_confirmed_at",
  ] as const)("requires %s for minors", (field) => {
    expect(
      isProfileComplete(
        minorProfile,
        { ...guardianConsent, [field]: null },
        asOf
      )
    ).toBe(false);
  });
});
