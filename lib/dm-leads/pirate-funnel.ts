/**
 * AARRR over the DM inbox and PathLab.
 *
 * The scoreboard strip answers "how are we selling this week". This answers
 * "where does the business leak", which is a different question and needs the
 * full width of the funnel — from a stranger commenting to a student shipping.
 *
 * Two deliberate choices:
 *
 * 1. **Every stage is a subset of the one above it.** A step-to-step conversion
 *    is only meaningful if the denominator is the previous stage's population,
 *    so `revenue` counts people who are also in `activation`. Stages that
 *    cannot be expressed that way do not belong on this chart.
 *
 * 2. **Referral is measured, not estimated.** We have no referral tracking, so
 *    it reports `null` rather than 0. Zero is a finding; unmeasured is an
 *    instruction to go build the measurement, and conflating them is how a
 *    dashboard starts lying.
 */

export type PirateStage =
  | "acquisition"
  | "activation"
  | "retention"
  | "revenue"
  | "referral";

export interface PirateStageMeta {
  key: PirateStage;
  label: string;
  /** What one person in this stage actually did. */
  definition: string;
  /** Where the number comes from, so a surprising value is checkable. */
  source: string;
}

export const PIRATE_STAGES: PirateStageMeta[] = [
  {
    key: "acquisition",
    label: "รู้จักเรา",
    definition: "มีบทสนทนาใน DM กับเรา ไม่ว่าใครเริ่มก่อน",
    source: "dm_conversations (ไม่รวมบัญชีภายใน)",
  },
  {
    key: "activation",
    label: "คุยจริง",
    definition: "น้องตอบกลับอย่างน้อย 1 ครั้ง",
    source: "dm_conversation_signals.has_inbound",
  },
  {
    key: "retention",
    label: "คุยต่อเนื่อง",
    definition: "น้องตอบกลับตั้งแต่ 3 ครั้งขึ้นไป ไม่ใช่ตอบครั้งเดียวแล้วหาย",
    source: "นับ dm_messages ขาเข้าต่อเธรด",
  },
  {
    key: "revenue",
    label: "จ่ายเงิน",
    definition: "สมัคร PathLab จากเธรด DM นี้",
    source: "ยังไม่มีตารางจับคู่ DM กับ path_enrollments",
  },
  {
    key: "referral",
    label: "บอกต่อ",
    definition: "ชวนเพื่อนมา หรือมาเพราะเพื่อนแนะนำ",
    source: "ยังไม่มีการวัด",
  },
];

export interface PirateFunnel {
  counts: Record<PirateStage, number | null>;
  /**
   * The stage where the largest share of the previous stage is lost. This is
   * the only number on the chart that tells you what to do next.
   */
  worstDropoff: { stage: PirateStage; lostPct: number } | null;
}

export interface PirateFunnelInput {
  totalConversations: number;
  engagedConversations: number;
  /** Threads with 3+ inbound messages. */
  sustainedConversations: number;
  /** Null until DM-to-enrollment attribution exists. */
  enrollments: number | null;
  /** Null until referral tracking exists. */
  referrals: number | null;
}

export function computePirateFunnel(input: PirateFunnelInput): PirateFunnel {
  const counts: Record<PirateStage, number | null> = {
    acquisition: input.totalConversations,
    activation: input.engagedConversations,
    retention: input.sustainedConversations,
    revenue: input.enrollments,
    referral: input.referrals,
  };

  const ordered: PirateStage[] = [
    "acquisition",
    "activation",
    "retention",
    "revenue",
  ];

  let worst: { stage: PirateStage; lostPct: number } | null = null;
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = counts[ordered[i - 1]];
    const current = counts[ordered[i]];
    if (previous === null || current === null || previous === 0) continue;
    const lostPct = Math.round(((previous - current) / previous) * 100);
    if (!worst || lostPct > worst.lostPct) {
      worst = { stage: ordered[i], lostPct };
    }
  }

  return { counts, worstDropoff: worst };
}

/** Share of the previous stage that survived into this one. */
export function stageConversion(
  funnel: PirateFunnel,
  stage: PirateStage
): number | null {
  const order: PirateStage[] = [
    "acquisition",
    "activation",
    "retention",
    "revenue",
    "referral",
  ];
  const index = order.indexOf(stage);
  if (index <= 0) return null;

  const previous = funnel.counts[order[index - 1]];
  const current = funnel.counts[stage];
  if (previous === null || current === null || previous === 0) return null;
  return Math.round((current / previous) * 100);
}
