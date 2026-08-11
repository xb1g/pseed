-- One tile per territory on the Radar grid, not one tile per profession.
--
-- The previous migration published nine business professions, which made them
-- nine peer tiles on /radar. That breaks the territory: the reveal is the whole
-- payload and a tile cannot carry it, and the composite closer (ผู้ก่อตั้ง)
-- became reachable before the eight jobs it is made of.
--
-- Professions stay published — the territory page and the RLS policies on
-- radar_field_skills / radar_skill_jobs both require it — but the grid now
-- filters them out by `research->'territory'` and shows this index row instead.
--
-- NOTE: this row deliberately does NOT carry the territory key in tags[].
-- loadTerritory() selects professions with `tags @> {key}`, so tagging the
-- index would list the territory as a member of itself.
--
-- Seeded is_published = false, together with the professions this migration
-- also unpublishes. Production currently runs code with no territory renderer,
-- so ANY business tile — including this correct one — would dead-end on a
-- cardless page. Flip the whole territory on in one statement once the code
-- that renders it is deployed:
--
--   UPDATE radar_fields SET is_published = true
--   WHERE slug = 'business-how-money-works'
--      OR tags @> ARRAY['business-how-money-works'];

INSERT INTO radar_fields (
  slug, name_th, name_en, tagline_th, tagline_en, emoji, color,
  tile_size, tags, is_published, has_content, sort_order, research
)
VALUES (
  'business-how-money-works',
  'ธุรกิจทำเงินยังไง',
  'How Business Makes Money',
  'แปดงานที่ทำให้ธุรกิจเดินได้ ส่วนใหญ่ไม่เคยมีใครเล่าให้ฟัง',
  'Eight jobs that keep a business alive. You have heard of almost none of them.',
  '💸',
  '#f59e0b',
  'lg',
  ARRAY['business'],
  false,
  true,
  100,
  jsonb_build_object(
    'territory',
    jsonb_build_object(
      'collection', 'business-how-money-works',
      'is_index', true,
      'reveal_th', 'แปดงานที่ทำให้ธุรกิจเดินได้ ส่วนใหญ่ไม่เคยมีใครเล่าให้ฟัง'
    )
  )
)
ON CONFLICT (slug) DO UPDATE
  SET name_th     = excluded.name_th,
      name_en     = excluded.name_en,
      tagline_th  = excluded.tagline_th,
      tagline_en  = excluded.tagline_en,
      emoji       = excluded.emoji,
      color       = excluded.color,
      tile_size   = excluded.tile_size,
      tags        = excluded.tags,
      is_published = excluded.is_published,
      has_content = excluded.has_content,
      sort_order  = excluded.sort_order,
      research    = COALESCE(radar_fields.research, '{}'::jsonb) || excluded.research;

-- Take the nine professions off the live grid until the deck that renders them
-- exists in production. They stay as rows, with every skill link and hop
-- intact; only their visibility changes.
UPDATE radar_fields
SET is_published = false
WHERE tags @> ARRAY['business-how-money-works'];
