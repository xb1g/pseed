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
  /** Who is speaking — school year and faculty. Omitted when not given. */
  by?: string;
}

/** "Review จากรุ่นพี่" — alumni comments. More are added as they come in. */
export const REVIEWS: AlumniReview[] = [
  {
    quote:
      "ถ้าไม่มีพื้นฐาน แค่พกใจมาก็พอ เริ่มจากศูนย์ ได้ลงมือเขียนโค้ดจริง ทำโปรเจกต์จริง และใช้ได้จริง",
    ig: "IG:xn_z96x",
    by: "รุ่นพี่จุฬาวังบูรพา สาขาวิชาวิทคอม",
  },
  {
    quote:
      "สอนเข้าใจง่ายมาก เรียนสนุก นอกจากนี้ยังได้เจอเพื่อนๆ และรุ่นพี่ในสายในวงการเดียวกัน เรียนเสร็จเลยได้กำลังใจ แรงบันดาลใจมาเต็มเลย",
    ig: "IG:cathatput_02",
    by: "รุ่นพี่จุฬา CEDT",
  },
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
  {
    quote: "โคตรโหดโคตรมันส์โคตรฮา💯",
    ig: "IG:_ppangkorn",
  },
  {
    quote: "ของดีคับ 🤫 🤫 🤫 🐄",
    ig: "IG:how_to_fried_a_chicken",
  },
];

export const FIELDS_HEADING = "สายที่เปิดในตอนนี้";

/** Tells the reader the cards open, before they hover or tap one. */
export const FIELDS_HINT = "กดเพื่อดูรายละเอียดของแต่ละสายได้";

/** Labels inside an opened path. */
export const FIELD_DETAIL_LABELS = {
  back: "← กลับไปดูสายอื่น",
  reality: "คนสายนี้ทำอะไรจริง ๆ",
  brief: "โจทย์ของเรารอบนี้",
  days: "5 วันนี้เป็นยังไง",
  outcomes: "จบแล้วคุณจะ…",
  basis: "ต้องมีพื้นฐานไหม?",
  basisAnswer: "ไม่ต้อง เริ่มจากศูนย์ได้",
  /** Suffixed with the field label so the DM arrives with context. */
  ctaPrefix: "ทัก IG ถามเรื่องสาย",
  price: "299฿ เดี่ยว · 999฿ กลุ่ม 4 คน · เลื่อนลงดูรายละเอียดราคา",
  /** Appended to the card's accessible name. */
  cardAction: "— ดูรายละเอียด 5 วัน",
  cardCue: "ดู 5 วันนี้ →",
} as const;

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

/** One day of a path: what you do, and what you walk away holding. */
export interface FieldDay {
  title: string;
  /** One line on the day's work. */
  doing: string;
  /** The artefact the day produces, shown as a chip. */
  gets: string;
}

/**
 * The expanded view of a path. Optional on FieldCard: a field without one
 * renders as a plain tile and cannot be opened, so copy can land field by
 * field without a code change.
 */
export interface FieldDetail {
  /** The field in a sentence, under the title. */
  tagline: string;
  /** Short project name for the grid card, where space is tight. */
  briefShort: string;
  /** The project stated in full, as the brief block's headline. */
  brief: string;
  /** The situation and what gets built. */
  briefDetail: string;
  /** Who the project was designed with. */
  briefBy: string;
  /** Three concrete, non-obvious truths about the work. */
  reality: string[];
  /** Exactly five days. */
  days: FieldDay[];
  /** Three outcomes; the first is the self-discovery one and leads. */
  outcomes: string[];
  /** An alumni quote answering "do I need a background for this?". */
  quote: string;
  /** Attribution for the quote, as written. */
  cite: string;
}

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
  /** Present only on fields whose five-day copy is written. */
  detail?: FieldDetail;
}

export const COMING_SOON_LABEL = "Coming soon";

/** The paths currently open. Artwork is pre-cut to a shared 876x1171 frame. */
export const FIELDS: FieldCard[] = [
  {
    src: "/pathlab/field-webdev.webp",
    alt: "หน้าจอเว็บ Flashcard ทบทวนบทเรียนบนมือถือ",
    label: "Web Dev",
    detail: {
      tagline: "สร้างเว็บที่คนใช้จริงได้ ตั้งแต่หน้าจอจนถึงหลังบ้าน",
      briefShort: "เว็บ Flashcard ทบทวนบทเรียน",
      brief: "ทำเว็บ Flashcard ทบทวนบทเรียน ที่เพื่อนเอาไปใช้อ่านสอบจริง",
      briefDetail:
        "ทุกคนเคยท่องศัพท์หรือสูตรก่อนสอบแล้วลืมหมดในสามวัน คุณจะได้ทำเว็บที่สร้างการ์ดคำถาม–คำตอบเองได้ กดพลิกดูเฉลย แล้วให้ระบบวนการ์ดที่ยังตอบผิดกลับมาถามซ้ำ จบรอบเอาไปให้เพื่อนในห้องใช้อ่านสอบจริง",
      briefBy: "ออกแบบร่วมกับ Software Engineer ตัวจริงในสาย",
      reality: [
        "ถกกับคนใช้จริงว่าปุ่มควรอยู่ตรงไหน ไม่ใช่แค่นั่งเขียนโค้ดคนเดียว",
        "งานพังตอนตีสองเป็นเรื่องปกติ การไล่หาสาเหตุคือทักษะหลักของสายนี้",
        "ของที่ทำเสร็จแล้วมีคนใช้ ดีกว่าของที่สวยแต่ยังไม่ได้ปล่อย",
      ],
      days: [
        {
          title: "ตั้งเครื่องมือ + วางโครง",
          doing:
            "ลง OpenCode ต่อ GitHub แล้วเปิดโปรเจกต์ Next.js ตัวแรก วางโครงหน้าการ์ดด้วย HTML/CSS",
          gets: "โปรเจกต์บน GitHub",
        },
        {
          title: "เขียนโค้ดให้กดได้",
          doing:
            "ใช้ JavaScript ใน React ดักการคลิกแล้วสั่งให้การ์ดพลิกดูเฉลย รู้จัก state และ event",
          gets: "การ์ดที่กดพลิกได้",
        },
        {
          title: "ต่อ Supabase",
          doing:
            "สร้างตารางบน Supabase แล้วเขียนคำสั่งเพิ่ม–อ่าน–ลบการ์ด ปิดเว็บแล้วเปิดใหม่ข้อมูลยังอยู่ครบ",
          gets: "ฐานข้อมูลที่ใช้ได้จริง",
        },
        {
          title: "เขียนระบบทบทวน",
          doing:
            "เขียนเงื่อนไขให้ระบบจำว่าการ์ดไหนตอบผิด แล้ววนกลับมาถามซ้ำถี่กว่าการ์ดที่ตอบถูก",
          gets: "ระบบที่ช่วยจำได้จริง",
        },
        {
          title: "Deploy ด้วย Vercel",
          doing:
            "ต่อ GitHub เข้ากับ Vercel กด deploy จนได้ลิงก์ที่ส่งให้ใครเปิดก็ได้ แล้วซ้อมเล่าโปรเจกต์",
          gets: "ลิงก์จริง + สคริปต์เล่า Port",
        },
      ],
      outcomes: [
        "รู้ว่าสายนี้ใช่ทางคุณไหม",
        "ได้เว็บที่มีลิงก์จริง เพื่อนใช้อ่านสอบได้ ลง Port ได้เลย",
        "รู้ว่าถ้าจะไปต่อสายนี้ ต้องเตรียมอะไร",
      ],
      quote:
        "ถ้าไม่มีพื้นฐาน แค่พกใจมาก็พอ เริ่มจากศูนย์ ได้ลงมือเขียนโค้ดจริง ทำโปรเจกต์จริง และใช้ได้จริง",
      cite: "IG:xn_z96x · รุ่นพี่จุฬาวังบูรพา สาขาวิชาวิทคอม",
    },
  },
  {
    src: "/pathlab/field-business.webp",
    alt: "การประชุมวิเคราะห์ข้อมูลธุรกิจ",
    label: "Business",
    detail: {
      tagline: "หาให้เจอว่าคนยอมจ่ายเพื่ออะไร แล้วพิสูจน์ด้วยตัวเลข",
      briefShort: "ทดสอบไอเดียธุรกิจกับลูกค้าจริง",
      brief: "หาโอกาสธุรกิจจริงในย่านของคุณ แล้วทดสอบกับลูกค้าจริง",
      briefDetail:
        "ไม่ใช่การเขียนแผนธุรกิจส่งครู แต่คือการเดินออกไปถามคนจริงว่าเขาติดปัญหาอะไร แล้วลองเสนอขายจริงเพื่อดูว่ามีคนยอมจ่ายไหม จบรอบคุณจะมีตัวเลขจากตลาดจริง ไม่ใช่การเดา",
      briefBy: "ออกแบบร่วมกับผู้ก่อตั้งธุรกิจตัวจริง",
      reality: [
        "งานส่วนใหญ่คือถามคนแปลกหน้าว่าเขามีปัญหาอะไร ไม่ใช่การนั่งทำสไลด์สวย ๆ",
        "ไอเดียที่คุณรักที่สุด มักเป็นไอเดียที่ตลาดบอกว่าไม่เอา และต้องยอมทิ้งให้เป็น",
        "ตัวเลขเล็ก ๆ ที่จริง มีค่ากว่าแผนใหญ่ ๆ ที่ยังไม่มีใครลองซื้อ",
      ],
      days: [
        {
          title: "หาปัญหา",
          doing: "ลงพื้นที่ คุยกับคนจริงอย่างน้อย 5 คน",
          gets: "ปัญหาที่มีคนเดือดร้อนจริง",
        },
        {
          title: "ตั้งสมมติฐาน",
          doing: "แปลงปัญหาเป็นข้อเสนอที่ทดสอบได้",
          gets: "สมมติฐานที่วัดผลได้",
        },
        {
          title: "ทดสอบตลาด",
          doing: "ทำข้อเสนอง่าย ๆ แล้วเอาไปเสนอจริง",
          gets: "ผลตอบรับจากตลาด",
        },
        {
          title: "อ่านตัวเลข",
          doing: "สรุปว่าอะไรเวิร์ก อะไรต้องทิ้ง",
          gets: "โมเดลที่ปรับแล้ว",
        },
        {
          title: "พิตช์",
          doing: "เล่าให้คนนอกเข้าใจใน 3 นาที",
          gets: "เด็คพิตช์ + สคริปต์เล่า Port",
        },
      ],
      outcomes: [
        "รู้ว่าสายนี้ใช่ทางคุณไหม",
        "ได้เคสธุรกิจที่มีข้อมูลจริงรองรับ ลง Port ได้",
        "รู้ว่าถ้าจะไปต่อสายนี้ ต้องเตรียมอะไร",
      ],
      quote:
        "สอนเข้าใจง่ายมาก เรียนสนุก นอกจากนี้ยังได้เจอเพื่อน ๆ และรุ่นพี่ในสายในวงการเดียวกัน",
      cite: "IG:cathatput_02 · รุ่นพี่จุฬา CEDT",
    },
  },
  {
    src: "/pathlab/field-gamedev.webp",
    alt: "นักพัฒนาเกมทำงานกับ Unity",
    label: "Game Dev",
    detail: {
      tagline: "ทำให้คนเล่นรู้สึกบางอย่าง ด้วยระบบที่คุณออกแบบเอง",
      briefShort: "เกมสั้นที่คนอื่นได้เล่นจริง",
      brief: "ทำเกมสั้น ๆ ที่เล่นจบใน 3 นาที แล้วเอาไปให้คนแปลกหน้าเล่น",
      briefDetail:
        "เกมสั้นแต่ต้องจบจริง มีจุดเริ่ม จุดจบ และเหตุผลให้เล่นซ้ำ คุณจะได้นั่งดูคนที่ไม่เคยเห็นเกมคุณมาก่อนลองเล่น แล้วแก้ตามสิ่งที่เห็น ไม่ใช่ตามสิ่งที่คิดเอง",
      briefBy: "ออกแบบร่วมกับ Game Developer ตัวจริงในสาย",
      reality: [
        "เกมสนุกไม่ได้มาจากไอเดีย แต่มาจากการแก้ค่าทีละนิดหลังดูคนเล่นจริง",
        "งานส่วนใหญ่คือทำของเล็ก ๆ ให้จบ ไม่ใช่ทำเกมใหญ่ที่ไม่มีวันเสร็จ",
        "ศิลปะ โค้ด และเสียง ต้องคุยกันรู้เรื่อง ทีมที่คุยกันไม่ได้คือเกมที่ไม่ได้ออก",
      ],
      days: [
        {
          title: "หาแกนสนุก",
          doing: "ลองกลไกหลักบนกระดาษก่อนแตะโปรแกรม",
          gets: "แกนเกมที่ชัด",
        },
        {
          title: "ต่อเป็นเกม",
          doing: "ทำให้เล่นได้จริงแม้จะยังไม่สวย",
          gets: "ตัวเล่นได้ตัวแรก",
        },
        {
          title: "ใส่ความรู้สึก",
          doing: "เสียง เอฟเฟกต์ จังหวะ ที่ทำให้รู้สึกดี",
          gets: "เกมที่มีฟีล",
        },
        {
          title: "ให้คนเล่นจริง",
          doing: "ดูคนเล่นเงียบ ๆ แล้วแก้ตามที่เห็น",
          gets: "เวอร์ชันที่คนเล่นรู้เรื่อง",
        },
        {
          title: "ปล่อยเกม",
          doing: "ปล่อยขึ้นออนไลน์แล้วซ้อมเล่าโปรเจกต์",
          gets: "ลิงก์เล่นได้ + สคริปต์เล่า Port",
        },
      ],
      outcomes: [
        "รู้ว่าสายนี้ใช่ทางคุณไหม",
        "ได้เกมที่คนกดเล่นได้จริง ลง Port ได้เลย",
        "รู้ว่าถ้าจะไปต่อสายนี้ ต้องเตรียมอะไร",
      ],
      quote: "มีอะไรสงสัยก็ช่วยกันเต็มที่ ไม่ปล่อยให้เรานั่งงงอยู่คนเดียว",
      cite: "IG:victorchenspec · รุ่นพี่บางมด วิศวกรรมระบบปัญญาประดิษฐ์",
    },
  },
  {
    src: "/pathlab/field-medical.webp",
    alt: "หูฟังแพทย์วางบนสมุดบันทึก",
    label: "Medical",
    comingSoon: true,
  },
  {
    src: "/pathlab/field-architect.webp",
    alt: "แบบแปลนสถาปัตยกรรม",
    label: "Architect",
    comingSoon: true,
  },
  {
    src: "/pathlab/field-commarts.webp",
    alt: "ภาพประกอบการออกแบบสีสันสดใส",
    label: "นิเทศ",
    comingSoon: true,
  },
  {
    src: "/pathlab/field-civil.webp",
    alt: "วิศวะกำลังสำรวจหน้างานก่อสร้าง",
    label: "วิศวะโยธา",
    comingSoon: true,
  },
  {
    src: "/pathlab/field-graphic.webp",
    alt: "งานออกแบบกราฟิกพื้นหลังสีเหลือง",
    label: "กราฟิกและแอนิเมชั่น",
    comingSoon: true,
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
