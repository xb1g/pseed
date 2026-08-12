export type ProfileCompletionFields = {
  full_name: string | null;
  username: string | null;
  date_of_birth: string | null;
};

export type GuardianConsentFields = {
  guardian_phone: string | null;
  guardian_relationship: string | null;
  consent_confirmed_at: string | null;
};

export const PROFILE_COMPLETION_SELECT =
  "full_name, username, date_of_birth";

/** Whole years since DOB. Returns null if DOB unparseable. */
export function getAgeYears(
  dateOfBirth: string,
  now: Date = new Date()
): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  let age = now.getFullYear() - year;
  const monthNow = now.getMonth() + 1;
  const dayNow = now.getDate();
  if (monthNow < month || (monthNow === month && dayNow < day)) {
    age -= 1;
  }

  return age;
}

/** Parent/guardian approval required only for ages 18 and under. */
export function requiresGuardianConsent(
  dateOfBirth: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!dateOfBirth) return false;
  const age = getAgeYears(dateOfBirth, now);
  return age !== null && age <= 18;
}

export function isProfileComplete(
  profile: Partial<ProfileCompletionFields> | null | undefined,
  guardian: Partial<GuardianConsentFields> | null | undefined,
  now: Date = new Date()
): boolean {
  const hasBasics = Boolean(
    profile?.full_name?.trim() &&
      profile?.username?.trim() &&
      profile?.date_of_birth
  );
  if (!hasBasics) return false;

  if (!requiresGuardianConsent(profile?.date_of_birth, now)) {
    return true;
  }

  return Boolean(
    guardian?.guardian_phone?.trim() &&
      guardian?.guardian_relationship?.trim() &&
      guardian?.consent_confirmed_at
  );
}
