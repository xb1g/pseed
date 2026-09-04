import type { WorkItem } from "./work-items";

export type ProductBetStatus = "decide" | "validate" | "build" | "learn" | "done";

export interface ProductBet {
  id: string;
  title: string;
  evidence: string;
  segment: string;
  hypothesis: string;
  passBar: string;
  result: string;
  nextMove: string;
  decision: string;
  status: ProductBetStatus;
  owner: string;
  dueOn: string | null;
}

export const PRODUCT_LOOP = [
  { label: "Evidence", detail: "What behavior proves the problem exists?" },
  { label: "Hypothesis", detail: "What must be true, for whom?" },
  { label: "Test", detail: "What is the cheapest credible collision?" },
  { label: "Pass bar", detail: "What result changes the decision?" },
  { label: "Decide", detail: "Persevere, pivot, or stop?" },
] as const;

export const PMF_SIGNALS = [
  {
    label: "Paid pull",
    question: "Will the right students and parents commit at the intended price?",
    measure: "Full-price seat fill, qualified-to-paid conversion, time to fill",
  },
  {
    label: "Repeated value",
    question: "Do students repeatedly ship credible proof of work and keep building?",
    measure: "Day 7 ship rate, case-study completion, 30-day continuation",
  },
  {
    label: "Compounding pull",
    question: "Does delivered value make the next cohort easier to sell and serve?",
    measure: "Referral share, TechSeed to SHIFT progression, margin and mentor hours",
  },
] as const;

export const PMF_DECISION_RULE =
  "Do not claim PMF from reach, praise, or one strong cohort. Require paid pull, repeated value, and compounding pull across three consecutive cohorts.";

export const PRODUCT_BETS: ProductBet[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    title: "Make the TechSeed → SHIFT ladder legible",
    evidence: "The current public prices invert the intended commitment ladder.",
    segment: "Students with portfolio urgency and the parents approving the purchase.",
    hypothesis: "A readiness-based chooser will reduce offer confusion and make the intended price feel coherent.",
    passBar: "In 10 live conversations, at least 8 people choose the right program without founder explanation.",
    result: "Not tested yet.",
    nextMove: "Choose the real price, audience, and entry rule before BOFU traffic starts.",
    decision: "Pricing and positioning",
    status: "decide",
    owner: "Founder",
    dueOn: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    title: "Forward-to-parent sales packet",
    evidence: "High-intent students stall when they need to explain the purchase at home.",
    segment: "Interested students who need parent approval before paying.",
    hypothesis: "A one-page parent packet will preserve intent through the parent handoff.",
    passBar: "Test 5 live handoffs. At least 3 proceed to a parent conversation without re-explaining the basics.",
    result: "Not tested yet.",
    nextMove: "Test one shareable page in five active sales conversations.",
    decision: "Does it increase priced conversations?",
    status: "build",
    owner: "Growth",
    dueOn: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    title: "Route PORT comments by readiness",
    evidence: "The portfolio tier-list format already creates high-volume comment intent.",
    segment: "Students who comment PORT but differ in readiness and urgency.",
    hypothesis: "Three qualifying questions will route each lead to useful help or the right paid offer.",
    passBar: "Across 30 leads, route at least 70% confidently and move at least 20% into a qualified conversation.",
    result: "Not tested yet.",
    nextMove: "Ask grade, target field, and current project state before sending an offer.",
    decision: "TechSeed, SHIFT, or free help",
    status: "validate",
    owner: "Marketing",
    dueOn: null,
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    title: "Turn every cohort into reusable proof",
    evidence: "Student work and pivot moments are stronger than generic testimonials.",
    segment: "Consenting TechSeed and SHIFT students completing real project work.",
    hypothesis: "Structured proof captured during delivery will outperform retrospective testimonials in sales.",
    passBar: "Capture complete evidence for 80% of consenting finishers and reuse it in 3 qualified sales conversations.",
    result: "Not tested yet.",
    nextMove: "Capture consented before, failure, decision, and after evidence during delivery.",
    decision: "Which evidence predicts the next sale?",
    status: "learn",
    owner: "Program",
    dueOn: null,
  },
];

const FALLBACK_TIMESTAMP = "2026-09-04T00:00:00.000Z";

export const PRODUCT_WORK_ITEMS: WorkItem[] = PRODUCT_BETS.map((bet, index) => ({
  id: bet.id,
  area: "product",
  kind: "bet",
  title: bet.title,
  description: bet.evidence,
  status: bet.status,
  funnelStage: null,
  channel: null,
  offer: null,
  ownerName: bet.owner,
  dueOn: bet.dueOn,
  position: (index + 1) * 10,
  details: {
    segment: bet.segment,
    hypothesis: bet.hypothesis,
    passBar: bet.passBar,
    result: bet.result,
    nextMove: bet.nextMove,
    decision: bet.decision,
  },
  createdBy: null,
  createdAt: FALLBACK_TIMESTAMP,
  updatedAt: FALLBACK_TIMESTAMP,
}));

export function workItemToProductBet(item: WorkItem): ProductBet {
  const fallback = PRODUCT_BETS.find((bet) => bet.id === item.id);

  return {
    id: item.id,
    title: item.title,
    evidence: item.description,
    segment: item.details.segment ?? fallback?.segment ?? "Name the exact student or parent segment.",
    hypothesis: item.details.hypothesis ?? fallback?.hypothesis ?? "Write the belief this test could disprove.",
    passBar: item.details.passBar ?? fallback?.passBar ?? "Set a measurable pass bar before running the test.",
    result: item.details.result ?? fallback?.result ?? "Not measured yet.",
    nextMove: item.details.nextMove ?? "Choose the next move",
    decision: item.details.decision ?? "Name the decision this unlocks",
    status: item.status as ProductBetStatus,
    owner: item.ownerName,
    dueOn: item.dueOn ?? null,
  };
}
