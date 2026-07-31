// ProjectSeed batch 1 offer constants.
//
// Single source of truth for every number on a ProjectSeed surface. The reason
// this file exists: TechSeed's price lived in `lib/techseed/referral.ts` while
// ProjectSeed's lived in prose in docs/project/PROJECTSEED-STRATEGY.md, and the
// two drifted into a live 1,550฿ page undercutting a 2,990฿ offer. Numbers go
// here, and the doc cites them — not the other way round.
//
// Source: docs/project/PROJECTSEED-STRATEGY.md (APPROVED, amended 2026-07-29).

/**
 * Single tier, no founding promo. Deliberately labelled a *validation* price:
 * batch 2 pricing is unpromised in writing to every batch-1 buyer, pending
 * mentor-hours-per-student data (PS-207).
 */
export const PRICE_THB = 2990;

export const TOTAL_SEATS = 20;

/** 10% of every batch, every batch. */
export const SCHOLARSHIP_SEATS = 2;

export const PAYING_SEATS = TOTAL_SEATS - SCHOLARSHIP_SEATS;

/**
 * Referral credit is earned ONLY for referring M4-M5 juniors, never M6 peers —
 * M6 students compete for the same university seats, so asking one to refer an
 * M6 friend is asking them to recruit a rival. The amount is still to be
 * re-derived for a 2,990฿ base (the shipped TechSeed ladder was calibrated for
 * 1,550฿), so no figure is published yet.
 */
export const REFERRAL_ELIGIBLE_GRADES = ["M4", "M5"] as const;

/**
 * Batch 1 is not open for sale. `PROJECTSEED-SAFEGUARDING.md` §11 forbids
 * offering, selling, or accepting payment for a seat until every launch-gate
 * item is complete, and four remain open (deputy safeguarding lead, dedicated
 * reporting inbox, Thai translation, mentor screening). Deliverable #1 is also
 * still undefined, which the refund policy depends on.
 *
 * While this is false the page must invite a conversation, never take money.
 */
export const IS_OPEN_FOR_SALE = false;

export const CONTACT = {
  /** Same LINE OA account used by /techseed. */
  lineQrUrl: "https://qr-official.line.me/gs/M_161irjbq_BW.png?oat_content=qr",
  /** Internal redirect to the community server. */
  discordPath: "/discord",
} as const;

export function formatThb(amount: number): string {
  return `${new Intl.NumberFormat("th-TH").format(amount)}฿`;
}
