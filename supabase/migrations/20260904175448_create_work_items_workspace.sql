-- Internal operating workspace for marketing content and product bets.
-- The table is exposed through the Data API only to authenticated PassionSeed staff.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL CHECK (area IN ('marketing', 'product', 'program', 'research')),
  kind text NOT NULL CHECK (kind IN ('content', 'bet', 'task', 'experiment', 'evidence')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  status text NOT NULL CHECK (
    status IN ('idea', 'draft', 'ready', 'published', 'decide', 'validate', 'build', 'learn', 'done', 'archived')
  ),
  funnel_stage text CHECK (funnel_stage IS NULL OR funnel_stage IN ('tofu', 'mofu', 'bofu')),
  channel text CHECK (channel IS NULL OR channel IN ('instagram', 'facebook', 'both')),
  offer text CHECK (offer IS NULL OR offer IN ('techseed', 'shift', 'both')),
  owner_name text NOT NULL DEFAULT 'Unassigned' CHECK (char_length(owner_name) BETWEEN 1 AND 80),
  due_on date,
  position integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_items_area_kind_check CHECK (
    (area = 'marketing' AND kind = 'content' AND funnel_stage IS NOT NULL AND channel IS NOT NULL AND offer IS NOT NULL)
    OR (area = 'product' AND kind = 'bet')
    OR (area IN ('program', 'research'))
  ),
  CONSTRAINT work_items_area_status_check CHECK (
    (area = 'marketing' AND status IN ('idea', 'draft', 'ready', 'published', 'archived'))
    OR (area = 'product' AND status IN ('decide', 'validate', 'build', 'learn', 'done', 'archived'))
    OR (area IN ('program', 'research'))
  )
);

CREATE INDEX IF NOT EXISTS work_items_area_position_idx
  ON public.work_items (area, position, created_at);

CREATE INDEX IF NOT EXISTS work_items_area_status_idx
  ON public.work_items (area, status)
  WHERE status <> 'archived';

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.work_items FROM PUBLIC;
REVOKE ALL ON TABLE public.work_items FROM anon;
REVOKE ALL ON TABLE public.work_items FROM authenticated;
GRANT SELECT ON TABLE public.work_items TO authenticated;
GRANT INSERT (
  area, kind, title, description, status, funnel_stage, channel, offer,
  owner_name, due_on, position, details, created_by
) ON public.work_items TO authenticated;
GRANT UPDATE (
  title, description, status, funnel_stage, channel, offer,
  owner_name, due_on, position, details
) ON public.work_items TO authenticated;

DROP POLICY IF EXISTS "PassionSeed staff can read work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can read work items"
  ON public.work_items
  FOR SELECT
  TO authenticated
  USING ((SELECT public.pseed_is_admin()));

DROP POLICY IF EXISTS "PassionSeed staff can create work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can create work items"
  ON public.work_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.pseed_is_admin())
    AND created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "PassionSeed staff can update work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can update work items"
  ON public.work_items
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.pseed_is_admin()))
  WITH CHECK ((SELECT public.pseed_is_admin()));

CREATE OR REPLACE FUNCTION private.set_work_item_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.set_work_item_updated_at() FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_work_item_updated_at'
      AND tgrelid = 'public.work_items'::regclass
  ) THEN
    CREATE TRIGGER set_work_item_updated_at
      BEFORE UPDATE ON public.work_items
      FOR EACH ROW
      EXECUTE FUNCTION private.set_work_item_updated_at();
  END IF;
END;
$$;

INSERT INTO public.work_items (
  id, area, kind, title, description, status, funnel_stage, channel, offer,
  owner_name, due_on, position, details
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'marketing', 'content', 'Portfolio Tier List: วิศวะ', 'โครงงานส่งครู เว็บ Clone และค่ายมีใบเซอร์ อะไรหนักกว่ากัน?', 'ready', 'tofu', 'instagram', 'both', 'Content', NULL, 10, '{"format":"Reel · 35 sec","cta":"Comment PORT"}'),
  ('10000000-0000-4000-8000-000000000002', 'marketing', 'content', 'กรรมการถามต่อ', 'ถ้าบอกว่าทำแอป แต่ตอบ 3 คำถามนี้ไม่ได้ งานยังไม่ใช่ proof of work', 'idea', 'tofu', 'instagram', 'shift', 'Content', NULL, 20, '{"format":"Reel · role play","cta":"Save + share"}'),
  ('10000000-0000-4000-8000-000000000003', 'marketing', 'content', 'ก่อนจ่ายค่าค่ายให้ลูก', 'ผู้ปกครองควรเช็ก 5 อย่าง ก่อนจ่ายค่าค่ายเพื่อใส่ Portfolio', 'draft', 'tofu', 'facebook', 'both', 'Content', NULL, 30, '{"format":"Long post","cta":"Save checklist"}'),
  ('10000000-0000-4000-8000-000000000004', 'marketing', 'content', '4 Project Red Flags', 'ทุกอย่างสำเร็จตั้งแต่ครั้งแรก อาจทำให้กรรมการเชื่อน้อยลง', 'idea', 'tofu', 'both', 'shift', 'Content', NULL, 40, '{"format":"Carousel · 6 slides","cta":"Comment PORT"}'),
  ('10000000-0000-4000-8000-000000000005', 'marketing', 'content', 'หนึ่งไอเดีย สามระดับ', 'เปลี่ยนงานส่งครู ให้กลายเป็น prototype ที่มี user data ได้อย่างไร', 'ready', 'mofu', 'both', 'shift', 'Content', NULL, 50, '{"format":"Carousel · teardown","cta":"Get rubric"}'),
  ('10000000-0000-4000-8000-000000000006', 'marketing', 'content', 'SHIFT build diary', 'Day 3 ไม่มีใครใช้ของที่เราสร้าง แล้วทีมทำอะไรต่อ?', 'draft', 'mofu', 'instagram', 'shift', 'Content', NULL, 60, '{"format":"Reel series · 4 parts","cta":"Follow the build"}'),
  ('10000000-0000-4000-8000-000000000007', 'marketing', 'content', 'TechSeed alumni trail', 'ก่อนเข้า สิ่งที่ลอง สิ่งที่สร้าง และสิ่งที่น้องกลับไปทำต่อเอง', 'idea', 'mofu', 'both', 'techseed', 'Content', NULL, 70, '{"format":"Case study","cta":"See student work"}'),
  ('10000000-0000-4000-8000-000000000008', 'marketing', 'content', 'Mentor ไม่ได้ทำแทน', 'หนึ่งคำถามจาก Mentor ที่ทำให้น้องตัดฟีเจอร์ออก 80%', 'idea', 'mofu', 'instagram', 'both', 'Content', NULL, 80, '{"format":"Screen + voiceover","cta":"Submit an idea"}'),
  ('10000000-0000-4000-8000-000000000009', 'marketing', 'content', 'TechSeed หรือ SHIFT', 'เลือกจากจุดที่น้องอยู่ตอนนี้ ไม่ใช่จากโปรแกรมที่แพงกว่า', 'ready', 'bofu', 'both', 'both', 'Growth', NULL, 90, '{"format":"Carousel · chooser","cta":"Take the 30-sec fit check"}'),
  ('10000000-0000-4000-8000-000000000010', 'marketing', 'content', 'เริ่ม Tech จากศูนย์ได้ไหม', 'ถ้ายังเลือก AI, Cybersecurity หรือ Software ไม่ได้ TechSeed เริ่มตรงนี้', 'draft', 'bofu', 'instagram', 'techseed', 'Growth', NULL, 100, '{"format":"FAQ Reel","cta":"Apply TechSeed"}'),
  ('10000000-0000-4000-8000-000000000011', 'marketing', 'content', 'ถ้าโปรเจกต์พังล่ะ?', 'SHIFT ไม่รับประกันว่าไอเดียจะเวิร์ก แต่รับประกันว่าจะมีหลักฐานให้ตัดสินใจต่อ', 'idea', 'bofu', 'both', 'shift', 'Founder', NULL, 110, '{"format":"Founder video","cta":"Apply SHIFT"}'),
  ('10000000-0000-4000-8000-000000000012', 'marketing', 'content', 'Forward to parent', 'หนึ่งหน้าที่บอกผู้ปกครองว่าได้อะไร ใช้เวลาเท่าไร และดูแลกันอย่างไร', 'draft', 'bofu', 'facebook', 'both', 'Growth', NULL, 120, '{"format":"Shareable one-pager","cta":"Send parent pack"}'),
  ('20000000-0000-4000-8000-000000000001', 'product', 'bet', 'Make the TechSeed → SHIFT ladder legible', 'The current public prices invert the intended commitment ladder.', 'decide', NULL, NULL, NULL, 'Founder', NULL, 10, '{"nextMove":"Choose the real price, audience, and entry rule before BOFU traffic starts.","decision":"Pricing and positioning"}'),
  ('20000000-0000-4000-8000-000000000002', 'product', 'bet', 'Forward-to-parent sales packet', 'High-intent students stall when they need to explain the purchase at home.', 'build', NULL, NULL, NULL, 'Growth', NULL, 20, '{"nextMove":"Test one shareable page in five active sales conversations.","decision":"Does it increase priced conversations?"}'),
  ('20000000-0000-4000-8000-000000000003', 'product', 'bet', 'Route PORT comments by readiness', 'The portfolio tier-list format already creates high-volume comment intent.', 'validate', NULL, NULL, NULL, 'Marketing', NULL, 30, '{"nextMove":"Ask grade, target field, and current project state before sending an offer.","decision":"TechSeed, SHIFT, or free help"}'),
  ('20000000-0000-4000-8000-000000000004', 'product', 'bet', 'Turn every cohort into reusable proof', 'Student work and pivot moments are stronger than generic testimonials.', 'learn', NULL, NULL, NULL, 'Program', NULL, 40, '{"nextMove":"Capture consented before, failure, decision, and after evidence during delivery.","decision":"Which evidence predicts the next sale?"}')
ON CONFLICT (id) DO NOTHING;
