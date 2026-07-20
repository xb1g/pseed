import assert from "node:assert/strict";

import {
  hasTrialAccess,
  resolveTrialStatus,
  TRIAL_PRICE_THB,
  TRIAL_WINDOW_HOURS,
  trialRemainingMs,
  type TrialStatusRow,
} from "../status";

const NOW = new Date("2026-07-19T12:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;
const DEADLINE = new Date(NOW.getTime() + TRIAL_WINDOW_HOURS * HOUR_MS).toISOString();

function makeRow(overrides: Partial<TrialStatusRow> = {}): TrialStatusRow {
  return {
    status: "active",
    payment_deadline: DEADLINE,
    paid_at: null,
    ...overrides,
  };
}

test("trial constants match the paywall contract", () => {
  assert.equal(TRIAL_PRICE_THB, 1490);
  assert.equal(TRIAL_WINDOW_HOURS, 24);
});

test("active trial within the window stays active with access", () => {
  const row = makeRow();
  assert.equal(resolveTrialStatus(row, NOW), "active");
  assert.equal(hasTrialAccess(row, NOW), true);

  const oneMsBeforeDeadline = new Date(new Date(DEADLINE).getTime() - 1);
  assert.equal(resolveTrialStatus(row, oneMsBeforeDeadline), "active");
  assert.equal(hasTrialAccess(row, oneMsBeforeDeadline), true);
});

test("active trial past the deadline resolves to expired without access", () => {
  const row = makeRow();
  const afterDeadline = new Date(new Date(DEADLINE).getTime() + 1);
  assert.equal(resolveTrialStatus(row, afterDeadline), "expired");
  assert.equal(hasTrialAccess(row, afterDeadline), false);
});

test("active trial exactly at the deadline keeps access", () => {
  const row = makeRow();
  const atDeadline = new Date(DEADLINE);
  assert.equal(resolveTrialStatus(row, atDeadline), "active");
  assert.equal(hasTrialAccess(row, atDeadline), true);
});

test("pending trial never expires and keeps access within and past the window", () => {
  const row = makeRow({ status: "pending" });
  assert.equal(resolveTrialStatus(row, NOW), "pending");
  assert.equal(hasTrialAccess(row, NOW), true);

  const longPastDeadline = new Date(new Date(DEADLINE).getTime() + 30 * 24 * HOUR_MS);
  assert.equal(resolveTrialStatus(row, longPastDeadline), "pending");
  assert.equal(hasTrialAccess(row, longPastDeadline), true);
});

test("paid trial keeps access regardless of the deadline", () => {
  const paidRow = makeRow({
    status: "paid",
    paid_at: "2026-07-19T18:00:00.000Z",
  });
  assert.equal(resolveTrialStatus(paidRow, NOW), "paid");
  assert.equal(hasTrialAccess(paidRow, NOW), true);

  const longPastDeadline = new Date(new Date(DEADLINE).getTime() + 365 * 24 * HOUR_MS);
  assert.equal(resolveTrialStatus(paidRow, longPastDeadline), "paid");
  assert.equal(hasTrialAccess(paidRow, longPastDeadline), true);
});

test("stored expired status stays expired without access", () => {
  const row = makeRow({ status: "expired" });
  assert.equal(resolveTrialStatus(row, NOW), "expired");
  assert.equal(hasTrialAccess(row, NOW), false);
});

test("trialRemainingMs counts down within the window and clamps at zero after it", () => {
  assert.equal(trialRemainingMs(DEADLINE, NOW), TRIAL_WINDOW_HOURS * HOUR_MS);
  assert.equal(trialRemainingMs(DEADLINE, new Date(DEADLINE)), 0);
  assert.equal(
    trialRemainingMs(DEADLINE, new Date(new Date(DEADLINE).getTime() + HOUR_MS)),
    0
  );
});
