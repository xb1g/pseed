-- Seed reflection checkpoints into the live carousels (radar_cards) for every
-- published field, at chapter boundaries. Idempotent: re-running re-derives
-- positions and replaces the reflection rows.
--
-- Chapters: [intro] → what-it-is(rating) → [money/jobs] → money-jobs(chips)
--           → [you in it] → you-in-it(chips+text) → cta.
-- Reflection content is generic enough to reuse across all fields.

DO $$
DECLARE
  f        record;
  a_intro  int;
  a_money  int;
  p_cta    int;
  c_what   jsonb := '{"eyebrow":"เช็กใจตัวเอง","title":"อยากลองทางนี้แค่ไหน?","chapterKey":"what-it-is","rating":true}'::jsonb;
  c_what_en jsonb := '{"eyebrow":"Quick gut-check","title":"How much do you want to try this?","chapterKey":"what-it-is","rating":true}'::jsonb;
  c_money  jsonb := '{"eyebrow":"อะไรที่ถูกใจ","title":"อะไรที่ดึงดูดเธอในทางนี้?","chapterKey":"money-jobs","chips":["เงินดี","ดูสนุก","ท้าทาย","อิสระ","ได้ช่วยคน","มาแรง"],"allowText":true}'::jsonb;
  c_money_en jsonb := '{"eyebrow":"What pulls you","title":"What attracts you here?","chapterKey":"money-jobs","chips":["Good pay","Looks fun","Challenging","Freedom","Helps people","Trending"],"allowText":true}'::jsonb;
  c_you    jsonb := '{"eyebrow":"ก่อนไปต่อ","title":"ทำไมเธอถึงสนใจทางนี้?","chapterKey":"you-in-it","chips":["ตรงกับตัวฉัน","อยากเก่งด้านนี้","อนาคตดี","ยังไม่แน่ใจ"],"allowText":true,"placeholder":"เขียนสั้นๆ ก็ได้..."}'::jsonb;
  c_you_en jsonb := '{"eyebrow":"Before you go on","title":"Why does this interest you?","chapterKey":"you-in-it","chips":["Fits me","Want to master it","Good future","Not sure yet"],"allowText":true,"placeholder":"A sentence is fine..."}'::jsonb;
BEGIN
  FOR f IN SELECT id, slug FROM radar_fields WHERE is_published LOOP
    -- 1. drop prior reflection rows for a clean re-seed
    DELETE FROM radar_cards WHERE field_id = f.id AND kind = 'reflection';

    -- 2. renumber remaining cards to a contiguous *10 scale to open insert gaps.
    -- Offset first so the new values can't collide with not-yet-updated old ones
    -- (UNIQUE(field_id,position) is checked per row, not deferred).
    UPDATE radar_cards SET position = position + 1000 WHERE field_id = f.id;
    WITH ord AS (
      SELECT id, (row_number() OVER (ORDER BY position) - 1) * 10 AS rn
      FROM radar_cards WHERE field_id = f.id
    )
    UPDATE radar_cards c SET position = ord.rn FROM ord WHERE c.id = ord.id;

    -- 3. find anchors. Intro reflection goes after the explainer ('text'),
    -- falling back to fantasyReality, then hook — never right after the hook
    -- when a real explainer exists.
    SELECT min(position) INTO a_intro FROM radar_cards
      WHERE field_id = f.id AND kind = 'text';
    IF a_intro IS NULL THEN
      SELECT min(position) INTO a_intro FROM radar_cards
        WHERE field_id = f.id AND kind IN ('fantasyReality','hook');
    END IF;
    SELECT min(position) INTO a_money FROM radar_cards
      WHERE field_id = f.id AND kind IN ('jobs','salaryProgression','marketThailand');
    SELECT min(position) INTO p_cta FROM radar_cards
      WHERE field_id = f.id AND kind = 'cta';

    -- 4. insert reflections in the gaps (skip an anchor if absent)
    IF a_intro IS NOT NULL THEN
      INSERT INTO radar_cards (field_id, position, kind, content_th, content_en)
      VALUES (f.id, a_intro + 5, 'reflection', c_what, c_what_en);
    END IF;
    IF a_money IS NOT NULL THEN
      INSERT INTO radar_cards (field_id, position, kind, content_th, content_en)
      VALUES (f.id, a_money + 5, 'reflection', c_money, c_money_en);
    END IF;
    IF p_cta IS NOT NULL THEN
      INSERT INTO radar_cards (field_id, position, kind, content_th, content_en)
      VALUES (f.id, p_cta - 5, 'reflection', c_you, c_you_en);
    END IF;
  END LOOP;
END $$;
