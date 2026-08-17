/**
 * Copy for /pathlab/for-parents.
 *
 * Parents read this page with different questions than the teenager reading
 * /pathlab: what does my child actually come home with, does it collide with
 * school, who is in the room with them, and how do I pay. The copy lives here
 * so those answers can be edited without touching layout, the same split the
 * main Pathlab page uses.
 *
 * Shared facts (fields, reviews, price, contact) are imported from
 * `pathlab-page` rather than restated, so the two pages cannot drift apart.
 */

import { FIELDS, REVIEWS, type FieldCard } from "@/lib/content/pathlab-page";

export const PARENTS_META = {
  title: "PathLab สำหรับผู้ปกครอง | Passion Seed",
  description:
    "สรุป PathLab สำหรับผู้ปกครอง: ลูกจะได้ทำอะไรใน 4-5 วัน ได้อะไรกลับบ้าน ใครดูแล ราคา 299 บาท และคำถามที่ผู้ปกครองถามบ่อย",
} as const;

/** The safeguarding channel. A parent needs one address that is not a DM. */
export const PARENTS_EMAIL = "seedpassion@gmail.com";

/** The written policy a parent can hold the team to, published in full. */
export const SAFEGUARDING_HREF = "/projectseed/safeguarding";

export const PARENTS_HERO = {
  eyebrow: "สำหรับคุณพ่อคุณแม่",
  title: "ลูกอยากลองทำโปรเจกต์จริงกับเรา",
  lead: "ลูกส่งหน้านี้มาให้ดู หน้านี้ตอบสี่คำถามที่ควรถามก่อนอนุญาต: เราเป็นใคร ดูแลความปลอดภัยยังไง ลูกได้ทำอะไรใน 4-5 วัน และเท่าไหร่",
  /** Answers the four fastest questions before the first scroll. */
  facts: [
    { label: "ระยะเวลา", value: "รอบละ 4-5 วัน" },
    { label: "การดูแล", value: "mentor 1 คน ต่อเด็ก 4 คน" },
    { label: "พื้นฐาน", value: "เริ่มจากศูนย์ได้" },
    { label: "ค่าใช้จ่าย", value: "299 บาท ต่อคน" },
  ],
  primaryCta: "คุยกับทีมก่อนตัดสินใจ",
  secondaryCta: "อ่านสรุป 2 นาที",
  caption: "ลูกเดินตามแผนที่ทีละวัน เห็นทั้งโจทย์และชิ้นงานที่ได้กลับไป",
  note: "ค่อย ๆ อ่านได้เลย สงสัยตรงไหนทักมาถามได้ตลอด",
} as const;

/**
 * Identity before programme. A parent handing over 299 baht and a teenager's
 * afternoons is asking who these people are, not what the curriculum covers.
 */
export const PARENTS_TRUST = {
  eyebrow: "เราเป็นใคร",
  title: "มีคนรับผิดชอบชัดเจน ไม่ใช่บัญชีนิรนาม",
  leadLabel: "ผู้รับผิดชอบดูแลความปลอดภัยนักเรียน",
  leadName: "บุณยสิทธิ์ ฟาง",
  leadRole: "Safeguarding Lead ของ Passion Seed ติดต่อโดยตรงได้ตลอด",
  channelsLabel: "ช่องทางติดต่อจริง",
  note: "อยากคุยกับเราก่อน ทักมาได้เลย ยินดีเสมอ",
} as const;

/**
 * Every line is a rule that already exists in the written policy, phrased so
 * a parent can hold the team to it. Nothing aspirational belongs here: an
 * unimplemented safeguard claimed on this page is worse than no page at all.
 */
export const PARENTS_SAFETY = {
  eyebrow: "ความปลอดภัยของนักเรียน",
  title: "กฎที่เรายึดถือ และคุณใช้ตรวจสอบเราได้",
  body: "เรามีนโยบายคุ้มครองนักเรียนเป็นลายลักษณ์อักษร ข้อแรกสำคัญที่สุด และเป็นข้อห้ามเด็ดขาด ไม่มีข้อยกเว้น",
  rules: [
    "ไม่มีการแชทส่วนตัวตัวต่อตัวกับนักเรียนที่ยังไม่บรรลุนิติภาวะ กิจกรรมทั้งหมดอยู่ในกลุ่มที่ตรวจสอบย้อนหลังได้",
    "ไม่มีการนัดเจอตัวต่อตัวลำพัง และไม่มีวิดีโอคอลส่วนตัวกับนักเรียน",
    "เราจะไม่ขอให้นักเรียนปิดบังข้อความ การนัดหมาย หรือเรื่องใด ๆ จากผู้ปกครอง",
    "เราไม่ขอรูปส่วนตัว ข้อมูลส่วนตัวที่ไม่จำเป็น หรือข้อมูลทางการเงินจากนักเรียน",
    "ไม่เผยแพร่รูป เรื่องราว หรือผลงานของนักเรียน โดยไม่ได้รับอนุญาตจากนักเรียนและผู้ปกครองก่อน",
    "ผู้ปกครองขอดูช่องทางที่ลูกอยู่ หรือขอให้ถอนออกเมื่อไหร่ก็ได้ ไม่ต้องให้เหตุผล",
  ],
  policyCta: "อ่านนโยบายคุ้มครองเด็กฉบับเต็ม",
  reportPrefix: "พบพฤติกรรมที่ไม่เหมาะสม หรือมีข้อกังวลใด ๆ แจ้งได้ทันทีที่",
  reportSuffix: "เราจะตอบและดำเนินการ ไม่มีการกดดันผู้แจ้ง",
  note: "ข้อไหนอยากให้อธิบายเพิ่ม บอกเราได้เลย",
} as const;

export const PARENTS_WHY_NOW = {
  eyebrow: "ทำไมต้องเป็นตอนนี้",
  title: "รอบพอร์ตไม่ได้วัดแค่เกรด",
  body: "กรรมการอ่านชิ้นงาน และเหตุผลที่เด็กเลือกทำสิ่งนั้น คนที่ทันมักเริ่มตั้งแต่ ม.5 ส่วนคนที่เริ่มตอน ม.6 มักไม่เหลือเวลาพอ PathLab ตัดขั้นที่ยากที่สุดออก คือขั้นเริ่มต้น",
  /** Reframes the two rings for a parent, who reads them as risk not FOMO. */
  ringCaption: "ตัวเลขจากนักเรียนที่ทีมทำงานด้วย",
  note: "ไม่ต้องรีบก็ได้ แค่อยากให้ลูกมีเวลาได้ลองผิดบ้าง",
} as const;

export interface ParentStep {
  number: string;
  title: string;
  detail: string;
}

export const PARENTS_STEPS: ParentStep[] = [
  {
    number: "01",
    title: "เลือกสายที่อยากลอง",
    detail: "เริ่มจากความสนใจของลูก ไม่ต้องมีพื้นฐานมาก่อน",
  },
  {
    number: "02",
    title: "ทำโจทย์จริงทีละวัน",
    detail: "เรียนเรื่องที่ต้องใช้ แล้วต่อกับชิ้นงานในวันเดียวกัน จบวันมีของส่งเสมอ",
  },
  {
    number: "03",
    title: "สะท้อนผลและเล่าชิ้นงาน",
    detail: "วันสุดท้ายลูกซ้อมเล่าโปรเจกต์ ฟังแล้วรู้เลยว่าเข้าใจแค่ไหน",
  },
];

export const PARENTS_WHAT = {
  eyebrow: "PATHLAB คืออะไร",
  note: "ลูกไม่ต้องเก่งมาก่อนเลย ขอแค่พร้อมลองทำจริง",
  title: "ไม่ใช่คอร์สดูคลิป แต่เป็นพื้นที่ให้ลองทำจริง",
  body: "แต่ละวันเรียนเท่าที่ใช้กับโจทย์ แล้วลงมือทำต่อทันที ลูกจึงเห็นทั้งความสนุกและความยากของสายนั้น ก่อนตัดสินใจเรียนต่อ",
} as const;

export interface TakeHomeItem {
  title: string;
  detail: string;
}

/** The concrete answer to "จ่ายไปแล้วลูกได้อะไรกลับมา". */
export const PARENTS_TAKE_HOME = {
  eyebrow: "จบรอบแล้วได้อะไร",
  title: "สี่อย่างที่ลูกถือกลับบ้าน",
  items: [
    {
      title: "ชิ้นงานที่เปิดให้คนอื่นดูได้",
      detail: "ลิงก์เว็บ เกมที่กดเล่นได้ หรือพิตช์เด็ค ส่งให้กรรมการดูได้ทันที",
    },
    {
      title: "สคริปต์เล่าโปรเจกต์",
      detail: "ซ้อมพูดว่าทำอะไร ติดอะไร แก้ยังไง ใช้ได้ทั้งพอร์ตและห้องสัมภาษณ์",
    },
    {
      title: "คำตอบว่าใช่หรือไม่ใช่",
      detail: "เจอทั้งวันที่สนุกและวันที่ติด ก่อนเลือกคณะด้วยข้อมูลจริง ไม่ใช่ภาพในหัว",
    },
    {
      title: "แผนก้าวต่อไป",
      detail: "mentor สรุปให้ว่าอีก 6 เดือนข้างหน้าควรเตรียมอะไรก่อน",
    },
  ] as readonly TakeHomeItem[],
  note: "ถ้าลูกลองแล้วรู้ว่าไม่ใช่ ก็ดีกับเขามากแล้ว",
} as const;

/**
 * A real round, day by day, taken from the Web Dev path so parents can see
 * that "โปรเจกต์จริง" has an actual schedule behind it. Sourced from FIELDS
 * rather than retyped, so it cannot drift from what the student page shows.
 */
const WEB_DEV = FIELDS.find((field) => field.label === "Web Dev");

export const PARENTS_SAMPLE = {
  eyebrow: "ตัวอย่างรอบจริง",
  title: "5 วันของสาย Web Dev",
  field: WEB_DEV?.label ?? "Web Dev",
  brief: WEB_DEV?.detail?.brief ?? "",
  briefBy: WEB_DEV?.detail?.briefBy ?? "",
  days: WEB_DEV?.detail?.days ?? [],
  dayPrefix: "วันที่",
  getsLabel: "ได้กลับไป",
  footnote: "สายอื่นใช้โครงเดียวกัน เปลี่ยนแค่โจทย์และเครื่องมือ",
  note: "วันแรกเราเริ่มไปพร้อมกันทั้งกลุ่ม ไม่ต้องเตรียมอะไรมาก่อน",
} as const;

export const PARENTS_FIELDS = {
  eyebrow: "สายที่เลือกได้",
  title: "เลือกจากสิ่งที่ลูกพูดถึงบ่อย",
  openLabel: "สายที่เปิดสอน",
  cta: "ดูรายละเอียดแต่ละสาย",
  note: "ยังไม่แน่ใจว่าสายไหน ทักมาคุยกัน เราช่วยดูให้",
} as const;

/** Real paths only: the "ask us" tile belongs to the student page. */
export const PARENTS_FIELD_CARDS: FieldCard[] = FIELDS.filter(
  (field) => !field.ask
);

export const PARENTS_VOICES = {
  eyebrow: "เสียงจากรุ่นพี่",
  title: "คนที่เคยผ่านรอบนี้พูดว่า",
  /** Only attributed quotes: an unsigned quote reads as marketing to a parent. */
  reviews: REVIEWS.filter((review) => Boolean(review.by)).slice(0, 3),
  note: "รุ่นพี่เขียนมาเองทุกคนเลย",
} as const;

/** How a round is actually run, stated as things the team commits to. */
export const PARENTS_STANDARDS = {
  eyebrow: "มาตรฐานของรอบ",
  title: "ทุกรอบจัดแบบนี้",
  points: [
    "โจทย์ออกแบบร่วมกับผู้เชี่ยวชาญที่ทำงานในสายนั้นจริง",
    "เรียนแบบ Learn + Do ลงมือสร้างและทดสอบทุกวัน",
    "mentor เป็นรุ่นพี่มหาวิทยาลัยและคนทำงานจริงในสายนั้น กลุ่มละ 4 คน",
    "จบรอบพร้อมชิ้นงานและเรื่องเล่าจากสิ่งที่ลงมือทำเอง",
  ],
  note: "เราดูที่ของที่เด็กทำได้ ไม่ได้ดูแค่ชั่วโมงเรียน",
} as const;

export interface ParentFaq {
  q: string;
  a: string;
}

/** The objections that actually stop a parent from paying, answered plainly. */
export const PARENTS_FAQ: ParentFaq[] = [
  {
    q: "ลูกไม่มีพื้นฐานเลย ตามคนอื่นทันไหม",
    a: "ทุกรอบออกแบบให้เริ่มจากศูนย์ วันแรกคือการติดตั้งเครื่องมือและวางโครงไปพร้อมกันทั้งกลุ่ม กลุ่มหนึ่งมีแค่ 4 คน mentor จึงเห็นว่าใครติดตรงไหนตั้งแต่ยังไม่ทันบอก",
  },
  {
    q: "กระทบการเรียนที่โรงเรียนไหม",
    a: "รอบใช้เวลา 4-5 วัน วันละไม่กี่ชั่วโมง และจัดในช่วงวันหยุดหรือปิดเทอมเป็นหลัก ตารางที่แน่นอนตกลงกับทีมได้ก่อนยืนยันรอบ",
  },
  {
    q: "ต่างจากคอร์สติวหรือคอร์สออนไลน์ยังไง",
    a: "คอร์สทั่วไปจบที่ความรู้ PathLab จบที่ชิ้นงาน ลูกเรียนเนื้อหาเท่าที่ต้องใช้กับโจทย์ของวันนั้น แล้วเอาไปทำต่อทันที สิ่งที่ได้กลับบ้านคือของที่เปิดให้คนอื่นดูได้ ไม่ใช่ไฟล์สไลด์",
  },
  {
    q: "ถ้าลูกลองแล้วพบว่าไม่ชอบสายนี้ เสียเปล่าไหม",
    a: "การรู้ว่าไม่ใช่ตั้งแต่ ม.4-5 คือผลลัพธ์ที่คุ้มที่สุดอย่างหนึ่ง ดีกว่ารู้ตอนเรียนปี 1 และต่อให้ไม่ไปต่อสายนั้น ชิ้นงานกับวิธีทำงานเป็นทีมยังติดตัวไปใช้ต่อได้",
  },
  {
    q: "ใครเป็นคนดูแลเด็กในรอบ",
    a: "mentor คือรุ่นพี่มหาวิทยาลัยและคนที่ทำงานในสายนั้นจริง ส่วนโจทย์ทุกชุดออกแบบร่วมกับผู้เชี่ยวชาญของสาย ทุกกิจกรรมอยู่ในกลุ่มที่ตรวจสอบย้อนหลังได้ ไม่มีการแชทส่วนตัวตัวต่อตัวกับนักเรียน ผู้ปกครองขอดูโปรไฟล์ mentor และช่องทางที่ลูกอยู่ได้ตลอด",
  },
  {
    q: "ต้องเตรียมอุปกรณ์อะไรบ้าง",
    a: "คอมพิวเตอร์หรือโน้ตบุ๊กที่ต่ออินเทอร์เน็ตได้หนึ่งเครื่องก็เริ่มได้ ถ้าสายที่เลือกต้องใช้โปรแกรมเฉพาะ ทีมจะส่งรายการและวิธีติดตั้งให้ก่อนวันแรก",
  },
  {
    q: "ผู้ปกครองจะรู้ได้ยังไงว่าลูกทำอะไรไปบ้าง",
    a: "ทุกวันมีของที่ต้องส่ง ลูกจะมีลิงก์ชิ้นงานที่เปิดดูได้ตลอด และวันสุดท้ายมีการเล่าโปรเจกต์ ฟังรอบเดียวก็เห็นว่าลูกเข้าใจสิ่งที่ทำแค่ไหน",
  },
  {
    q: "สมัครและชำระเงินยังไง",
    a: "ทักทีมทาง Instagram, LINE OA หรืออีเมล บอกสายที่สนใจและช่วงเวลาที่สะดวก ทีมจะยืนยันรอบแล้วแจ้งวิธีชำระเงิน 299 บาทต่อคน จ่ายครั้งเดียวจบ ไม่มีการตัดเงินอัตโนมัติ จากนั้นส่งตารางและกลุ่มให้ก่อนวันเริ่ม",
  },
  {
    q: "ผู้ปกครองทักมาถามเองได้ไหม",
    a: "ได้และเป็นเรื่องปกติ หลายครอบครัวคุยกับทีมก่อนแล้วค่อยให้ลูกสมัคร ถ้ามีข้อกังวลเรื่องความปลอดภัยโดยเฉพาะ ส่งอีเมลถึงผู้รับผิดชอบได้โดยตรง",
  },
];

export const PARENTS_FAQ_SECTION = {
  eyebrow: "คำถามที่ถามบ่อย",
  title: "คำถามก่อนตัดสินใจ",
  fallback: "มีคำถามที่ไม่มีในนี้ ทักมาถามได้เลย ตอบทุกข้อความ",
  note: "ถามได้ทุกข้อเลย ไม่มีคำถามไหนเล็กเกินไป",
} as const;

export const PARENTS_PRICE = {
  eyebrow: "ค่าใช้จ่าย",
  title: "จ่ายครั้งเดียว จบทั้งรอบ",
  tiers: [
    {
      label: "เดี่ยว",
      amount: "299",
      unit: "ต่อคน · รอบ 4-5 วัน",
      blurb: "มาคนเดียวได้ ทีมจัดกลุ่มและ mentor ให้",
      featured: false,
    },
    {
      label: "กลุ่ม 4 คน",
      amount: "999",
      unit: "ทั้งกลุ่ม · เลือกวันเริ่มได้",
      blurb: "ชวนเพื่อนลูกมาด้วยกัน เลือกวันเริ่มเองได้",
      featured: true,
    },
  ],
  notes: [
    "จ่ายครั้งเดียวจบทั้งรอบ ไม่มีค่าใช้จ่ายต่อเนื่องและไม่มีการตัดเงินอัตโนมัติ",
    "มาเดี่ยว ทีมจะจัดกลุ่มและหาเวลาที่ทุกคนตรงกันให้",
    "ยืนยันรอบและวันเริ่มผ่านแชทกับทีมก่อนชำระเงินเสมอ คุณพ่อคุณแม่ทักมาคุยเองได้",
  ],
  note: "เรื่องรอบหรือตารางเวลา ทักมาถามก่อนได้เลย",
} as const;

export const PARENTS_CLOSE = {
  eyebrow: "คุยกับทีม",
  title: "ยังไม่ต้องตัดสินใจวันนี้ก็ได้",
  body: "บอกแค่ว่าลูกอยู่ชั้นไหน สนใจอะไร เราจะบอกตรง ๆ ว่ารอบไหนเหมาะ หรือควรรอก่อน",
  igCta: "ทัก Instagram",
  lineCta: "ทัก LINE OA",
  emailCta: "ส่งอีเมล",
  studentLink: "ดูหน้า PathLab ฉบับเต็มที่ลูกเห็น",
  note: "ทักมาคุยเฉย ๆ ก่อนก็ได้ ยังไม่ต้องสมัคร",
} as const;

export const PARENTS_STICKY = {
  chat: "ทักถามทีม",
  price: "ดูราคาและรอบ",
} as const;
