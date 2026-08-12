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
    src: "/pathlab/project.jpg",
    alt: "แอปพลิเคชันแผนที่บนมือถือที่ใช้งานจริง",
    lines: ["Project", "ที่ได้รับการยอมรับ", "หรือเอาไปใช้งานจริง"],
    kind: "photo",
  },
  {
    src: "/pathlab/nsc.png",
    alt: "โลโก้การแข่งขัน National Software Contest",
    lines: ["ชนะการแข่งขัน", "ระดับประเทศ/นานาชาติ"],
    kind: "logo",
  },
  {
    src: "/pathlab/research.png",
    alt: "ตัวอย่างบทความวิจัยทางวิทยาศาสตร์",
    lines: ["Research Paper", "ที่ได้รับการตีพิมพ์"],
    kind: "photo",
  },
  {
    src: "/pathlab/posn.png",
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
