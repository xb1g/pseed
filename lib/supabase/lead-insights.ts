/**
 * Read-only aggregations behind /admin/dm-leads/insights.
 *
 * Internal-tagged conversations (founder, team accounts) are excluded
 * everywhere, matching the inbox. Message-derived signals reuse the shared
 * `getDmLeadSignals()` cache so these numbers agree with the inbox scoreboard.
 */
import { createAdminClient } from "@/utils/supabase/admin";
import { getDmLeadSignals } from "@/lib/supabase/dm-leads";
import {
  COVERED_FIELDS,
  getFieldCoverage,
  isQualified,
  pct,
  type FieldCoverage,
} from "@/lib/dm-leads/playbook";
import { signalsFor } from "@/lib/dm-leads/signals";
import type { DmLeadStage } from "@/types/dm-leads";

const INTERNAL_TAG_FILTER = `{internal}`;
const PAGE_SIZE = 1000;

export interface LeadFunnelStage {
  key: string;
  label: string;
  count: number;
  /** % of the previous stage that reached this one. Null on the first stage. */
  conversionFromPrev: number | null;
}

interface LeadConversationRow {
  id: string;
  stage: DmLeadStage;
  grade_level: string | null;
  interests: string[] | null;
  lead_status: string;
  wants_pathlab: boolean;
  pathlab_pay_ready: boolean;
  wants_community: boolean;
  wants_talent: boolean;
}

/** Every non-internal conversation, paged past the 1000-row PostgREST cap. */
async function getLeadConversationRows(): Promise<LeadConversationRow[]> {
  const supabase = createAdminClient();
  const rows: LeadConversationRow[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("dm_conversations")
      .select(
        "id, stage, grade_level, interests, lead_status, wants_pathlab, pathlab_pay_ready, wants_community, wants_talent"
      )
      .not("admin_tags", "cs", INTERNAL_TAG_FILTER)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching dm_conversations for insights:", error);
      throw new Error("Failed to compute lead insights");
    }

    const page = (data ?? []) as LeadConversationRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

/** Distinct commenters on ig_comments, keyed by ig_user_id ?? username. */
async function getUniqueCommenterCount(): Promise<number> {
  const supabase = createAdminClient();
  const commenters = new Set<string>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("ig_comments")
      .select("ig_user_id, username")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching ig_comments for insights:", error);
      throw new Error("Failed to compute lead insights");
    }

    const page = data ?? [];
    for (const row of page) {
      const key = row.ig_user_id ?? row.username;
      if (key) commenters.add(key);
    }
    if (page.length < PAGE_SIZE) break;
  }

  return commenters.size;
}

/**
 * Comment-to-conversion funnel. Stages after "DM threads" are cumulative
 * subsets so the bars stay monotonic: e.g. "qualified" means engaged AND we
 * know both grade and interests.
 */
export async function getLeadFunnelStats(): Promise<LeadFunnelStage[]> {
  const [commenterCount, rows, signals] = await Promise.all([
    getUniqueCommenterCount(),
    getLeadConversationRows(),
    getDmLeadSignals(),
  ]);

  let engaged = 0;
  let qualified = 0;
  let offerMade = 0;
  let priceStated = 0;
  let converted = 0;

  for (const row of rows) {
    const signal = signalsFor(signals, row.id);
    const isEngaged = signal.hasInbound;
    if (isEngaged) engaged += 1;
    const meetsQualification = isEngaged && isQualified(row);
    if (meetsQualification) qualified += 1;
    const hasOffer = meetsQualification && signal.offerMade;
    if (hasOffer) offerMade += 1;
    if (hasOffer && signal.priceMentioned) priceStated += 1;
    if (row.lead_status === "converted") converted += 1;
  }

  const counts: [key: string, label: string, count: number][] = [
    ["commenters", "IG commenters", commenterCount],
    ["threads", "DM threads", rows.length],
    ["engaged", "Engaged (replied)", engaged],
    ["qualified", "Qualified (grade + field)", qualified],
    ["offer", "Offer made", offerMade],
    ["price", "Price stated", priceStated],
    ["converted", "Converted", converted],
  ];

  return counts.map(([key, label, count], index) => ({
    key,
    label,
    count,
    conversionFromPrev: index === 0 ? null : pct(count, counts[index - 1][2]),
  }));
}

export interface InterestFrequency {
  interest: string;
  count: number;
  covered: boolean;
}

export interface LeadAudienceStats {
  totalConversations: number;
  /** Interest mentions, most frequent first. ig_comments has no interests. */
  interestFrequency: InterestFrequency[];
  /** Conversations by whether their field has a PathLab seed today. */
  coverageCounts: Record<FieldCoverage, number>;
  stageCounts: Record<DmLeadStage, number>;
  /** Grade labels, most frequent first; unclassified leads bucketed as "—". */
  gradeCounts: { grade: string; count: number }[];
  intentCounts: {
    wantsPathlab: number;
    payReady: number;
    wantsCommunity: number;
    wantsTalent: number;
  };
}

export async function getLeadAudienceStats(): Promise<LeadAudienceStats> {
  const rows = await getLeadConversationRows();

  const interestCounts = new Map<string, number>();
  const coverageCounts: Record<FieldCoverage, number> = {
    covered: 0,
    uncovered: 0,
    unknown: 0,
  };
  const stageCounts: Record<DmLeadStage, number> = {
    unknown: 0,
    exploring: 0,
    building: 0,
    job_seeking: 0,
  };
  const gradeCounts = new Map<string, number>();
  const intentCounts = {
    wantsPathlab: 0,
    payReady: 0,
    wantsCommunity: 0,
    wantsTalent: 0,
  };

  for (const row of rows) {
    for (const raw of row.interests ?? []) {
      const interest = raw.trim();
      if (interest) interestCounts.set(interest, (interestCounts.get(interest) ?? 0) + 1);
    }
    coverageCounts[getFieldCoverage(row.interests)] += 1;
    if (row.stage in stageCounts) stageCounts[row.stage] += 1;
    const grade = row.grade_level?.trim() || "—";
    gradeCounts.set(grade, (gradeCounts.get(grade) ?? 0) + 1);
    if (row.wants_pathlab) intentCounts.wantsPathlab += 1;
    if (row.pathlab_pay_ready) intentCounts.payReady += 1;
    if (row.wants_community) intentCounts.wantsCommunity += 1;
    if (row.wants_talent) intentCounts.wantsTalent += 1;
  }

  const interestFrequency = [...interestCounts.entries()]
    .map(([interest, count]) => ({
      interest,
      count,
      covered: COVERED_FIELDS.has(interest),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalConversations: rows.length,
    interestFrequency,
    coverageCounts,
    stageCounts,
    gradeCounts: [...gradeCounts.entries()]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => b.count - a.count),
    intentCounts,
  };
}
