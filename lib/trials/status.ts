export const TRIAL_PRICE_THB = 1490;
export const TRIAL_WINDOW_HOURS = 24;

export type TrialStatus = "active" | "pending" | "paid" | "expired";

export interface TrialStatusRow {
  status: TrialStatus;
  payment_deadline: string;
  paid_at: string | null;
}

export function trialRemainingMs(
  paymentDeadline: string,
  now: Date = new Date()
): number {
  return Math.max(0, new Date(paymentDeadline).getTime() - now.getTime());
}

export function resolveTrialStatus(
  row: TrialStatusRow,
  now: Date = new Date()
): TrialStatus {
  if (row.status === "paid" || row.paid_at) return "paid";
  if (row.status === "pending") return "pending";
  if (row.status === "expired") return "expired";
  return now.getTime() <= new Date(row.payment_deadline).getTime()
    ? "active"
    : "expired";
}

export function hasTrialAccess(
  row: TrialStatusRow,
  now: Date = new Date()
): boolean {
  return resolveTrialStatus(row, now) !== "expired";
}
