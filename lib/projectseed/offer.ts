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
 * Deliverable #1 — the refund boundary, and the first checkpoint of the quality
 * bar. Defined 2026-08-01; until then the refund promise was live on a public
 * page with no boundary, which is an unbounded liability.
 *
 * Deliberately small, dated, and disputable-proof: a parent and a founder must
 * be able to agree on whether it was submitted without a judgement call. It is
 * also the design-thinking step that already worked at the hackathon, so it
 * doubles as the activation event rather than being busywork bolted onto a
 * refund clause.
 */
export const DELIVERABLE_ONE = {
  dueDayOfProgramme: 7,
  /** Both parts required. Either one alone does not close the refund window. */
  parts: [
    "เขียนปัญหาที่จะแก้ ความยาว 1 หน้า",
    "ไปคุยกับคนที่เจอปัญหานั้นจริง 3 คน แล้วจดว่าเขาพูดว่าอะไร",
  ],
} as const;

/**
 * The quality bar, as amended 2026-08-01. The previous bar was whether a
 * project counted as a "passion project" that would self-actualise the student
 * — a standard that was never written down and that rejected the scratch-your-
 * own-itch projects students pick for themselves, which are the ones most
 * likely to actually ship. The only differentiator between this programme and a
 * portfolio consultancy is whether the student does the work, so the bar is now
 * observable rather than spiritual.
 */
export const SHIPPED_BAR = [
  "น้องเลือกเอง ไม่ใช่เราสั่ง",
  "ทำจนเสร็จ ใช้งานได้จริง",
  "มีคนจริงอย่างน้อย 3 คนที่ใช้หรือให้ความเห็น",
] as const;

/**
 * Batch 1 is back-solved from the TCAS Round 1 portfolio submission window,
 * which is the wedge — M6 urgency is supplied by the calendar for free, so no
 * manufactured seat scarcity is needed.
 *
 * No exact dates are published here on purpose: the window varies by
 * university and has not been verified per institution. Publishing a date we
 * have not checked, to a parent whose child's admission depends on it, is the
 * one error on this page that could actually hurt someone.
 */
export const PROGRAMME_WEEKS = 16;

/** Per-week anchor: PRICE_THB ÷ PROGRAMME_WEEKS, rounded (2,990 ÷ 16 ≈ 187).
 *  Used on the landing page's price anchoring. Derived, never hand-typed. */
export const WEEKLY_PRICE_THB = Math.round(PRICE_THB / PROGRAMME_WEEKS);

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
  /**
   * The 20-minute call. This is the only acquisition channel with evidence
   * behind it — every booking batch 1 has received came through it — and until
   * 2026-08-01 it was reachable only from /link, never from this page.
   *
   * While IS_OPEN_FOR_SALE is false this is also the *only* legitimate primary
   * action: safeguarding §11 forbids offering or selling a seat, but nothing
   * forbids a conversation.
   */
  bookingUrl: "https://calendly.com/seedpassion/30min",
} as const;

export function formatThb(amount: number): string {
  return `${new Intl.NumberFormat("th-TH").format(amount)}฿`;
}
