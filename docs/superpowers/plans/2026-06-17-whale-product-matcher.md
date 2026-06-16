# Whale Product Matcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Akinator-style whale mascot quiz that matches gallery visitors to hackathon products based on who they are and what problem they face.

**Architecture:** A new `/hackathon/gallery/match` page with a client-side state machine drives a 3-4 question branching flow. Products store `target_personas` jsonb (WHO tags + WHAT tags) set by teams in the submit form. A scoring engine matches visitor answers to products. Match events are recorded in a new `hackathon_gallery_matches` table with a trigger that increments `match_count` on the product.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), React client components, existing Bloom design system CSS variables, existing i18n system (`useLang`, `t()`), existing GalleryMascot frame animation component.

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `supabase/migrations/20260617100000_gallery_matcher.sql` | DB: target_personas column, matches table, match_count column, trigger, RLS | Create |
| `lib/hackathon/gallery-match.ts` | Question tree data, WHO/WHAT tag constants, scoring algorithm, "why" template composer | Create |
| `lib/hackathon/gallery.ts` | Add target_personas to types + submit/fetch functions | Modify |
| `app/api/hackathon/gallery/submit/route.ts` | Validate target_personas in submit payload | Modify |
| `app/api/hackathon/gallery/match/route.ts` | POST endpoint to record a match event | Create |
| `components/hackathon/gallery/WhaleChat.tsx` | State machine UI: whale + speech bubble + option buttons + transitions | Create |
| `components/hackathon/gallery/MatchReveal.tsx` | Dramatic reveal: product card + personalized "why" + secondary matches | Create |
| `app/hackathon/gallery/match/page.tsx` | Match page: orchestrates WhaleChat -> scoring -> MatchReveal | Create |
| `app/hackathon/gallery/submit/page.tsx` | Add WHO/WHAT tag picker fields to submit form | Modify |
| `app/hackathon/gallery/page.tsx` | Add "Find your match" CTA button | Modify |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260617100000_gallery_matcher.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Whale Product Matcher: target personas, match tracking, match_count

-- 1. Add target_personas column to gallery products
ALTER TABLE public.hackathon_gallery_products
  ADD COLUMN IF NOT EXISTS target_personas JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS match_count INTEGER NOT NULL DEFAULT 0;

-- 2. Match tracking table
CREATE TABLE IF NOT EXISTS public.hackathon_gallery_matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.hackathon_gallery_products(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  match_score NUMERIC NOT NULL,
  answers     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_matches_product ON public.hackathon_gallery_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_matches_session ON public.hackathon_gallery_matches(session_id);

-- 3. RLS
ALTER TABLE public.hackathon_gallery_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_matches_public_insert ON public.hackathon_gallery_matches;
CREATE POLICY gallery_matches_public_insert
  ON public.hackathon_gallery_matches FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS gallery_matches_team_read ON public.hackathon_gallery_matches;
CREATE POLICY gallery_matches_team_read
  ON public.hackathon_gallery_matches FOR SELECT
  USING (
    product_id IN (
      SELECT gp.id FROM public.hackathon_gallery_products gp
      JOIN public.hackathon_team_members tm ON tm.team_id = gp.team_id
      JOIN public.hackathon_participants p ON p.id = tm.participant_id
      WHERE p.user_id = auth.uid()
    )
  );

-- 4. Auto-increment match_count (deduplicated per session+product)
CREATE OR REPLACE FUNCTION public.increment_gallery_match_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.hackathon_gallery_matches
    WHERE session_id = NEW.session_id AND product_id = NEW.product_id
    AND id != NEW.id
  ) THEN
    UPDATE public.hackathon_gallery_products
    SET match_count = match_count + 1, updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gallery_match_count ON public.hackathon_gallery_matches;
CREATE TRIGGER trg_gallery_match_count
  AFTER INSERT ON public.hackathon_gallery_matches
  FOR EACH ROW EXECUTE FUNCTION public.increment_gallery_match_count();
```

- [ ] **Step 2: Push migration to local Supabase**

Run: `supabase db push --local`
Expected: Migration applies successfully with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617100000_gallery_matcher.sql
git commit -m "feat(gallery): add target_personas, match tracking table, match_count"
```

---

### Task 2: Match Engine — Tags, Question Tree, and Scoring

**Files:**
- Create: `lib/hackathon/gallery-match.ts`

- [ ] **Step 1: Create the match engine file with WHO/WHAT tag constants**

```typescript
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

type AreaTag = "area_mind" | "area_body" | "area_daily" | "area_others" | "area_healthcare_pro";

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
  product: { id: string; team_id: string; product_name: string; product_name_th: string | null; problem_statement: string; problem_statement_th: string | null; cover_image_url: string | null; tags: string[]; interest_count: number; match_count: number; target_personas: TargetPersonas | null; team_name: string };
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

  // Truncate problem statement to ~100 chars
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/hackathon/gallery-match.ts
git commit -m "feat(gallery): add match engine — tags, question tree, scoring, why-templates"
```

---

### Task 3: Update Types and Gallery Lib

**Files:**
- Modify: `lib/hackathon/gallery.ts`

- [ ] **Step 1: Add `target_personas` and `match_count` to types and queries**

In `lib/hackathon/gallery.ts`, add to the `GalleryProduct` type after `line_id`:

```typescript
  target_personas: { who: string[]; what: string[] } | null;
  match_count: number;
```

Add to `GalleryProductSummary` Pick list:

```typescript
  | "match_count"
  | "target_personas"
```

(Remove the existing `& { team_name: string }` and re-add it after the new fields.)

Add `target_personas` and `match_count` to the `getGalleryProducts` select clause:

```
      target_personas,
      match_count,
```

Add the same fields to the mapping in `getGalleryProducts` return:

```typescript
    target_personas: row.target_personas ?? null,
    match_count: row.match_count ?? 0,
```

Add `target_personas` to `GalleryProductInput`:

```typescript
  target_personas?: { who: string[]; what: string[] } | null;
```

Add `target_personas` to the `upsertGalleryProduct` payload:

```typescript
    target_personas: data.target_personas ?? null,
```

Add to the `upsertGalleryProduct` return object:

```typescript
    target_personas: row.target_personas ?? null,
    match_count: row.match_count ?? 0,
```

Add `match_count` and `target_personas` to `getGalleryProduct` and `getMyGalleryProduct` return objects:

```typescript
    target_personas: data.target_personas ?? null,
    match_count: data.match_count ?? 0,
```

Also add `match_count` and `target_personas` to `adminGetAllProducts` return.

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | tail -20`
Expected: No type errors related to target_personas or match_count.

- [ ] **Step 3: Commit**

```bash
git add lib/hackathon/gallery.ts
git commit -m "feat(gallery): add target_personas and match_count to types and queries"
```

---

### Task 4: Submit API — Accept target_personas

**Files:**
- Modify: `app/api/hackathon/gallery/submit/route.ts`

- [ ] **Step 1: Add target_personas validation to the submit route**

After the `contact_email` validation (around line 79), add:

```typescript
  // target_personas validation
  let target_personas: { who: string[]; what: string[] } | null = null;
  if (body.target_personas && typeof body.target_personas === "object") {
    const who = Array.isArray(body.target_personas.who) ? body.target_personas.who.filter((v: unknown) => typeof v === "string") : [];
    const what = Array.isArray(body.target_personas.what) ? body.target_personas.what.filter((v: unknown) => typeof v === "string") : [];
    if (who.length > 0 || what.length > 0) {
      if (who.length > 3) errors.push("target_personas.who: maximum 3 tags");
      if (what.length > 3) errors.push("target_personas.what: maximum 3 tags");
      target_personas = { who: who.slice(0, 3), what: what.slice(0, 3) };
    }
  }
```

Add `target_personas` to the `input` object:

```typescript
    target_personas,
```

- [ ] **Step 2: Commit**

```bash
git add app/api/hackathon/gallery/submit/route.ts
git commit -m "feat(gallery): accept target_personas in submit API"
```

---

### Task 5: Match Recording API

**Files:**
- Create: `app/api/hackathon/gallery/match/route.ts`

- [ ] **Step 1: Create the match recording endpoint**

```typescript
// app/api/hackathon/gallery/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const product_id = body.product_id;
  const session_id = body.session_id;
  const match_score = body.match_score;
  const answers = body.answers;

  if (!product_id || typeof product_id !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 422 });
  }
  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "session_id required" }, { status: 422 });
  }
  if (typeof match_score !== "number") {
    return NextResponse.json({ error: "match_score required" }, { status: 422 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 422 });
  }

  const { error } = await getClient()
    .from("hackathon_gallery_matches")
    .insert({ product_id, session_id, match_score, answers });

  if (error) {
    console.error("[gallery/match]", error);
    return NextResponse.json({ error: "Failed to record match" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/hackathon/gallery/match/route.ts
git commit -m "feat(gallery): add match recording API endpoint"
```

---

### Task 6: Submit Form — WHO/WHAT Tag Pickers

**Files:**
- Modify: `app/hackathon/gallery/submit/page.tsx`

- [ ] **Step 1: Import tag constants**

At the top of the file, add:

```typescript
import { WHO_TAGS, WHAT_TAGS } from "@/lib/hackathon/gallery-match";
```

- [ ] **Step 2: Add target_personas to FormState**

Add to the `FormState` type:

```typescript
  target_personas: { who: string[]; what: string[] };
```

Add to `EMPTY_FORM`:

```typescript
  target_personas: { who: [], what: [] },
```

- [ ] **Step 3: Add target_personas prefill from existing product**

In the `useEffect` that loads `data.product`, add:

```typescript
  target_personas: data.product.target_personas ?? { who: [], what: [] },
```

- [ ] **Step 4: Add the tag picker UI sections to the form**

After the tags/track section (around the LINE QR section), add two new `FormField` sections — one for WHO tags, one for WHAT tags. Each renders checkboxes in a flex-wrap layout, max 3 selectable:

```tsx
{/* Target audience — WHO */}
<FormField label="Who is your product for?" hint="Pick 1–3">
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
    {WHO_TAGS.map((tag) => {
      const active = form.target_personas.who.includes(tag.value);
      return (
        <button
          key={tag.value}
          type="button"
          onClick={() => {
            setForm((p) => {
              const who = active
                ? p.target_personas.who.filter((v) => v !== tag.value)
                : p.target_personas.who.length < 3
                  ? [...p.target_personas.who, tag.value]
                  : p.target_personas.who;
              return { ...p, target_personas: { ...p.target_personas, who } };
            });
          }}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "9999px",
            fontSize: "0.8125rem",
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontWeight: 600,
            border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
            background: active ? "rgba(97,154,210,0.15)" : "transparent",
            color: active ? "#91C4E3" : "rgba(145,196,227,0.45)",
            cursor: "pointer",
            transition: "all 180ms",
          }}
        >
          {tag.en}
          <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.7 }}>{tag.th}</span>
        </button>
      );
    })}
  </div>
</FormField>

{/* Target problem — WHAT */}
<FormField label="What problem does it solve?" hint="Pick 1–3">
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
    {WHAT_TAGS.map((tag) => {
      const active = form.target_personas.what.includes(tag.value);
      return (
        <button
          key={tag.value}
          type="button"
          onClick={() => {
            setForm((p) => {
              const what = active
                ? p.target_personas.what.filter((v) => v !== tag.value)
                : p.target_personas.what.length < 3
                  ? [...p.target_personas.what, tag.value]
                  : p.target_personas.what;
              return { ...p, target_personas: { ...p.target_personas, what } };
            });
          }}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "9999px",
            fontSize: "0.8125rem",
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontWeight: 600,
            border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
            background: active ? "rgba(97,154,210,0.15)" : "transparent",
            color: active ? "#91C4E3" : "rgba(145,196,227,0.45)",
            cursor: "pointer",
            transition: "all 180ms",
          }}
        >
          {tag.en}
          <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.7 }}>{tag.th}</span>
        </button>
      );
    })}
  </div>
</FormField>
```

- [ ] **Step 5: Include target_personas in the submit payload**

In `handleSubmit`, add to the `JSON.stringify` body:

```typescript
  target_personas: (form.target_personas.who.length > 0 || form.target_personas.what.length > 0)
    ? form.target_personas
    : null,
```

- [ ] **Step 6: Commit**

```bash
git add app/hackathon/gallery/submit/page.tsx
git commit -m "feat(gallery): add WHO/WHAT tag pickers to submit form"
```

---

### Task 7: WhaleChat Component — State Machine UI

**Files:**
- Create: `components/hackathon/gallery/WhaleChat.tsx`

- [ ] **Step 1: Create the WhaleChat component**

This component renders the whale mascot, speech bubble, and option buttons. It manages the state machine (current question, accumulated answers) and calls `onComplete` when the quiz finishes.

```tsx
// components/hackathon/gallery/WhaleChat.tsx
"use client";

import { useState, useCallback } from "react";
import GalleryMascot from "./GalleryMascot";
import { QUESTION_MAP, FIRST_QUESTION_ID, type QuizOption, type VisitorAnswers } from "@/lib/hackathon/gallery-match";
import { useLang } from "@/lib/hackathon/gallery-lang";

interface WhaleChatProps {
  onComplete: (answers: VisitorAnswers) => void;
  onExplore: () => void; // "Just exploring" -> go to gallery
}

type Phase = "asking" | "transitioning";

export default function WhaleChat({ onComplete, onExplore }: WhaleChatProps) {
  const { lang } = useLang();
  const [questionId, setQuestionId] = useState(FIRST_QUESTION_ID);
  const [phase, setPhase] = useState<Phase>("asking");
  const [who, setWho] = useState<string | null>(null);
  const [what, setWhat] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const question = QUESTION_MAP[questionId];

  const handleOption = useCallback((option: QuizOption) => {
    // Set tag based on which question we're on
    if (questionId === "q1_who") {
      if (!option.tag) {
        // "Just exploring" — no tag, go to gallery
        onExplore();
        return;
      }
      setWho(option.tag);
    } else if (option.tag && !option.tag.startsWith("area_")) {
      // Q3 options set the WHAT tag
      setWhat(option.tag);
    }

    if (option.next === null) {
      // Quiz done — transition to reveal
      setPhase("transitioning");
      const finalWhat = option.tag && !option.tag.startsWith("area_") ? option.tag : what;
      setTimeout(() => {
        onComplete({
          who: (questionId === "q1_who" ? option.tag : who) as any,
          what: finalWhat as any,
        });
      }, 600);
      return;
    }

    // Transition to next question
    setPhase("transitioning");
    setTimeout(() => {
      setQuestionId(option.next!);
      setStep((s) => s + 1);
      setPhase("asking");
    }, 400);
  }, [questionId, who, what, onComplete, onExplore]);

  if (!question) return null;

  const whaleText = lang === "th" ? question.whale_th : question.whale_en;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100dvh",
      padding: "2rem 1.25rem",
      gap: "1.5rem",
      opacity: phase === "transitioning" ? 0.5 : 1,
      transition: "opacity 300ms ease",
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i <= step
                ? "var(--bloom-accent, #619AD2)"
                : "var(--bloom-border-default, rgba(74,107,130,0.3))",
              transition: "background 300ms",
            }}
          />
        ))}
      </div>

      {/* Whale */}
      <div style={{ width: "120px", height: "120px", flexShrink: 0 }}>
        <GalleryMascot />
      </div>

      {/* Speech bubble */}
      <div style={{
        maxWidth: "520px",
        width: "100%",
        padding: "1.25rem 1.5rem",
        borderRadius: "20px",
        background: "var(--bloom-bg-surface, rgba(15,22,36,0.85))",
        border: "1px solid var(--bloom-border-default, rgba(74,107,130,0.25))",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1rem",
          lineHeight: 1.6,
          color: "var(--bloom-text-primary, #C0D8F0)",
          margin: 0,
          textAlign: "center",
        }}>
          {whaleText}
        </p>
      </div>

      {/* Options */}
      <div style={{
        maxWidth: "520px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        overflowY: "auto",
        flex: 1,
      }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt)}
            disabled={phase === "transitioning"}
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid var(--bloom-border-default, rgba(74,107,130,0.3))",
              background: "var(--bloom-bg-raised, rgba(10,15,22,0.6))",
              cursor: phase === "transitioning" ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 180ms",
              minHeight: "48px",
            }}
            onMouseEnter={(e) => {
              if (phase !== "transitioning") {
                e.currentTarget.style.borderColor = "rgba(97,154,210,0.5)";
                e.currentTarget.style.background = "rgba(97,154,210,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--bloom-border-default, rgba(74,107,130,0.3))";
              e.currentTarget.style.background = "var(--bloom-bg-raised, rgba(10,15,22,0.6))";
            }}
          >
            <span style={{
              fontFamily: "var(--font-bai-jamjuree), sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--bloom-text-primary, #C0D8F0)",
              display: "block",
            }}>
              {lang === "th" ? opt.th : opt.en}
            </span>
            {lang === "en" && (
              <span style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.75rem",
                color: "var(--bloom-text-muted, rgba(145,196,227,0.45))",
                display: "block",
                marginTop: "0.125rem",
              }}>
                {opt.th}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hackathon/gallery/WhaleChat.tsx
git commit -m "feat(gallery): add WhaleChat state machine UI component"
```

---

### Task 8: MatchReveal Component

**Files:**
- Create: `components/hackathon/gallery/MatchReveal.tsx`

- [ ] **Step 1: Create the MatchReveal component**

Shows the whale thinking animation, then reveals the matched product with personalized "why" text and secondary matches.

```tsx
// components/hackathon/gallery/MatchReveal.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import GalleryMascot from "./GalleryMascot";
import ProductCard from "./ProductCard";
import { useLang } from "@/lib/hackathon/gallery-lang";
import { composeWhyText, type ScoredProduct, type VisitorAnswers } from "@/lib/hackathon/gallery-match";

interface MatchRevealProps {
  answers: VisitorAnswers;
  results: ScoredProduct[];
  unmatched: ScoredProduct["product"][];
  onRetake: () => void;
}

type Phase = "thinking" | "revealing" | "revealed";

export default function MatchReveal({ answers, results, unmatched, onRetake }: MatchRevealProps) {
  const { lang } = useLang();
  const [phase, setPhase] = useState<Phase>("thinking");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("revealing"), 2000);
    const t2 = setTimeout(() => setPhase("revealed"), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const topMatch = results[0] ?? null;
  const secondaryMatches = results.slice(1, 4);

  const whyText = topMatch
    ? composeWhyText(
        answers.who,
        answers.what,
        lang === "th" && topMatch.product.product_name_th
          ? topMatch.product.product_name_th
          : topMatch.product.product_name,
        lang === "th" && topMatch.product.problem_statement_th
          ? topMatch.product.problem_statement_th
          : topMatch.product.problem_statement,
        lang
      )
    : null;

  // No match — fallback
  if (!topMatch) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        minHeight: "100dvh", padding: "3rem 1.25rem", gap: "1.5rem",
      }}>
        <div style={{ width: "120px", height: "120px" }}>
          <GalleryMascot />
        </div>
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1.125rem", color: "var(--bloom-text-primary)",
          textAlign: "center", maxWidth: "400px",
        }}>
          {lang === "th"
            ? "คุณสนใจหลายเรื่องเลย! ลองดูผลงานทั้งหมดได้เลย"
            : "You're interested in everything! Go explore all the products."}
        </p>
        <a
          href="/hackathon/gallery"
          className="bloom-button"
          style={{ fontSize: "0.9375rem" }}
        >
          <span className="bloom-button__grain" aria-hidden="true" />
          {lang === "th" ? "ดูผลงานทั้งหมด" : "Browse all products"}
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      minHeight: "100dvh", padding: "2rem 1.25rem 4rem", gap: "1.5rem",
    }}>
      {/* Whale */}
      <div style={{
        width: "120px", height: "120px", flexShrink: 0,
        animation: phase === "thinking" ? "galleryMascotBob 1.5s ease-in-out infinite" : undefined,
      }}>
        <GalleryMascot />
      </div>

      {/* Thinking state */}
      {phase === "thinking" && (
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1rem", color: "var(--bloom-text-muted)",
          textAlign: "center",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          {lang === "th" ? "กำลังหาสิ่งที่เหมาะกับคุณ..." : "Finding your perfect match..."}
        </p>
      )}

      {/* Reveal */}
      {(phase === "revealing" || phase === "revealed") && (
        <div style={{
          maxWidth: "560px", width: "100%",
          opacity: phase === "revealed" ? 1 : 0,
          transform: phase === "revealed" ? "translateY(0)" : "translateY(20px)",
          transition: "all 600ms cubic-bezier(0.05, 0.7, 0.35, 0.99)",
          display: "flex", flexDirection: "column", gap: "1.5rem",
        }}>
          {/* "Built for you" badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <Sparkles size={16} style={{ color: "var(--bloom-accent, #619AD2)" }} />
            <span style={{
              fontFamily: "var(--font-kodchasan), sans-serif",
              fontSize: "0.875rem", fontWeight: 700,
              color: "var(--bloom-accent, #619AD2)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {lang === "th" ? "สร้างมาเพื่อคุณ" : "Built for you"}
            </span>
            <Sparkles size={16} style={{ color: "var(--bloom-accent, #619AD2)" }} />
          </div>

          {/* Top match product card */}
          <div style={{
            borderRadius: "20px",
            border: "2px solid var(--bloom-accent-border, rgba(97,154,210,0.35))",
            boxShadow: "0 0 40px rgba(97,154,210,0.15), 0 8px 32px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}>
            <ProductCard product={{
              ...topMatch.product,
              product_name_th: topMatch.product.product_name_th ?? undefined,
              problem_statement_th: topMatch.product.problem_statement_th ?? undefined,
            } as any} />
          </div>

          {/* Why text */}
          {whyText && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "16px",
              background: "var(--bloom-bg-surface, rgba(15,22,36,0.85))",
              border: "1px solid var(--bloom-border-default)",
            }}>
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.9375rem", lineHeight: 1.6,
                color: "var(--bloom-text-secondary)",
                margin: 0, textAlign: "center",
              }}>
                {whyText}
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`/hackathon/gallery/${topMatch.product.team_id}`}
              className="bloom-button"
              style={{ fontSize: "0.9375rem", textDecoration: "none" }}
            >
              <span className="bloom-button__grain" aria-hidden="true" />
              {lang === "th" ? "ดูรายละเอียด" : "Learn more"}
            </a>
            <button
              onClick={onRetake}
              className="bloom-button bloom-button--ghost"
              style={{ fontSize: "0.875rem" }}
            >
              {lang === "th" ? "ลองใหม่" : "Try again"}
            </button>
          </div>

          {/* Secondary matches */}
          {secondaryMatches.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.8125rem", fontWeight: 700,
                color: "var(--bloom-text-muted)",
                letterSpacing: "0.04em", textTransform: "uppercase",
                marginBottom: "0.75rem", textAlign: "center",
              }}>
                {lang === "th" ? "คุณอาจสนใจ" : "You might also like"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {secondaryMatches.map((m) => (
                  <a
                    key={m.product.id}
                    href={`/hackathon/gallery/${m.product.team_id}`}
                    style={{
                      display: "block", textDecoration: "none",
                      padding: "0.875rem 1rem", borderRadius: "12px",
                      border: "1px solid var(--bloom-border-default)",
                      background: "var(--bloom-bg-raised)",
                      transition: "border-color 180ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(97,154,210,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bloom-border-default)"; }}
                  >
                    <span style={{
                      fontFamily: "var(--font-kodchasan), sans-serif",
                      fontSize: "0.9375rem", fontWeight: 700,
                      color: "var(--bloom-text-primary)",
                      display: "block",
                    }}>
                      {lang === "th" && m.product.product_name_th ? m.product.product_name_th : m.product.product_name}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-bai-jamjuree), sans-serif",
                      fontSize: "0.8125rem",
                      color: "var(--bloom-text-muted)",
                      display: "block", marginTop: "0.25rem",
                    }}>
                      {m.product.team_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* More to explore */}
          {unmatched.length > 0 && (
            <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
              <a
                href="/hackathon/gallery"
                style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.8125rem", color: "var(--bloom-text-muted)",
                  textDecoration: "underline", textUnderlineOffset: "3px",
                }}
              >
                {lang === "th" ? `ดูผลงานอื่นอีก ${unmatched.length} ผลงาน` : `Explore ${unmatched.length} more products`}
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hackathon/gallery/MatchReveal.tsx
git commit -m "feat(gallery): add MatchReveal component with thinking + dramatic reveal"
```

---

### Task 9: Match Page — Orchestrator

**Files:**
- Create: `app/hackathon/gallery/match/page.tsx`

- [ ] **Step 1: Create the match page**

This is a server component that fetches products, wraps them in the client-side `MatchFlow` which orchestrates WhaleChat -> scoring -> MatchReveal.

```tsx
// app/hackathon/gallery/match/page.tsx
import { Metadata } from "next";
import { getGalleryProducts } from "@/lib/hackathon/gallery";
import { PLACEHOLDER_PRODUCTS } from "@/lib/hackathon/gallery-placeholders";
import MatchFlow from "./MatchFlow";

export const metadata: Metadata = {
  title: "Find Your Match | PassionSeed Hackathon",
  description: "Let our whale mascot help you find the perfect health product from the hackathon.",
};

export const revalidate = 60;

export default async function MatchPage() {
  let products = await getGalleryProducts();

  if (products.length === 0) {
    products = PLACEHOLDER_PRODUCTS.map((p) => ({
      ...p,
      interest_count: Math.floor(Math.random() * 30),
      match_count: 0,
      target_personas: null,
    }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bloom-bg)" }}>
      <MatchFlow products={products} />
    </div>
  );
}
```

- [ ] **Step 2: Create the client-side MatchFlow component**

```tsx
// app/hackathon/gallery/match/MatchFlow.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WhaleChat from "@/components/hackathon/gallery/WhaleChat";
import MatchReveal from "@/components/hackathon/gallery/MatchReveal";
import LangToggle from "@/components/hackathon/gallery/LangToggle";
import ThemeToggle from "@/components/hackathon/gallery/ThemeToggle";
import { scoreProducts, type VisitorAnswers, type ScoredProduct } from "@/lib/hackathon/gallery-match";
import type { GalleryProductSummary } from "@/lib/hackathon/gallery";

interface MatchFlowProps {
  products: GalleryProductSummary[];
}

type Stage = "quiz" | "reveal";

function getSessionId(): string {
  const KEY = "gallery-match-session";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function MatchFlow({ products }: MatchFlowProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("quiz");
  const [answers, setAnswers] = useState<VisitorAnswers>({ who: null, what: null });
  const [results, setResults] = useState<ScoredProduct[]>([]);
  const [unmatched, setUnmatched] = useState<ScoredProduct["product"][]>([]);

  const handleComplete = useCallback((ans: VisitorAnswers) => {
    setAnswers(ans);

    const scored = scoreProducts(ans, products as any);
    setResults(scored);

    // Products without target_personas or scoring 0 = unmatched
    const matchedIds = new Set(scored.map((s) => s.product.id));
    const notMatched = (products as any[]).filter((p: any) => !matchedIds.has(p.id));
    setUnmatched(notMatched);

    // Record top match (fire-and-forget)
    if (scored.length > 0) {
      const sessionId = getSessionId();
      fetch("/api/hackathon/gallery/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: scored[0].product.id,
          session_id: sessionId,
          match_score: scored[0].score,
          answers: ans,
        }),
      }).catch(() => {}); // fire-and-forget
    }

    setStage("reveal");
  }, [products]);

  const handleExplore = useCallback(() => {
    router.push("/hackathon/gallery");
  }, [router]);

  const handleRetake = useCallback(() => {
    setStage("quiz");
    setAnswers({ who: null, what: null });
    setResults([]);
    setUnmatched([]);
  }, []);

  return (
    <>
      {/* Nav bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(1.25rem, 5vw, 3rem)", height: "56px",
        background: "rgba(8,12,18,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--bloom-border-subtle)",
      }}>
        <a
          href="/hackathon/gallery"
          style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "0.875rem", fontWeight: 600,
            color: "var(--bloom-text-muted)", textDecoration: "none",
          }}
        >
          &larr; Gallery
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LangToggle />
          <ThemeToggle />
        </div>
      </nav>

      {stage === "quiz" && (
        <WhaleChat onComplete={handleComplete} onExplore={handleExplore} />
      )}

      {stage === "reveal" && (
        <MatchReveal
          answers={answers}
          results={results}
          unmatched={unmatched}
          onRetake={handleRetake}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/hackathon/gallery/match/page.tsx app/hackathon/gallery/match/MatchFlow.tsx
git commit -m "feat(gallery): add match page with quiz -> scoring -> reveal flow"
```

---

### Task 10: Gallery CTA — "Find Your Match" Button

**Files:**
- Modify: `app/hackathon/gallery/page.tsx`

- [ ] **Step 1: Add a CTA link to the gallery hero section**

In `app/hackathon/gallery/page.tsx`, after the hero `<p>` tag (around line 118), add:

```tsx
          <a
            href="/hackathon/gallery/match"
            className="bloom-button"
            style={{
              marginTop: "1.25rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            <span className="bloom-button__grain" aria-hidden="true" />
            {/* Whale emoji as inline hint */}
            <span aria-hidden="true">🐋</span>
            Not sure which product is for you?
          </a>
```

- [ ] **Step 2: Commit**

```bash
git add app/hackathon/gallery/page.tsx
git commit -m "feat(gallery): add whale matcher CTA to gallery hero"
```

---

### Task 11: Show Match Count on Submit Page

**Files:**
- Modify: `app/hackathon/gallery/submit/page.tsx`

- [ ] **Step 1: Display match_count in the success/status area**

In the submit page, after the success banner (around line 250), add a match count display when `existingProduct?.match_count > 0`:

```tsx
{existingProduct?.match_count > 0 && (
  <div style={{
    marginBottom: "2rem", padding: "1rem 1.25rem",
    background: "rgba(97,154,210,0.06)", border: "1px solid rgba(97,154,210,0.18)",
    borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.75rem",
  }}>
    <span style={{ fontSize: "1.5rem" }}>🐋</span>
    <p style={{
      fontFamily: "var(--font-bai-jamjuree), sans-serif",
      fontSize: "0.9375rem", color: "rgba(145,196,227,0.8)", margin: 0,
    }}>
      <strong style={{ color: "#91C4E3" }}>{existingProduct.match_count}</strong>{" "}
      {existingProduct.match_count === 1 ? "person has" : "people have"} been matched to your product by the whale!
    </p>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/hackathon/gallery/submit/page.tsx
git commit -m "feat(gallery): show whale match count on submit page"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Build check**

Run: `pnpm build 2>&1 | tail -30`
Expected: Build completes with no errors.

- [ ] **Step 2: Manual smoke test**

Run: `pnpm dev`

Test flow:
1. Visit `/hackathon/gallery` — verify "Not sure which product is for you?" CTA appears in hero
2. Click CTA -> lands on `/hackathon/gallery/match`
3. Answer Q1 (pick a WHO) -> Q2 (pick an AREA) -> Q3 (pick a WHAT)
4. Whale thinking animation plays for ~2 seconds
5. Product reveals with personalized "why" text
6. "Learn more" links to product detail page
7. "Try again" restarts the quiz
8. Visit `/hackathon/gallery/submit` -> verify WHO/WHAT tag pickers appear
9. Submit with tags selected -> verify target_personas saved
10. Language toggle works throughout (EN/TH)

- [ ] **Step 3: Commit all remaining changes if any**

```bash
git add -A
git commit -m "feat(gallery): whale product matcher — complete implementation"
```
