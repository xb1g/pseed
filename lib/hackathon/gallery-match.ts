// lib/hackathon/gallery-match.ts
// Question tree, tag constants, scoring algorithm, and "why" template composer

export const WHO_TAGS = [
  { value: "student_high_school", en: "High school student", th: "นักเรียนมัธยม" },
  { value: "student_university", en: "University student", th: "นักศึกษามหาวิทยาลัย" },
  { value: "working_adult", en: "Working adult / Office worker", th: "คนวัยทำงาน" },
  { value: "elderly", en: "Elderly person", th: "ผู้สูงอายุ" },
  { value: "caregiver", en: "Caregiver / Family member", th: "ผู้ดูแล / คนในครอบครัว" },
  { value: "parent", en: "Parent", th: "ผู้ปกครอง" },
  { value: "community_member", en: "Community member / Volunteer", th: "คนในชุมชน / อาสาสมัคร" },
  { value: "healthcare_worker", en: "Healthcare worker / Health volunteer", th: "บุคลากรสาธารณสุข / อสม." },
] as const;

export const WHAT_TAGS = [
  { value: "stress_burnout", en: "Stress, burnout, or feeling overwhelmed", th: "เครียด หมดไฟ หรือรู้สึกหมดแรง" },
  { value: "mental_health_stigma", en: "Want to talk about feelings but afraid to", th: "อยากพูดเรื่องจิตใจแต่กลัวถูกตัดสิน" },
  { value: "focus_screen_addiction", en: "Can't focus / addicted to phone or social media", th: "สมาธิหาย / ติดโทรศัพท์หรือโซเชียล" },
  { value: "physical_pain_posture", en: "Body pain, bad posture, or office syndrome", th: "ปวดตัว ท่านั่งผิด หรือออฟฟิศซินโดรม" },
  { value: "exercise_motivation", en: "Want to exercise but lack motivation", th: "อยากออกกำลังกายแต่ขาดแรงจูงใจ" },
  { value: "chronic_illness", en: "Managing chronic illness (diabetes, thalassemia, etc.)", th: "ดูแลโรคเรื้อรัง (เบาหวาน ธาลัสซีเมีย ฯลฯ)" },
  { value: "elderly_cognitive", en: "Worried about dementia or memory decline", th: "กังวลเรื่องสมองเสื่อมหรือความจำถดถอย" },
  { value: "air_pollution", en: "Dealing with PM2.5 or environmental health", th: "รับมือกับฝุ่น PM2.5 หรือสุขภาพสิ่งแวดล้อม" },
  { value: "nutrition_diet", en: "Want to eat healthier or understand blood results", th: "อยากกินดีขึ้นหรือเข้าใจผลเลือด" },
  { value: "medication_safety", en: "Confused about medicine or afraid of wrong dosage", th: "สับสนเรื่องยาหรือกลัวใช้ยาผิด" },
  { value: "emergency_first_aid", en: "Want to know what to do in emergencies", th: "อยากรู้ว่าต้องทำอะไรเมื่อเกิดเหตุฉุกเฉิน" },
  { value: "herbal_traditional", en: "Interested in herbal or traditional medicine", th: "สนใจสมุนไพรหรือแพทย์แผนไทย" },
  { value: "food_safety_waste", en: "Worried about food safety or food waste", th: "กังวลเรื่องความปลอดภัยอาหาร / ทิ้งอาหารเปลือง" },
  { value: "depression_support", en: "Supporting someone with depression", th: "ดูแลคนที่เป็นซึมเศร้า" },
  { value: "sleep_eye_fatigue", en: "Sleep problems or eye strain from screens", th: "นอนไม่หลับ หรือตาล้าจากหน้าจอ" },
  { value: "health_data_access", en: "Want access to own health records", th: "อยากเข้าถึงข้อมูลสุขภาพตัวเอง" },
  { value: "autism_sensory", en: "Sensory overload or stimming needs", th: "รับสิ่งเร้ามากเกินไป หรือต้องการ stimming" },
  { value: "drowsy_driving", en: "Drowsy driving risk", th: "ง่วงขณะขับรถ" },
] as const;

export type WhoTag = (typeof WHO_TAGS)[number]["value"];
export type WhatTag = (typeof WHAT_TAGS)[number]["value"];

export type TargetPersonas = {
  who: WhoTag[];
  what: WhatTag[];
};

// ── Question Tree ──────────────────────────────────────────────────────

export type QuizOption = {
  en: string;
  th: string;
  tag?: string;         // WHO, AREA, or WHAT tag this option sets
  next: string | null;  // next question id, null = done (go to reveal)
};

export type QuizQuestion = {
  id: string;
  whale_en: string;
  whale_th: string;
  options: QuizOption[];
};

// Q1: Who are you?
const Q1_WHO: QuizQuestion = {
  id: "q1_who",
  whale_en: "Hi! I'm here to help you find something built just for you. First — tell me about yourself!",
  whale_th: "สวัสดี! ฉันจะช่วยหาสิ่งที่สร้างมาเพื่อคุณ บอกเล่าเกี่ยวกับตัวคุณหน่อย!",
  options: [
    { en: "I'm in high school", th: "เรียนมัธยม", tag: "student_high_school", next: "q2_area" },
    { en: "I'm in university", th: "เรียนมหาวิทยาลัย", tag: "student_university", next: "q2_area" },
    { en: "I work", th: "ทำงานแล้ว", tag: "working_adult", next: "q2_area" },
    { en: "I'm a senior", th: "เป็นผู้สูงอายุ", tag: "elderly", next: "q2_area" },
    { en: "I take care of someone", th: "ดูแลคนในครอบครัว", tag: "caregiver", next: "q2_area" },
    { en: "I work in healthcare / I'm a health volunteer", th: "ทำงานด้านสุขภาพ / เป็น อสม.", tag: "healthcare_worker", next: "q2_area_healthcare" },
    { en: "Just exploring!", th: "แค่อยากดู!", tag: undefined, next: null },
  ],
};

// Q2: What area? (standard)
const Q2_AREA: QuizQuestion = {
  id: "q2_area",
  whale_en: "Got it! What area of your life has been on your mind lately?",
  whale_th: "เข้าใจแล้ว! ช่วงนี้กังวลเรื่องอะไรมากที่สุด?",
  options: [
    { en: "My mind — stress, emotions, focus", th: "จิตใจ — เครียด อารมณ์ สมาธิ", tag: "area_mind", next: "q3_mind" },
    { en: "My body — pain, exercise, illness", th: "ร่างกาย — ปวด ออกกำลังกาย เจ็บป่วย", tag: "area_body", next: "q3_body" },
    { en: "My daily life — food, safety, environment", th: "ชีวิตประจำวัน — อาหาร ความปลอดภัย สิ่งแวดล้อม", tag: "area_daily", next: "q3_daily" },
    { en: "Someone I care about", th: "คนที่ห่วงใย", tag: "area_others", next: "q3_others" },
  ],
};

// Q2: Healthcare worker variant (has extra option)
const Q2_AREA_HEALTHCARE: QuizQuestion = {
  id: "q2_area_healthcare",
  whale_en: "Got it! What area has been on your mind lately?",
  whale_th: "เข้าใจแล้ว! ช่วงนี้กังวลเรื่องอะไรมากที่สุด?",
  options: [
    { en: "My patients / community health", th: "ผู้ป่วยของฉัน / สุขภาพชุมชน", tag: "area_healthcare_pro", next: "q3_healthcare" },
    { en: "My mind — stress, emotions, focus", th: "จิตใจ — เครียด อารมณ์ สมาธิ", tag: "area_mind", next: "q3_mind" },
    { en: "My body — pain, exercise, illness", th: "ร่างกาย — ปวด ออกกำลังกาย เจ็บป่วย", tag: "area_body", next: "q3_body" },
    { en: "My daily life — food, safety, environment", th: "ชีวิตประจำวัน — อาหาร ความปลอดภัย สิ่งแวดล้อม", tag: "area_daily", next: "q3_daily" },
    { en: "Someone I care about", th: "คนที่ห่วงใย", tag: "area_others", next: "q3_others" },
  ],
};

// Q3 branches
const Q3_MIND: QuizQuestion = {
  id: "q3_mind",
  whale_en: "Tell me more — which of these sounds most like you?",
  whale_th: "บอกเพิ่มเติมหน่อย — ข้อไหนตรงกับคุณมากที่สุด?",
  options: [
    { en: "Burned out / overwhelmed by work or study", th: "หมดไฟ / ท่วมจากเรียนหรืองาน", tag: "stress_burnout", next: null },
    { en: "Want to talk but afraid of being judged", th: "อยากพูดแต่กลัวถูกตัดสิน", tag: "mental_health_stigma", next: null },
    { en: "Can't focus / too much screen time", th: "สมาธิหาย / ใช้จอมากไป", tag: "focus_screen_addiction", next: null },
    { en: "Feeling lonely or disconnected", th: "รู้สึกเหงา หรือไม่มีคนเข้าใจ", tag: "stress_burnout", next: null },
    { en: "Eye strain or sleep problems from screens", th: "ตาล้า หรือนอนไม่หลับจากหน้าจอ", tag: "sleep_eye_fatigue", next: null },
  ],
};

const Q3_BODY: QuizQuestion = {
  id: "q3_body",
  whale_en: "Tell me more — which of these sounds most like you?",
  whale_th: "บอกเพิ่มเติมหน่อย — ข้อไหนตรงกับคุณมากที่สุด?",
  options: [
    { en: "Body pain / office syndrome from sitting", th: "ปวดตัว / ออฟฟิศซินโดรมจากนั่งนาน", tag: "physical_pain_posture", next: null },
    { en: "Want to exercise but can't get motivated", th: "อยากออกกำลังกายแต่เริ่มไม่ได้", tag: "exercise_motivation", next: null },
    { en: "Managing a chronic illness", th: "ดูแลโรคเรื้อรัง (เบาหวาน ธาลัสซีเมีย...)", tag: "chronic_illness", next: null },
    { en: "Worried about wounds or injuries healing", th: "กังวลเรื่องแผลหรือการรักษาบาดแผล", tag: "chronic_illness", next: null },
    { en: "Confused about medication or dosage", th: "สับสนเรื่องยาหรือขนาดยา", tag: "medication_safety", next: null },
  ],
};

const Q3_DAILY: QuizQuestion = {
  id: "q3_daily",
  whale_en: "Tell me more — which of these sounds most like you?",
  whale_th: "บอกเพิ่มเติมหน่อย — ข้อไหนตรงกับคุณมากที่สุด?",
  options: [
    { en: "PM2.5 / air quality / heatstroke", th: "ฝุ่น PM2.5 / คุณภาพอากาศ / ฮีทสโตรก", tag: "air_pollution", next: null },
    { en: "Want to eat healthier or understand blood test results", th: "อยากกินดีขึ้น หรือเข้าใจผลเลือด", tag: "nutrition_diet", next: null },
    { en: "Food waste / don't know if food is still good", th: "ทิ้งอาหารเปลือง / ไม่รู้ว่าอาหารยังกินได้ไหม", tag: "food_safety_waste", next: null },
    { en: "Interested in herbal or traditional medicine", th: "สนใจสมุนไพร หรือแพทย์แผนไทย", tag: "herbal_traditional", next: null },
    { en: "Don't know what to do in an emergency", th: "ไม่รู้ว่าต้องทำอะไรเมื่อเกิดเหตุฉุกเฉิน", tag: "emergency_first_aid", next: null },
    { en: "Want access to my own health records", th: "อยากเข้าถึงข้อมูลสุขภาพตัวเอง", tag: "health_data_access", next: null },
  ],
};

const Q3_OTHERS: QuizQuestion = {
  id: "q3_others",
  whale_en: "Tell me more — what are you most worried about?",
  whale_th: "บอกเพิ่มเติมหน่อย — กังวลเรื่องอะไรมากที่สุด?",
  options: [
    { en: "Worried about parent's memory / dementia", th: "กังวลเรื่องความจำของพ่อแม่ / สมองเสื่อม", tag: "elderly_cognitive", next: null },
    { en: "Supporting someone with depression", th: "ดูแลคนที่เป็นซึมเศร้า", tag: "depression_support", next: null },
    { en: "Managing their medication for them", th: "จัดการเรื่องยาให้คนที่ดูแล", tag: "medication_safety", next: null },
    { en: "Autistic family member needs sensory support", th: "คนในครอบครัวมีออทิสติก ต้องการ sensory support", tag: "autism_sensory", next: null },
    { en: "Worried about them driving when tired", th: "กังวลเรื่องขับรถตอนง่วง", tag: "drowsy_driving", next: null },
  ],
};

const Q3_HEALTHCARE: QuizQuestion = {
  id: "q3_healthcare",
  whale_en: "What challenges do you face in your work?",
  whale_th: "ในงานของคุณ เจอปัญหาอะไรบ้าง?",
  options: [
    { en: "Prescription errors / medication communication", th: "ข้อผิดพลาดใบสั่งยา / สื่อสารเรื่องยา", tag: "medication_safety", next: null },
    { en: "Patient health data scattered across hospitals", th: "ข้อมูลผู้ป่วยกระจัดกระจายระหว่างโรงพยาบาล", tag: "health_data_access", next: null },
    { en: "Screening patients for early symptoms", th: "คัดกรองผู้ป่วยเบื้องต้น", tag: "chronic_illness", next: null },
    { en: "Tracking at-risk NCD patients in community", th: "ติดตามผู้ป่วย NCD กลุ่มเสี่ยงในชุมชน", tag: "chronic_illness", next: null },
    { en: "Herbal medicine knowledge for patients", th: "ความรู้สมุนไพรสำหรับผู้ป่วย", tag: "herbal_traditional", next: null },
  ],
};

export const QUESTION_MAP: Record<string, QuizQuestion> = {
  q1_who: Q1_WHO,
  q2_area: Q2_AREA,
  q2_area_healthcare: Q2_AREA_HEALTHCARE,
  q3_mind: Q3_MIND,
  q3_body: Q3_BODY,
  q3_daily: Q3_DAILY,
  q3_others: Q3_OTHERS,
  q3_healthcare: Q3_HEALTHCARE,
};

export const FIRST_QUESTION_ID = "q1_who";

// ── Scoring ────────────────────────────────────────────────────────────

export type VisitorAnswers = {
  who: WhoTag | null;
  what: WhatTag | null;
};

export type ScoredProduct = {
  product: {
    id: string;
    team_id: string;
    product_name: string;
    product_name_th: string | null;
    problem_statement: string;
    problem_statement_th: string | null;
    cover_image_url: string | null;
    tags: string[];
    interest_count: number;
    match_count: number;
    target_personas: TargetPersonas | null;
    team_name: string;
  };
  score: number;
};

export function scoreProducts(
  answers: VisitorAnswers,
  products: ScoredProduct["product"][]
): ScoredProduct[] {
  const scored: ScoredProduct[] = [];

  for (const product of products) {
    const tp = product.target_personas;
    if (!tp || !tp.who?.length || !tp.what?.length) continue;

    const whoMatch = answers.who && tp.who.includes(answers.who) ? 1 : 0;
    const whatMatch = answers.what && tp.what.includes(answers.what) ? 1 : 0;
    const score = whoMatch + whatMatch * 2; // WHAT weighs double

    if (score > 0) {
      scored.push({ product, score });
    }
  }

  // Sort: highest score first, then lowest match_count (distribute visibility)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.match_count - b.product.match_count;
  });

  return scored;
}

// ── "Why" Template Composer ────────────────────────────────────────────

const WHO_FRAGMENTS: Record<string, { en: string; th: string }> = {
  student_high_school: { en: "As a high school student", th: "ในฐานะนักเรียนมัธยม" },
  student_university: { en: "As a university student", th: "ในฐานะนักศึกษา" },
  working_adult: { en: "As a working person", th: "ในฐานะคนวัยทำงาน" },
  elderly: { en: "For someone in your stage of life", th: "สำหรับคนในวัยของคุณ" },
  caregiver: { en: "As someone who cares for others", th: "ในฐานะผู้ดูแลคนที่คุณรัก" },
  parent: { en: "As a parent", th: "ในฐานะผู้ปกครอง" },
  community_member: { en: "As someone in the community", th: "ในฐานะคนในชุมชน" },
  healthcare_worker: { en: "As a healthcare worker", th: "ในฐานะบุคลากรสาธารณสุข" },
};

const WHAT_FRAGMENTS: Record<string, { en: string; th: string }> = {
  stress_burnout: { en: "dealing with burnout and stress", th: "ที่กำลังเผชิญกับความเครียดและภาวะหมดไฟ" },
  mental_health_stigma: { en: "wanting a safe space to talk about your feelings", th: "ที่อยากมีพื้นที่ปลอดภัยในการพูดเรื่องความรู้สึก" },
  focus_screen_addiction: { en: "struggling to focus with too much screen time", th: "ที่มีปัญหาสมาธิจากการใช้จอมากเกินไป" },
  physical_pain_posture: { en: "dealing with body pain from sitting too long", th: "ที่ปวดตัวจากการนั่งนานเกินไป" },
  exercise_motivation: { en: "wanting to exercise but finding it hard to start", th: "ที่อยากออกกำลังกายแต่เริ่มไม่ได้" },
  chronic_illness: { en: "managing a chronic health condition", th: "ที่กำลังดูแลโรคเรื้อรัง" },
  elderly_cognitive: { en: "worried about memory decline", th: "ที่กังวลเรื่องความจำถดถอย" },
  air_pollution: { en: "concerned about air quality and PM2.5", th: "ที่กังวลเรื่องคุณภาพอากาศและฝุ่น PM2.5" },
  nutrition_diet: { en: "wanting to understand nutrition and eat healthier", th: "ที่อยากเข้าใจโภชนาการและกินดีขึ้น" },
  medication_safety: { en: "worried about medication safety", th: "ที่กังวลเรื่องความปลอดภัยในการใช้ยา" },
  emergency_first_aid: { en: "wanting to know what to do in emergencies", th: "ที่อยากรู้ว่าต้องทำอะไรเมื่อเกิดเหตุฉุกเฉิน" },
  herbal_traditional: { en: "interested in herbal and traditional medicine", th: "ที่สนใจสมุนไพรและแพทย์แผนไทย" },
  food_safety_waste: { en: "dealing with food waste or safety concerns", th: "ที่กังวลเรื่องอาหารเปลืองหรือความปลอดภัยอาหาร" },
  depression_support: { en: "supporting someone with depression", th: "ที่ดูแลคนที่เป็นซึมเศร้า" },
  sleep_eye_fatigue: { en: "dealing with sleep problems or eye strain", th: "ที่มีปัญหานอนไม่หลับหรือตาล้า" },
  health_data_access: { en: "wanting better access to health records", th: "ที่อยากเข้าถึงข้อมูลสุขภาพได้ดีขึ้น" },
  autism_sensory: { en: "needing sensory support", th: "ที่ต้องการการช่วยเหลือด้านประสาทสัมผัส" },
  drowsy_driving: { en: "worried about drowsy driving", th: "ที่กังวลเรื่องง่วงขณะขับรถ" },
};

export function composeWhyText(
  who: WhoTag | null,
  what: WhatTag | null,
  productName: string,
  problemStatement: string,
  lang: "en" | "th"
): string {
  const whoFrag = who ? WHO_FRAGMENTS[who]?.[lang] : null;
  const whatFrag = what ? WHAT_FRAGMENTS[what]?.[lang] : null;

  // Truncate problem statement to ~120 chars
  const shortProblem = problemStatement.length > 120
    ? problemStatement.slice(0, 117) + "..."
    : problemStatement;

  if (whoFrag && whatFrag) {
    if (lang === "th") {
      return `${whoFrag}${whatFrag} ${productName} ถูกสร้างมาเพื่อสิ่งนี้ — ${shortProblem}`;
    }
    return `${whoFrag} ${whatFrag}, ${productName} was built for exactly this — ${shortProblem}`;
  }

  // Fallback
  if (lang === "th") {
    return `${productName} อาจเป็นประโยชน์สำหรับคุณ — ${shortProblem}`;
  }
  return `${productName} might be helpful for you — ${shortProblem}`;
}
