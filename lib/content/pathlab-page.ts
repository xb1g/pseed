/**
 * Copy and imagery for the public /pathlab page.
 *
 * Kept out of the components so the Thai copy can be edited without touching
 * layout. Thai body uses Bai Jamjuree; display headings use Kodchasan — same
 * pairing as /me. Latin display stays Instrument Serif where titles are English.
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
  /** Short field label shown on the interactive fan card. */
  label: string;
  /** Position in the fan: the front card sits highest in the stack. */
  variant: "left" | "right" | "front";
}

/** Three overlapping cards, angled, in the hero. */
export const HERO_CARDS: HeroCard[] = [
  {
    src: "/pathlab/webdev.jpg",
    alt: "หน้าจอโค้ด HTML ของงานพัฒนาเว็บ",
    label: "Web Dev",
    variant: "left",
  },
  {
    src: "/pathlab/medical.jpg",
    alt: "อุปกรณ์ทางการแพทย์",
    label: "Medical",
    variant: "right",
  },
  {
    src: "/pathlab/architect.webp",
    alt: "แบบแปลนสถาปัตยกรรมพร้อมเครื่องเขียน",
    label: "Architect",
    variant: "front",
  },
];

export interface PortfolioItem {
  src: string;
  alt: string;
  /** Two or three short lines. Kept as an array so line breaks are authored. */
  lines: string[];
  /**
   * "photo" means the file is already an opaque card and fills the frame.
   * "logo" means a bare transparent mark, so the frame supplies the white
   * plate and insets the mark. Judged by the file, not by the subject: the
   * NSC logo ships as a finished card and so counts as "photo".
   */
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
    // The NSC file is already an opaque card, so it fills the frame like the
    // photographs. Only สอวน. is a bare transparent mark.
    alt: "โลโก้การแข่งขัน National Software Contest",
    lines: ["ชนะการแข่งขัน", "ระดับประเทศ/นานาชาติ"],
    kind: "photo",
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

/**
 * The missing piece after the four port ingredients — Passion Seed's formula
 * that makes a portfolio actually stick: storytelling, interview, mindset.
 */
export const PORTFOLIO_FORMULA = {
  eyebrow: "สิ่งที่ขาดไม่ได้",
  title: "สูตรลับติดPort",
  body: "ชิ้นงานดีอย่างเดียวไม่พอ ต้องมีสูตรที่ทำให้พอร์ตติดตาและคุยในห้องสัมภาษณ์ได้",
  badge: "เราให้คุณ",
  pillars: [
    {
      label: "Storytelling",
      detail: "ผูกทุกชิ้นงานเป็นเส้นเรื่อง คนอ่านรู้ว่าคุณเป็นใคร",
    },
    {
      label: "Interview",
      detail: "ซ้อมเล่าโปรเจกต์ให้มั่น ตอบคำถามยากได้",
    },
    {
      label: "Mindset",
      detail: "มุมคิดนักสร้าง ที่พอร์ตและสัมภาษณ์อ่านออก",
    },
  ],
} as const;

export const HERO = {
  title: "/Pathlab",
  subtitleLines: [
    "ทำ Project ที่ออกแบบร่วมกับผู้เชี่ยวชาญของสายนั้นๆ",
    "ภายในเวลา 4-5 วัน",
  ],
  scrollCue: "[Scroll down]",
} as const;

export const PORTFOLIO_HEADING = "Port ที่ดีต้องการอะไร";

export interface ProofProject {
  src: string;
  alt: string;
  /** Two short lines: what it was, then where it landed. */
  lines: string[];
}

/**
 * Social-proof strip under the hero. Figure and project examples are
 * placeholders pending real numbers/cases — swap PROOF.figure and
 * PROOF_PROJECTS for verified data before this ships publicly.
 */
export const PROOF = {
  figure: "200+",
  headline: "นักเรียนติดมหาวิทยาลัยที่ใช่ ด้วยซัพพอร์ทจาก Passion Seed",
  sub: "ตัวเลขจากนักเรียนที่ผ่าน Pathlab แล้วนำ Project ไปต่อยอดเป็น Port",
} as const;

export const PROOF_PROJECTS: ProofProject[] = [
  {
    src: "/pathlab/project.webp",
    alt: "ตัวอย่าง Project ของนักเรียน Pathlab",
    lines: ["ตัวอย่าง Project", "รอใส่เคสจริง"],
  },
  {
    src: "/pathlab/nsc.webp",
    alt: "ตัวอย่าง Project ของนักเรียน Pathlab",
    lines: ["ตัวอย่าง Project", "รอใส่เคสจริง"],
  },
  {
    src: "/pathlab/research.webp",
    alt: "ตัวอย่าง Project ของนักเรียน Pathlab",
    lines: ["ตัวอย่าง Project", "รอใส่เคสจริง"],
  },
];

export const JOURNEY = {
  heading: "Learning journey เป็นยังไง",
  body: "เดินเป็นวัน ๆ บนแผนที่ — แต่ละวันมีโจทย์จริง Learn + Do แล้วไปต่อวันที่ถัดไป",
  src: "/pathlab/pathlabmap.png",
  alt: "หน้าจอ Pathlab learning journey แสดงแผนที่โปรเจกต์และรายละเอียดกิจกรรมของนักเรียน",
} as const;

export const STATS_HEADING = "แต่การเริ่มต้นยากสุดเสมอ";

export const OFFER_HEADING = "Pathlab เลยจะช่วยเริ่มต้นให้?";

export const REVIEWS_HEADING = "Review จากรุ่นพี่";

export interface AlumniReview {
  /** The quote itself, verbatim as sent by the alumnus. */
  quote: string;
  /** Instagram handle, shown as written. */
  ig: string;
  /** Who is speaking — school year and faculty. */
  by: string;
}

/** "Review จากรุ่นพี่" — alumni comments. More are added as they come in. */
export const REVIEWS: AlumniReview[] = [
  {
    quote:
      "ถ้าอยากแลของหรอย ๆ อยากเรียน Tech แบบเข้าใจง่าย ๆ แนะนำให้มาแล Techseed กันตะพี่บ่าวทั้งหลาย เขาสอนดีนิ อธิบายเข้าใจง่าย",
    ig: "IG:victorchenspec",
    by: "รุ่นพี่บางมด วิศวะกรรมระบบปัญญาประดิษฐ์",
  },
  {
    quote:
      "มีอะไรสงสัยก็ช่วยกันเต็มที่ ไม่ปล่อยให้เรานั่งงงอยู่คนเดียว ใครกำลังหาที่เรียน Tech ดี ๆ ลองมาแล Techseed กันหล่าว",
    ig: "IG:victorchenspec",
    by: "รุ่นพี่บางมด วิศวะกรรมระบบปัญญาประดิษฐ์",
  },
];

export const FIELDS_HEADING = "สายที่เปิดในตอนนี้";

export const PRICE_HEADING = "เลือกทางเริ่มต้น";

export const CONTACT = {
  line: "สนใจทัก IG มาได้เลย",
  handle: "passion_seed.th",
  /** Instagram deep link, so the handle is a real destination not just text. */
  href: "https://instagram.com/passion_seed.th",
} as const;

export interface PriceTier {
  /** Who it is for / tier name. */
  label: string;
  /** The figure alone, so it can be coloured without markup in the string. */
  amount: string;
  /** Currency or free marker shown before/with amount. */
  currency?: string;
  /** What the figure covers. */
  unit: string;
  /** One-line pitch under the price. */
  blurb: string;
  /** Visual weight: free is soft, featured is the group deal. */
  tone: "free" | "solo" | "group";
  /** Optional chip above the amount. */
  chip?: string;
}

export const PRICE_TIERS: PriceTier[] = [
  {
    label: "Micro Pathlab",
    amount: "ฟรี",
    unit: "วันละ 1 ครั้ง · ~10 นาที",
    blurb: "ลองโปรเจกต์จิ๋วทุกวัน ไม่เสียตัง รู้เร็วว่าสายนี้ดึงดูดไหม",
    tone: "free",
    chip: "เริ่มวันนี้",
  },
  {
    label: "เดี่ยว",
    amount: "299",
    currency: "฿",
    unit: "ต่อคน · รอบ 4–5 วัน",
    blurb: "มาคนเดียวได้ เราจัดกลุ่ม + mentor ให้ใกล้ชิด",
    tone: "solo",
  },
  {
    label: "กลุ่ม 4 คน",
    amount: "999",
    currency: "฿",
    unit: "ทั้งกลุ่ม · เลือกวันเริ่มได้",
    blurb: "มาเป็นทีม ประหยัดกว่า และวางตารางเองได้",
    tone: "group",
    chip: "คุ้มสุด",
  },
];

/** How the rounds work. Authored as lines so the breaks are deliberate. */
export const PRICE_NOTES: string[] = [
  "Pathlab จัดรอบละ 4 คน ถ้ามาเดี่ยวเราจัดกลุ่มให้ แต่ละกลุ่มมี mentor ดูแลใกล้ชิด",
  "สมัครแบบกลุ่มเลือกวันเริ่มได้ · มาเดี่ยว admin หาเวลาร่วมของแต่ละคน",
  "Micro Pathlab ฟรีวันละหนึ่งรอบ — ใช้ลองก่อนค่อยอัปเป็นรอบเต็ม",
];

export interface FieldCard {
  /** Omitted on the "ask us" tile, which is drawn rather than photographed. */
  src?: string;
  alt?: string;
  label: string;
  /** Not open yet: the card greys out and carries a "Coming soon" overlay. */
  comingSoon?: boolean;
  /**
   * The closing tile: a dark "?" card inviting people to ask about a field
   * that is not listed. Not a path, so it carries no image and its label wraps
   * to two lines.
   */
  ask?: boolean;
}

export const COMING_SOON_LABEL = "Coming soon";

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
  {
    src: "/pathlab/field-commarts.webp",
    alt: "ภาพประกอบการออกแบบสีสันสดใส",
    label: "นิเทศ",
  },
  {
    src: "/pathlab/field-civil.webp",
    alt: "วิศวะกำลังสำรวจหน้างานก่อสร้าง",
    label: "วิศวะโยธา",
  },
  {
    src: "/pathlab/field-graphic.webp",
    alt: "งานออกแบบกราฟิกพื้นหลังสีเหลือง",
    label: "กราฟิกและแอนิเมชั่น",
  },
  {
    label: "หากไม่มีสายที่สนใจทัก IG\nพวกเรามาได้เลยนะ",
    ask: true,
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
