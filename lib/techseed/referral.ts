// TechSeed referral code + price helpers (pure, shared by client and API).
//
// The price constants below MUST stay in sync with the DB defaults and the
// techseed_apply_referral() trigger in
// supabase/migrations/20260724200000_techseed_signups.sql —
// lib/techseed/__tests__/referral.test.ts asserts they match the SQL text.

// Unambiguous alphabet: no 0/O/1/I/L so codes survive LINE chat + handwriting.
export const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const REFERRAL_CODE_LENGTH = 8;

export const REFERRAL_CODE_PATTERN = /^[A-Z2-9]{8}$/;

export const PRICE_ANCHOR_THB = 2550;
export const PRICE_BASE_THB = 1550;
export const REFERRAL_DISCOUNT_THB = 150;
export const REFERRAL_MAX_COUNTED = 4;
export const PRICE_FLOOR_THB = 950;

// Largest multiple of the alphabet length that fits in a byte. Rejection
// sampling above this keeps every character equally likely (256 % 31 != 0).
const REJECTION_THRESHOLD =
  Math.floor(256 / REFERRAL_CODE_ALPHABET.length) * REFERRAL_CODE_ALPHABET.length;

export function generateReferralCode(
  randomValues?: Uint8Array
): string {
  const values =
    randomValues ?? globalThis.crypto.getRandomValues(new Uint8Array(REFERRAL_CODE_LENGTH * 2));
  let code = "";
  for (let i = 0; i < values.length && code.length < REFERRAL_CODE_LENGTH; i += 1) {
    if (values[i] >= REJECTION_THRESHOLD) continue;
    code += REFERRAL_CODE_ALPHABET[values[i] % REFERRAL_CODE_ALPHABET.length];
  }
  if (code.length < REFERRAL_CODE_LENGTH) {
    // Absurdly unlikely (2 bytes worth of rejects); recurse for a fresh draw.
    return generateReferralCode();
  }
  return code;
}

// Mirror of the DB trigger: base - 150 * min(count, 4), floored at 950.
export function priceForReferralCount(count: number): number {
  const counted = Math.min(Math.max(count, 0), REFERRAL_MAX_COUNTED);
  return Math.max(PRICE_BASE_THB - REFERRAL_DISCOUNT_THB * counted, PRICE_FLOOR_THB);
}
