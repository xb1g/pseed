import assert from "node:assert/strict";

import {
  generateReferralCode,
  priceForReferralCount,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_LENGTH,
  REFERRAL_CODE_PATTERN,
} from "../referral";

test("referral codes are 8 chars from the unambiguous alphabet", () => {
  for (let i = 0; i < 50; i += 1) {
    const code = generateReferralCode();
    assert.equal(code.length, REFERRAL_CODE_LENGTH);
    assert.match(code, REFERRAL_CODE_PATTERN);
  }
});

test("alphabet excludes ambiguous characters 0/O/1/I/L", () => {
  for (const ambiguous of ["0", "O", "1", "I", "L"]) {
    assert.equal(REFERRAL_CODE_ALPHABET.includes(ambiguous), false);
  }
});

test("referral price steps down 150 THB per friend and floors at 950", () => {
  assert.equal(priceForReferralCount(0), 1550);
  assert.equal(priceForReferralCount(1), 1400);
  assert.equal(priceForReferralCount(2), 1250);
  assert.equal(priceForReferralCount(3), 1100);
  assert.equal(priceForReferralCount(4), 950);
  assert.equal(priceForReferralCount(5), 950);
  assert.equal(priceForReferralCount(100), 950);
});

test("negative referral counts never price above base", () => {
  assert.equal(priceForReferralCount(-3), 1550);
});

test("price constants match the DB migration (drift guard)", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const sql = fs.readFileSync(
    path.join(
      __dirname,
      "../../../supabase/migrations/20260724200000_techseed_signups.sql"
    ),
    "utf8"
  );
  // Table defaults
  assert.match(sql, /price_anchor int not null default 2550/);
  assert.match(sql, /price_base int not null default 1550/);
  // Trigger math: -150 per referral, max 4 counted, floor 950
  assert.match(sql, /150 \* least\(referral_count \+ 1, 4\)/);
  assert.match(sql, /950/);
});
