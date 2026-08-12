/**
 * Copy and imagery for the public /pathlab page.
 *
 * Kept out of the components so the Thai copy can be edited without touching
 * layout. Thai renders in Bai Jamjuree via the font-sans fallback; the display
 * face is Instrument Serif, matching /talent.
 */

export const MARQUEE_PHRASES = [
  "Empower student",
  "Connect word",
  "Build in public",
  "Ship something real",
] as const;

export interface HeroCard {
  src: string;
  alt: string;
  /** Position in the fan: the front card sits highest in the stack. */
  variant: "left" | "right" | "front";
}

/** Three overlapping cards, angled, in the hero. */
export const HERO_CARDS: HeroCard[] = [
  {
    src: "/pathlab/webdev.jpg",
    alt: "หน้าจอโค้ด HTML ของงานพัฒนาเว็บ",
    variant: "left",
  },
  {
    src: "/pathlab/medical.jpg",
    alt: "อุปกรณ์ทางการแพทย์",
    variant: "right",
  },
  {
    src: "/pathlab/architect.webp",
    alt: "แบบแปลนสถาปัตยกรรมพร้อมเครื่องเขียน",
    variant: "front",
  },
];

export interface PortfolioItem {
  src: string;
  alt: string;
  /** Two or three short lines. Kept as an array so line breaks are authored. */
  lines: string[];
  /** Logos need padding and a white plate; photographs fill the frame. */
  kind: "photo" | "logo";
}

/** "Port ที่ดีต้องการอะไร" — what belongs in a strong portfolio. */
export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    src: "/pathlab/project.webp",
    alt: "แอปพลิเคชันแผนที่บนมือถือที่ใช้งานจริง",
    lines: ["Project", "ที่ได้รับการยอมรับ", "หรือเอาไปใช้งานจริง"],
    kind: "photo",
  },
  {
    src: "/pathlab/nsc.webp",
    alt: "โลโก้การแข่งขัน National Software Contest",
    lines: ["ชนะการแข่งขัน", "ระดับประเทศ/นานาชาติ"],
    kind: "logo",
  },
  {
    src: "/pathlab/research.webp",
    alt: "ตัวอย่างบทความวิจัยทางวิทยาศาสตร์",
    lines: ["Research Paper", "ที่ได้รับการตีพิมพ์"],
    kind: "photo",
  },
  {
    src: "/pathlab/posn.webp",
    alt: "ตราสัญลักษณ์ สอวน.",
    lines: ["สอวน."],
    kind: "logo",
  },
];

export const HERO = {
  title: "/Pathlab",
  subtitleLines: [
    "ทำ Project ที่ออกแบบร่วมกับผู้เชี่ยวชาญของสายนั้นๆ",
    "ภายในเวลา 4-5 วัน",
  ],
  scrollCue: "[Scroll down]",
} as const;

export const PORTFOLIO_HEADING = "Port ที่ดีต้องการอะไร";

export const STATS_HEADING = "แต่การเริ่มต้นยากสุดเสมอ";

export const OFFER_HEADING = "Pathlab เลยจะช่วยเริ่มต้นให้?";

export const FIELDS_HEADING = "สายที่เปิดในตอนนี้";

export interface FieldCard {
  src: string;
  alt: string;
  label: string;
}

/** The paths currently open. Artwork is pre-cut to a shared 876x1171 frame. */
export const FIELDS: FieldCard[] = [
  {
    src: "/pathlab/field-webdev.webp",
    alt: "หน้าจอโค้ด HTML",
    label: "Web Dev",
  },
  {
    src: "/pathlab/field-business.webp",
    alt: "การประชุมวิเคราะห์ข้อมูลธุรกิจ",
    label: "Business",
  },
  {
    src: "/pathlab/field-gamedev.webp",
    alt: "นักพัฒนาเกมทำงานกับ Unity",
    label: "Game Dev",
  },
  {
    src: "/pathlab/field-medical.webp",
    alt: "หูฟังแพทย์วางบนสมุดบันทึก",
    label: "Medical",
  },
  {
    src: "/pathlab/field-architect.webp",
    alt: "แบบแปลนสถาปัตยกรรม",
    label: "Architect",
  },
];

export interface OfferCard {
  /** Short label, Latin or Thai. */
  title: string;
  /** The explanation under it. */
  body: string;
}

/** Three dark cards: what a Pathlab actually gives you. */
export const OFFER_CARDS: OfferCard[] = [
  {
    title: "Project",
    body: "ที่ออกแบบร่วมกับผู้เชี่ยวชาญของสายนั้นๆ ภายในเวลา 4-5 วัน",
  },
  {
    title: "หาสายที่ใช่",
    body: "ได้ทำโปรเจกต์ที่สายนั้นต้องเจอจริง จะช่วยตัดสินใจว่านี้ใช่ทางของเราไหม",
  },
  {
    title: "Mentor",
    body: "จะมี mentor คอยวางแผนเส้นทางหลังจบโปรเจกต์ว่าควรจะเตรียมตัวต่อยังไง",
  },
];

export interface PathlabStat {
  /** Whole percent, 0-100. Drives both the ring and the printed figure. */
  percent: number;
  /** Two short lines under the ring. */
  lines: string[];
}

/**
 * The two numbers that make the case for starting early. Rings are drawn as
 * inline SVG rather than a chart library: two values do not justify the
 * dependency, and SVG stays sharp at any size.
 */
export const STATS: PathlabStat[] = [
  {
    percent: 87,
    lines: ["เริ่มเตรียม Port", "ตอน ม.5"],
  },
  {
    percent: 58,
    lines: ["ที่เริ่มตอน ม.6", "ยอมแพ้กับรอบ Port"],
  },
];
