-- Deno owns long-running Meta and opportunity-source work. Supabase remains
-- the system of record; Vercel is not part of either background path.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.meta_backfill_state (
  source text NOT NULL CHECK (source IN ('instagram_conversation', 'instagram_media')),
  external_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error_code text,
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, external_id)
);

CREATE INDEX IF NOT EXISTS meta_backfill_state_retry_idx
  ON public.meta_backfill_state (source, status, updated_at)
  WHERE status <> 'completed';

ALTER TABLE public.meta_backfill_state ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS source_platform text,
  ADD COLUMN IF NOT EXISTS source_external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS competitions_source_identity_idx
  ON public.competitions (source_platform, source_external_id);

CREATE TABLE IF NOT EXISTS public.competition_source_items (
  source text NOT NULL CHECK (source IN ('contester', 'devpost')),
  external_id text NOT NULL,
  title text NOT NULL,
  source_url text NOT NULL,
  organizer_url text,
  opportunity_type text,
  categories text[] NOT NULL DEFAULT '{}',
  educational_levels text[] NOT NULL DEFAULT '{}',
  opens_at timestamptz,
  deadline timestamptz,
  eligible_for_high_school boolean NOT NULL DEFAULT false,
  is_open boolean NOT NULL DEFAULT false,
  source_checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, external_id)
);

CREATE INDEX IF NOT EXISTS competition_source_items_open_high_school_idx
  ON public.competition_source_items (deadline)
  WHERE is_open AND eligible_for_high_school;

ALTER TABLE public.competition_source_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.competition_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  review_type text NOT NULL CHECK (review_type IN ('expired', 'annual_refresh', 'stale_source')),
  title text NOT NULL,
  details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS competition_review_queue_pending_idx
  ON public.competition_review_queue (due_at)
  WHERE status = 'pending';

ALTER TABLE public.competition_review_queue ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.expire_past_competitions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expired_count integer;
BEGIN
  INSERT INTO public.competition_review_queue (
    competition_id,
    review_type,
    title,
    details,
    status,
    due_at,
    created_at
  )
  SELECT
    c.id,
    'expired',
    '🔁 Re-verify: ' || c.name_th,
    'Competition expired (deadline was ' || c.deadline::text || '). recurrence_pattern: ' ||
      COALESCE(c.recurrence_pattern, 'unknown') || '. Source: ' ||
      COALESCE(c.url, c.contester_url, '?') ||
      '. Update dates for the next cycle and set source_checked_at = now().',
    'pending',
    now(),
    now()
  FROM public.competitions c
  WHERE c.deadline < current_date
    AND c.is_active
    AND c.recurrence_pattern IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.competition_review_queue q
      WHERE q.competition_id = c.id
        AND q.review_type = 'expired'
        AND q.created_at > now() - interval '300 days'
    );

  UPDATE public.competitions
  SET is_active = false, updated_at = now()
  WHERE deadline < current_date AND is_active;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION private.expire_past_competitions() FROM PUBLIC;

SELECT cron.schedule(
  'expire-past-competitions',
  '7 2 * * *',
  'SELECT private.expire_past_competitions();'
);

SELECT cron.schedule(
  'competitions-annual-refresh',
  '0 8 1 9 *',
  $$
    INSERT INTO public.competition_review_queue (
      review_type, title, details, status, due_at, created_at
    )
    SELECT
      'annual_refresh',
      '📋 Annual: refresh competition dates for new academic year',
      'Check official organizers plus Contester and Devpost. Update dates and set source_checked_at after confirming eligibility.',
      'pending',
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.competition_review_queue
      WHERE review_type = 'annual_refresh'
        AND created_at > now() - interval '300 days'
    );
  $$
);

-- Correct known Contester provenance. Organizer URL stays NULL when the API
-- does not publish one; the exact listing belongs in contester_url.
UPDATE public.competitions
SET
  source_platform = 'contester',
  source_external_id = '9979',
  contester_url = 'https://contester.life/contest/unihack2026',
  source_checked_at = now(),
  verified_by = 'contester-api'
WHERE name_en = 'UniHack 2026 by Chula CSII';

UPDATE public.competitions
SET
  source_platform = 'contester',
  source_external_id = '915',
  contester_url = 'https://contester.life/contest/techstars-startup-weekend-triamudom',
  source_checked_at = now(),
  verified_by = 'contester-api'
WHERE name_en = 'Techstars Startup Weekend Triamudom';

UPDATE public.competitions
SET
  source_platform = 'contester',
  source_external_id = '501',
  url = 'https://thailand-metaverses.vercel.app/',
  contester_url = 'https://contester.life/contest/thailand-metaverse-hackathon-and-exhibition-2026',
  source_checked_at = now(),
  verified_by = 'contester-api'
WHERE name_en = 'Thailand Metaverse Hackathon and Exhibition 2026';

UPDATE public.competitions
SET
  source_platform = 'contester',
  source_external_id = '403',
  url = NULL,
  contester_url = 'https://contester.life/contest/403',
  source_checked_at = now(),
  verified_by = 'contester-api'
WHERE name_en = 'Thailand Sci-Fi Hackathon 2026 by CIA CreativeLab & Harbour.Space@UTCC';

UPDATE public.competitions
SET
  is_active = false,
  notes = COALESCE(notes, '') || ' [INACTIVE: no current dated source listing found on 2026-08-14]',
  source_checked_at = now(),
  verified_by = 'contester-api'
WHERE name_en IN (
  'Casecalator Business Case Competition',
  'Innovation & Future Problem-Solving Project (IFP 2026)'
);

-- Do not wait for the daily job before cleaning the currently polluted rows.
SELECT private.expire_past_competitions();
