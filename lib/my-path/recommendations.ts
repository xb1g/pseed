import { resolvePlanEntry } from "./entries";
import { getSavedPossibilities } from "./journey";
import type {
  DirectionHypothesis,
  MyPathDraft,
  NextStep,
  PlanningFacet,
  PlanningRegistry,
  RecommendationLane,
} from "./types";

const FACET_LABELS: Record<PlanningFacet, string> = {
  analytical: "ได้คิดวิเคราะห์ลึก",
  autonomy: "มีพื้นที่ให้คิดเอง",
  creativity: "ได้สร้างของจริง",
  flexibility: "จัดวิธีทำงานได้ยืดหยุ่น",
  growth: "ยังเติบโตไปได้หลายทาง",
  helping: "เห็นผลกับชีวิตคนอื่น",
  "human-contact": "ได้ทำงานกับผู้คน",
  income: "มีโอกาสทางรายได้",
  innovation: "ได้ทดลองสิ่งใหม่",
  stability: "มีความมั่นคงที่คาดการณ์ได้",
};

const ANSWER_FACETS: Record<string, PlanningFacet> = {
  work: "creativity",
  lifestyle: "flexibility",
  income: "income",
  create: "innovation",
  help: "helping",
  freedom: "autonomy",
  stability: "stability",
  creativity: "creativity",
};

function addScore(
  scores: Map<PlanningFacet, number>,
  facets: PlanningFacet[],
  amount: number
) {
  for (const facet of facets) scores.set(facet, (scores.get(facet) ?? 0) + amount);
}

function scoreFacets(
  draft: MyPathDraft,
  registry: PlanningRegistry
): Array<[PlanningFacet, number]> {
  const scores = new Map<PlanningFacet, number>();
  const personalEvents = draft.events.filter((event) => event.type !== "entry_viewed").length;
  const entryWeight = personalEvents === 0 ? 2 : personalEvents < 3 ? 1 : 0.25;
  for (const slug of resolvePlanEntry(draft.entryKey).initialSlugs) {
    const item = registry[slug];
    if (item) addScore(scores, item.facets.slice(0, 2), entryWeight);
  }
  for (const possibility of Object.values(draft.possibilities)) {
    const item = registry[possibility.slug];
    if (!item) continue;
    const stateWeight = {
      explored: possibility.meaningfulOpen ? 3 : 2,
      saved: 5,
      dismissed: -1,
      removed: -5,
    }[possibility.state];
    addScore(scores, item.facets, stateWeight);
    if (possibility.compared) addScore(scores, item.facets, 2);
    if (possibility.radarOpened) addScore(scores, item.facets, 1);
  }
  for (const answer of Object.values(draft.answers)) {
    const facet = ANSWER_FACETS[answer];
    if (facet) addScore(scores, [facet], 9);
  }
  return [...scores.entries()].sort(
    ([facetA, scoreA], [facetB, scoreB]) =>
      scoreB - scoreA || facetA.localeCompare(facetB)
  );
}

export function buildDirectionHypothesis(
  draft: MyPathDraft,
  registry: PlanningRegistry
): DirectionHypothesis {
  const ranked = scoreFacets(draft, registry);
  const facets = ranked.slice(0, 3).map(([facet]) => facet);
  const signalCount =
    Object.keys(draft.possibilities).length + Object.keys(draft.answers).length;
  const fallback: PlanningFacet[] = ["creativity", "autonomy", "growth"];
  const displayFacets = facets.length >= 3 ? facets : Array.from(new Set([...facets, ...fallback])).slice(0, 3);
  const generatedStatement = displayFacets
    .map((facet) => FACET_LABELS[facet])
    .join(" + ");
  const broaderStatement = `ยังเปิดกว้างระหว่างเส้นทางที่${displayFacets
    .slice(0, 2)
    .map((facet) => FACET_LABELS[facet])
    .join(" และ")}`;
  return {
    statement:
      draft.directionOverride ??
      (draft.rejectedDirections.includes(generatedStatement)
        ? broaderStatement
        : generatedStatement),
    facets: displayFacets,
    disclaimer:
      "นี่เป็นเพียงสมมติฐานจากสิ่งที่คุณสนใจตอนนี้ เปลี่ยนได้เสมอ",
    enoughSignal: signalCount >= 1,
  };
}

function careerSignalScore(draft: MyPathDraft, slug: string): number {
  const possibility = draft.possibilities[slug];
  if (!possibility) return 0;
  return {
    explored: possibility.meaningfulOpen ? 4 : 2,
    saved: 8,
    dismissed: -2,
    removed: -10,
  }[possibility.state] + (possibility.compared ? 3 : 0) + (possibility.radarOpened ? 2 : 0);
}

function overlap<T>(a: T[], b: T[]): number {
  const other = new Set(b);
  return a.filter((item) => other.has(item)).length;
}

function explainRecommendation(
  draft: MyPathDraft,
  slug: string,
  registry: PlanningRegistry
): string {
  const saved = getSavedPossibilities(draft)[0];
  const answer = Object.values(draft.answers)[0];
  const answerFacet = answer ? ANSWER_FACETS[answer] : undefined;
  if (saved && registry[saved.slug]) {
    const commonFacet = registry[slug].facets.find((facet) =>
      registry[saved.slug].facets.includes(facet)
    );
    if (answerFacet && registry[slug].facets.includes(answerFacet)) {
      return `แนะนำเพราะคุณบันทึก ${registry[saved.slug].titleTh} และให้ความสำคัญกับ${FACET_LABELS[answerFacet]}`;
    }
    return `แนะนำเพราะคุณบันทึก ${registry[saved.slug].titleTh} และเส้นทางนี้ก็${FACET_LABELS[commonFacet ?? registry[slug].facets[0]]}`;
  }
  return `แนะนำเพราะสิ่งที่คุณเปิดดูบอกว่าคุณอยาก${FACET_LABELS[registry[slug].facets[0]]}`;
}

export function buildRecommendationLanes(
  draft: MyPathDraft,
  registry: PlanningRegistry,
  publishedSlugs: string[]
): RecommendationLane[] {
  const direction = buildDirectionHypothesis(draft, registry);
  const candidates = publishedSlugs
    .filter((slug) => registry[slug] && draft.possibilities[slug]?.state !== "removed")
    .map((slug) => ({
      slug,
      score:
        careerSignalScore(draft, slug) * 10 +
        overlap(registry[slug].facets, direction.facets) * 4 +
        (registry[slug].reelAffinity.includes(draft.entryKey) ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  const strong = candidates[0]?.slug;
  if (!strong) return [];
  const strongItem = registry[strong];
  const used = new Set([strong]);

  const comparing = candidates.find(({ slug }) => {
    if (used.has(slug)) return false;
    const item = registry[slug];
    return (
      strongItem.contrast.includes(slug) ||
      strongItem.adjacent.includes(slug) ||
      overlap(item.capabilities, strongItem.capabilities) > 0
    );
  })?.slug ?? candidates.find(({ slug }) => !used.has(slug))?.slug;
  if (comparing) used.add(comparing);

  const unexpected = candidates.find(({ slug }) => {
    const item = registry[slug];
    return (
      !used.has(slug) &&
      item.family !== strongItem.family &&
      item.family !== registry[comparing ?? strong].family &&
      overlap(item.facets, direction.facets) > 0
    );
  })?.slug ?? candidates.find(({ slug }) => !used.has(slug))?.slug;

  const definitions: Array<{
    id: RecommendationLane["id"];
    title: string;
    slug?: string;
  }> = [
    { id: "strong-signal", title: "สัญญาณชัดตอนนี้", slug: strong },
    { id: "worth-comparing", title: "น่าเอามาเปรียบเทียบ", slug: comparing },
    { id: "unexpected", title: "เส้นทางที่อาจยังไม่ได้นึกถึง", slug: unexpected },
  ];
  return definitions.flatMap((lane) =>
    lane.slug
      ? [{
          id: lane.id,
          title: lane.title,
          recommendation: {
            slug: lane.slug,
            reason: explainRecommendation(draft, lane.slug, registry),
          },
        }]
      : []
  );
}

function resolvedStepIds(draft: MyPathDraft): Set<string> {
  return new Set(
    draft.events
      .filter(
        (event) =>
          (event.type === "step_completed" || event.type === "step_not_useful") &&
          event.stepId
      )
      .map((event) => event.stepId!)
  );
}

export function selectNextStep(
  draft: MyPathDraft,
  registry: PlanningRegistry
): NextStep {
  const saved = getSavedPossibilities(draft);
  const completed = resolvedStepIds(draft);
  for (const possibility of saved) {
    const id = `understand:${possibility.slug}`;
    if (!possibility.meaningfulOpen && !completed.has(id)) {
      return {
        id,
        kind: "understand-career",
        title: `ดูหนึ่งวันจริงของ ${registry[possibility.slug]?.titleTh ?? possibility.slug}`,
        detail: "อ่านเฉพาะส่วนงานประจำวัน แล้วจดหนึ่งอย่างที่ดึงดูดหรือกังวล",
        href: `/radar/${possibility.slug}`,
        durationMinutes: 10,
        careerSlugs: [possibility.slug],
      };
    }
  }

  if (saved.length >= 2) {
    const pair = saved.slice(0, 2).map((item) => item.slug) as [string, string];
    const id = `compare:${[...pair].sort().join(":")}`;
    const alreadyCompared = pair.every((slug) => draft.possibilities[slug]?.compared);
    if (!alreadyCompared && !completed.has(id)) {
      return {
        id,
        kind: "compare-careers",
        title: `เปรียบเทียบ ${registry[pair[0]]?.titleTh} กับ ${registry[pair[1]]?.titleTh}`,
        detail: "ดูความต่างด้านงานจริง วิธีทำงาน และสิ่งที่ควรทดลองก่อนเลือก",
        durationMinutes: 15,
        careerSlugs: pair,
      };
    }
  }

  const openQuestion = draft.savedQuestions.find((question) => question.status === "open");
  if (openQuestion && !completed.has(`question:${openQuestion.id}`)) {
    return {
      id: `question:${openQuestion.id}`,
      kind: "answer-question",
      title: openQuestion.text,
      detail: "ใช้หลักฐานจาก Radar หรือกิจกรรมสั้นๆ เพื่อตอบคำถามนี้",
      durationMinutes: 10,
      careerSlugs: openQuestion.careerSlugs,
    };
  }

  const focus = saved[0] ?? Object.values(draft.possibilities)[0];
  if (focus) {
    const id = `reflect:${focus.slug}`;
    if (!completed.has(id)) {
      return {
        id,
        kind: "radar-reflection",
        title: `ตอบ Reflection ของ ${registry[focus.slug]?.titleTh ?? focus.slug} 1 ข้อ`,
        detail: "บันทึกสิ่งที่ดึงดูด สิ่งที่กังวล หรือสิ่งที่อยากลองต่อ",
        href: `/radar/${focus.slug}`,
        pathLabHref: registry[focus.slug]?.pathLabHref,
        durationMinutes: 10,
        careerSlugs: [focus.slug],
      };
    }

    const pathLabHref = registry[focus.slug]?.pathLabHref;
    if (
      pathLabHref &&
      draft.answers["action-readiness"] === "pathlab" &&
      !completed.has(`pathlab:${focus.slug}`)
    ) {
      return {
        id: `pathlab:${focus.slug}`,
        kind: "pathlab",
        title: `ทดลองงานจริงผ่าน PathLab: ${registry[focus.slug]?.titleTh ?? focus.slug}`,
        detail:
          "คุณอ่านและสะท้อนเส้นทางนี้แล้ว ขั้นต่อไปคือสร้างหลักฐานจากการลงมือทำจริง",
        href: pathLabHref,
        pathLabHref,
        durationMinutes: 20,
        careerSlugs: [focus.slug],
      };
    }

    const reviewId = `review:${focus.slug}`;
    if (!completed.has(reviewId)) {
      return {
        id: reviewId,
        kind: "review-direction",
        title: "ทบทวนว่าหลักฐานใหม่เปลี่ยนทิศทางอย่างไร",
        detail: "เลือกหนึ่งสิ่งที่ชัดขึ้น หนึ่งข้อกังวล และหนึ่งคำถามที่ยังเปิดอยู่",
        durationMinutes: 10,
        careerSlugs: [focus.slug],
      };
    }
  }

  return {
    id: "explore:first-path",
    kind: "understand-career",
    title: "เปิดดูเส้นทางหนึ่งที่ทำให้อยากรู้ต่อ",
    detail: "ยังไม่ต้องตัดสินว่าเหมาะหรือไม่ แค่หาหนึ่งคำถามที่อยากรู้ความจริง",
    href: "/radar",
    durationMinutes: 10,
    careerSlugs: [],
  };
}
