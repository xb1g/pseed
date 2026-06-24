-- Career Radar: Explore feed (tiles) + swipe carousels (cards), research-driven.
-- Public read (anon + authenticated); writes via service role only.
-- See docs/CAREER_RADAR_SCHEMA.md + docs/CAREER_RADAR_RESEARCH_BRIEF.md.

-- ── collections (filter chips) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_collections (
  key        text PRIMARY KEY,
  label_th   text NOT NULL,
  label_en   text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);

-- ── fields (career tile + carousel container) ────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_fields (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  name_th      text NOT NULL,
  name_en      text NOT NULL,
  tagline_th   text NOT NULL,
  tagline_en   text NOT NULL,
  emoji        text NOT NULL DEFAULT '✨',
  color        text NOT NULL,
  tile_size    text NOT NULL DEFAULT 'md' CHECK (tile_size IN ('sm','md','lg')),
  tags         text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  has_content  boolean NOT NULL DEFAULT false,
  sort_order   int NOT NULL DEFAULT 0,
  squad_url    text,
  -- hero image
  hero_image_url     text,
  hero_image_prompt  text,
  hero_image_credit  text,
  hero_image_license text,
  hero_image_alt_th  text,
  hero_image_alt_en  text,
  -- research archive
  research       jsonb,
  researched_at  timestamptz,
  research_model text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS radar_fields_published_idx ON radar_fields (is_published, sort_order);

-- ── sources (citable, per-field ref numbers) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_sources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id     uuid NOT NULL REFERENCES radar_fields(id) ON DELETE CASCADE,
  ref          int  NOT NULL,
  title        text NOT NULL,
  publisher    text,
  url          text NOT NULL,
  published_at date,
  accessed_at  date NOT NULL DEFAULT now(),
  tier         text CHECK (tier IN ('primary','secondary','tertiary')),
  quote_th     text,
  quote_en     text,
  UNIQUE (field_id, ref)
);

-- ── cards (carousel slides) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_cards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id   uuid NOT NULL REFERENCES radar_fields(id) ON DELETE CASCADE,
  position   int  NOT NULL,
  kind       text NOT NULL CHECK (kind IN
               ('hook','fantasyReality','text','jobs','list','cta',
                'dayInLife','salaryProgression','aiImpact','marketThailand',
                'entryRoutes','risks','realPeople','sources')),
  content_th jsonb NOT NULL,
  content_en jsonb,
  image_url     text,
  image_prompt  text,
  image_credit  text,
  image_license text,
  image_alt_th  text,
  image_alt_en  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, position)
);
CREATE INDEX IF NOT EXISTS radar_cards_field_idx ON radar_cards (field_id, position);

-- ── updated_at triggers (self-contained; safe if touch_updated_at already exists) ─
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS radar_fields_updated_at ON radar_fields;
CREATE TRIGGER radar_fields_updated_at BEFORE UPDATE ON radar_fields
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS radar_cards_updated_at ON radar_cards;
CREATE TRIGGER radar_cards_updated_at BEFORE UPDATE ON radar_cards
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── RLS: public read, no client write ────────────────────────────────────────
ALTER TABLE radar_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_fields      ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_cards       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read active collections" ON radar_collections;
CREATE POLICY "read active collections" ON radar_collections
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Tiles show even before content is ready; carousel gates on has_content.
DROP POLICY IF EXISTS "read published fields" ON radar_fields;
CREATE POLICY "read published fields" ON radar_fields
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "read cards of published fields" ON radar_cards;
CREATE POLICY "read cards of published fields" ON radar_cards
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM radar_fields f
            WHERE f.id = radar_cards.field_id AND f.is_published = true)
  );

DROP POLICY IF EXISTS "read sources of published fields" ON radar_sources;
CREATE POLICY "read sources of published fields" ON radar_sources
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM radar_fields f
            WHERE f.id = radar_sources.field_id AND f.is_published = true)
  );

-- ── seed collections ─────────────────────────────────────────────────────────
INSERT INTO radar_collections (key,label_th,label_en,sort_order) VALUES
  ('all',      'ทั้งหมด',         'All',        0),
  ('high-pay', '💰 รายได้ดี',     '💰 High pay', 1),
  ('ai-proof', '🤖 รอดยุค AI',    '🤖 AI-proof', 2),
  ('trending', '🔥 มาแรง',        '🔥 Trending', 3),
  ('creative', '🎨 สายครีเอทีฟ',  '🎨 Creative', 4),
  ('global',   '🌏 ทำงานทั่วโลก', '🌏 Global',   5)
ON CONFLICT (key) DO UPDATE SET
  label_th = EXCLUDED.label_th, label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order;
