-- Harden public_profiles.portfolio_links against javascript:/data: URLs.
--
-- The portfolio editor writes to this table with the anon key via a direct
-- upsert, so its client-side scheme filter is advisory only: anyone can PATCH
-- their own row through the REST API with `javascript:...` and have /u/[handle]
-- render it as an href for every visitor. Enforce the scheme in the database so
-- the guarantee holds regardless of which client wrote the row.

-- CHECK constraints cannot contain subqueries, so the per-element test lives in
-- an IMMUTABLE helper.
CREATE OR REPLACE FUNCTION public.portfolio_links_are_http(links text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(bool_and(link ~* '^https?://'), true)
  FROM unnest(coalesce(links, '{}')) AS link;
$$;

-- Strip any rows that already violate the rule, otherwise the constraint cannot
-- be validated.
UPDATE public.public_profiles
SET portfolio_links = ARRAY(
  SELECT link
  FROM unnest(portfolio_links) AS link
  WHERE link ~* '^https?://'
)
WHERE NOT public.portfolio_links_are_http(portfolio_links);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_profiles_links_scheme'
  ) THEN
    ALTER TABLE public.public_profiles
      ADD CONSTRAINT public_profiles_links_scheme
      CHECK (public.portfolio_links_are_http(portfolio_links));
  END IF;
END $$;
