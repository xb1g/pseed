/**
 * Mission plan — the 2–4 month sprint that turns exploration into evidence.
 *
 * Copy philosophy: founder + mentor voice. Direct, warm, no fluff. Ikigai is
 * the hidden engine (passion × skill × opportunity) and is never named — the
 * plan simply makes students act on all three.
 */

export type MissionGoal = "university" | "job" | "scholarship" | "exploring";

export interface MissionGoalOption {
  id: MissionGoal;
  title: string;
  detail: string;
}

export const MISSION_GOAL_OPTIONS: MissionGoalOption[] = [
  {
    id: "university",
    title: "เข้ามหาวิทยาลัย",
    detail: "คณะ/สาขาที่ใช่ ในไทม์ไลน์ของคุณ — ด้วยหลักฐานที่คัดมาอย่างดี",
  },
  {
    id: "job",
    title: "งานหรือฝึกงาน",
    detail: "งานแรกที่คุณเลือกเอง ไม่ใช่งานเดียวที่เหลือให้",
  },
  {
    id: "scholarship",
    title: "ทุนหรือเวทีแข่งขัน",
    detail: "ชนะด้วยผลงานจริง ไม่ใช่ใบสมัครที่เหมือนคนอื่นทุกใบ",
  },
  {
    id: "exploring",
    title: "ยังสำรวจอยู่",
    detail: "ใช้เวลานี้ให้รู้จริงว่าอะไรใช่ — ก่อนล็อกเป้าหมายใหญ่",
  },
];

export type MissionOutcomeId =
  | "portfolio"
  | "competition"
  | "volunteering"
  | "interview"
  | "community";

export interface MissionOutcome {
  id: MissionOutcomeId;
  title: string;
  promise: string;
  landsIn: string;
}

export interface MissionMonth {
  month: number;
  phase: "foundation" | "build" | "prove" | "land";
  title: string;
  theme: string;
  milestones: string[];
  outcomeIds: MissionOutcomeId[];
}

export interface MissionRedFlag {
  title: string;
  detail: string;
}

export interface MissionPlanInput {
  goal: MissionGoal | null;
  timelineMonths: number;
  pathlabTitles: string[];
  careerTitles: string[];
}

export interface MissionPlan {
  goal: MissionGoal;
  timelineMonths: number;
  headline: string;
  subline: string;
  months: MissionMonth[];
  outcomes: MissionOutcome[];
  redFlags: MissionRedFlag[];
  anchorNote: string;
}

export const MISSION_RED_FLAGS: MissionRedFlag[] = [
  {
    title: "เปลี่ยนสายทุกสองอาทิตย์",
    detail:
      "Pivot เร็วดูฉลาด แต่หลักฐานไม่เคยทันเกิด ให้เวลาอย่างน้อย 30 วันก่อนตัดสินว่าไม่ใช่ — startup ที่เปลี่ยนไอเดียทุกเดือนไม่มีวันเปิดตัว",
  },
  {
    title: "แข่งทุกรายการที่เห็น",
    detail:
      "การแข่งขันที่ไม่มีใครให้ค่าเท่ากับเสียเวลา เลือก 1 รายการที่มหาวิทยาลัยหรือบริษัทที่คุณอยากเข้าดูอยู่จริง แล้วทุ่มให้สุด",
  },
  {
    title: "พอร์ตที่ไม่มีผู้ใช้จริง",
    detail:
      "โปรเจกต์ที่ไม่มีใครใช้คือแบบฝึกหัด หาคนจริงสัก 5 คนมาใช้ แล้วเก็บฟีดแบ็ก — นั่นคือสิ่งที่แยกคุณออกจากคนอื่นทั้งหมด",
  },
  {
    title: "ลอง 5 อย่าง จบ 0 อย่าง",
    detail:
      "PathLab มีไว้ทดลอง ไม่ใช่สะสม เริ่มได้หลายอันถ้ารีบ แต่ต้องเลือกให้ได้ว่าอันไหนจะทำให้จบ — เดดไลน์คือเพื่อน ไม่ใช่ศัตรู",
  },
  {
    title: "รอให้พร้อมก่อนสมัคร",
    detail:
      "พอร์ตไม่เคยรู้สึกพร้อม ส่งตอนที่มันทำงานได้จริง แล้วปรับระหว่างทาง — คนที่ส่งช้ากว่าเพราะกลัว แพ้คนที่ส่งแล้วเก็บฟีดแบ็กเสมอ",
  },
];

const ANCHOR_NOTE =
  "และถึงวันหนึ่งเส้นทางมหาวิทยาลัยจะเปลี่ยนไป สิ่งที่คุณสร้างตรงนี้จะยังอยู่กับคุณเสมอ — งานที่คุณรัก ฝีมือที่พิสูจน์ได้ และคนที่พร้อมหนุนคุณ นี่คือวิธีที่คุณออกแบบชีวิตของตัวเอง ไม่ใช่แค่สอบเข้าให้ได้";

function firstOrFallback(values: string[], fallback: string): string {
  return values.length ? values[0] : fallback;
}

function joinTitles(titles: string[]): string {
  if (titles.length <= 2) return titles.join(" และ ");
  return `${titles.slice(0, 2).join(", ")} และอีก ${titles.length - 2} อัน`;
}

function foundationMonth(month: number, input: MissionPlanInput): MissionMonth {
  const milestones: string[] = [
    input.pathlabTitles.length
      ? `เริ่ม PathLab: ${joinTitles(input.pathlabTitles)} — ลงมือทำงานจริงตั้งแต่วันแรก`
      : "เลือก PathLab อย่างน้อย 1 อันแล้วเริ่มวันแรกให้ได้ในสัปดาห์นี้",
    "จดบันทึกสั้นๆ ทุกครั้งที่ทำ: อะไรที่ทำแล้วลืมเวลา อะไรที่ทำแล้วเหนื่อย — นี่คือข้อมูลดิบของการตัดสินใจ",
    "ทำ PathLab ให้จบอย่างน้อย 1 อัน เพื่อปิดคำถามที่ว่า 'ฉันชอบและถนัดอะไร' ด้วยหลักฐาน ไม่ใช่ความรู้สึก",
  ];
  return {
    month,
    phase: "foundation",
    title: "วางฐานด้วยงานจริง",
    theme: `ลองทำงานจริงในสาย${firstOrFallback(input.careerTitles, "ที่คุณเลือก")} แล้วเก็บหลักฐานว่าอะไรใช่สำหรับคุณ`,
    milestones,
    outcomeIds: ["community"],
  };
}

function buildMonth(month: number, goal: MissionGoal): MissionMonth {
  const asset =
    goal === "university"
      ? "ชิ้นงานที่คณะอยากเห็น"
      : goal === "job"
        ? "ชิ้นงานที่บริษัทอยากเห็น"
        : "ชิ้นงานที่พิสูจน์ฝีมือคุณ";
  return {
    month,
    phase: "build",
    title: "สร้างพอร์ตชิ้นสำคัญ",
    theme: `หนึ่งโปรเจกต์จริงที่แก้ปัญหาจริง — ${asset}`,
    milestones: [
      "เลือกปัญหาจริง 1 ข้อจากคนรอบตัว แล้วออกแบบวิธีแก้ด้วยทักษะที่คุณเพิ่งพิสูจน์มา",
      "ปล่อยเวอร์ชันแรกให้คนจริงอย่างน้อย 5 คนได้ใช้ แล้วเก็บฟีดแบ็กมาปรับ",
      "เขียนเล่าเรื่องโปรเจกต์: แก้อะไร ให้ใคร อะไรได้ผล — นี่คือหัวใจของพอร์ตที่คนจำได้",
    ],
    outcomeIds: ["portfolio"],
  };
}

function proveMonth(month: number): MissionMonth {
  return {
    month,
    phase: "prove",
    title: "พิสูจน์บนเวทีจริง",
    theme: "เอาฝีมือไปวัดกับโลก — การแข่งขันและงานเพื่อคนอื่น",
    milestones: [
      "เลือกการแข่งขัน 1 รายการที่เวทีมีน้ำหนักกับเส้นทางของคุณ แล้วส่งผลงานให้ทันเดดไลน์",
      "ใช้ทักษะที่มีช่วยคนจริง 1 ครั้ง — สอน สร้าง หรือจัดกิจกรรม — แล้วบันทึกว่าใครได้อะไรไป",
      "เก็บหลักฐานทุกชิ้น: รูป ลิงก์ ใบประกาศ พร้อมบันทึกสั้นๆ ว่าแต่ละชิ้นหมายความว่าอะไร",
    ],
    outcomeIds: ["competition", "volunteering"],
  };
}

function landMonth(month: number, goal: MissionGoal): MissionMonth {
  const closing =
    goal === "university"
      ? "เตรียมเรื่องเล่าสำหรับรอบสอบ/สัมภาษณ์: ทำไมสายนี้ ทำไมที่นี่ — ตอบจากหลักฐานที่คุณมี ไม่ใช่จากสคริปต์"
      : goal === "job"
        ? "ส่งพอร์ตและใบสมัครไปยังที่ที่คุณเลือกไว้ตั้งแต่ต้น — พร้อมเรื่องเล่าที่พิสูจน์ว่าคุณทำจริง"
        : goal === "scholarship"
          ? "ส่งใบสมัครทุน/รายการพร้อมหลักฐานครบชุด — คณะกรรมการจำคนที่มีเรื่องจริงได้"
          : "สรุปสิ่งที่รู้จริงจาก 3 เดือนที่ผ่านมา แล้วล็อกเป้าหมายใหญ่ก้อนต่อไปจากหลักฐาน ไม่ใช่จากแรงกด";
  return {
    month,
    phase: "land",
    title: "ปิดดีลด้วยเรื่องเล่า",
    theme: "เปลี่ยนหลักฐานทั้งหมดให้เป็นเรื่องที่คนฟังแล้วจำคุณได้",
    milestones: [
      "เล่าเรื่องโปรเจกต์ของคุณใน 2 นาทีให้ได้ แล้วซ้อมกับคนจริงอย่างน้อย 3 ครั้งจนไม่ต้องจำ",
      closing,
      "ส่งทุกอย่างตามเดดไลน์ที่ตั้งไว้ — ไม่รอให้สมบูรณ์แบบ เพราะมันจะไม่มีวันรู้สึกพร้อม",
    ],
    outcomeIds: ["interview", "community"],
  };
}

function headlineFor(goal: MissionGoal, months: number): string {
  switch (goal) {
    case "university":
      return `แผน ${months} เดือนสู่มหาวิทยาลัยในไทม์ไลน์ของคุณ`;
    case "job":
      return `แผน ${months} เดือนสู่งานแรกที่คุณเลือกเอง`;
    case "scholarship":
      return `แผน ${months} เดือนสู่เวทีที่พิสูจน์ตัวคุณ`;
    case "exploring":
      return `แผน ${months} เดือนเพื่อรู้จริงว่าอะไรใช่สำหรับคุณ`;
  }
}

function outcomeLandsIn(months: MissionMonth[], outcomeId: MissionOutcomeId): string {
  const hits = months.filter((month) => month.outcomeIds.includes(outcomeId));
  if (!hits.length) return "ตลอดทั้งแผน";
  if (outcomeId === "community" || hits.length > 1) return "ตลอดทั้งแผน";
  return `เดือนที่ ${hits[0].month}`;
}

/**
 * Builds the month-by-month mission plan. Months compress with the timeline:
 * 4 months = foundation → build → prove → land; 3 months merges prove+land;
 * 2 months merges foundation+build and prove+land.
 */
export function buildMissionPlan(input: MissionPlanInput): MissionPlan {
  const goal = input.goal ?? "university";
  const timeline = Math.min(4, Math.max(2, Math.round(input.timelineMonths) || 4));

  let months: MissionMonth[];
  if (timeline >= 4) {
    months = [
      foundationMonth(1, input),
      buildMonth(2, goal),
      proveMonth(3),
      landMonth(4, goal),
    ];
  } else if (timeline === 3) {
    const foundation = foundationMonth(1, input);
    const build = buildMonth(2, goal);
    const proveLand = landMonth(3, goal);
    proveLand.title = "พิสูจน์และปิดดีล";
    proveLand.theme = "แข่งให้ชนะ เล่าให้จำ — ทั้งบนเวทีและในห้องสัมภาษณ์";
    proveLand.milestones = [
      proveMonth(3).milestones[0],
      proveMonth(3).milestones[1],
      ...proveLand.milestones.slice(0, 2),
    ];
    proveLand.outcomeIds = ["competition", "volunteering", "interview", "community"];
    months = [foundation, build, proveLand];
  } else {
    const foundation = foundationMonth(1, input);
    const build = buildMonth(1, goal);
    foundation.title = "วางฐานและสร้างพอร์ตพร้อมกัน";
    foundation.theme = "ไม่มีเวลารอ — ลองงานจริงและสร้างชิ้นงานไปพร้อมกันตั้งแต่เดือนแรก";
    foundation.milestones = [foundation.milestones[0], ...build.milestones];
    foundation.outcomeIds = ["portfolio", "community"];
    const proveLand = landMonth(2, goal);
    proveLand.title = "พิสูจน์และปิดดีล";
    proveLand.theme = "แข่งให้ชนะ เล่าให้จำ — ทั้งบนเวทีและในห้องสัมภาษณ์";
    proveLand.milestones = [
      proveMonth(2).milestones[0],
      proveMonth(2).milestones[1],
      ...proveLand.milestones.slice(0, 2),
    ];
    proveLand.outcomeIds = ["competition", "volunteering", "interview", "community"];
    months = [foundation, proveLand];
  }

  const outcomes: MissionOutcome[] = [
    {
      id: "portfolio",
      title: "โปรเจคชูโรงใส่พอร์ต",
      promise: "โปรเจกต์จริงที่แก้ปัญหาจริง มีผู้ใช้จริง และมีเรื่องเล่า",
      landsIn: outcomeLandsIn(months, "portfolio"),
    },
    {
      id: "competition",
      title: "งานแข่งใส่พอร์ต",
      promise: "รายการที่เวทีมีน้ำหนัก ส่งจริง วัดจริง มีหลักฐาน",
      landsIn: outcomeLandsIn(months, "competition"),
    },
    {
      id: "volunteering",
      title: "งานเพื่อสังคม",
      promise: "ใช้ทักษะช่วยคนจริง — สิ่งที่สัมภาษณ์ถามเสมอและคนส่วนใหญ่ตอบไม่ได้",
      landsIn: outcomeLandsIn(months, "volunteering"),
    },
    {
      id: "interview",
      title: "เทคนิคสอบสัมภาษณ์",
      promise: "เล่าเรื่องตัวเองใน 2 นาทีจากหลักฐานจริง ไม่ใช่สคริปต์",
      landsIn: outcomeLandsIn(months, "interview"),
    },
    {
      id: "community",
      title: "community and mentor",
      promise: "คนที่เดินทางเดียวกันและพี่ที่ผ่านจุดนี้มาแล้ว คอยช่วยตลอดแผน",
      landsIn: "ตลอดทั้งแผน",
    },
  ];

  return {
    goal,
    timelineMonths: timeline,
    headline: headlineFor(goal, timeline),
    subline:
      "แผนนี้ไม่ได้ขอให้คุณเก่งขึ้นในห้องเรียน แต่ขอให้คุณมีหลักฐานว่าคุณลงมือทำจริง — เดือนละก้าว ครบทั้ง 5 ชิ้น",
    months,
    outcomes,
    redFlags: MISSION_RED_FLAGS,
    anchorNote: ANCHOR_NOTE,
  };
}
