-- Fix double-encoded UTF-8 Thai text in radar_cards and radar_fields.
-- The text was inserted through a Latin-1 connection, causing UTF-8 bytes
-- to be re-encoded (e.g. "à¸" instead of Thai characters).
--
-- Detection: if content_th::text contains 'Ã ' or 'à¸' patterns,
-- it's double-encoded. Fix by converting the text bytes back:
--   encode the text as Latin-1 bytes, then decode those bytes as UTF-8.

-- Helper: fix double-encoded UTF-8 text
CREATE OR REPLACE FUNCTION fix_double_utf8(t text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF t IS NULL THEN RETURN NULL; END IF;
  -- Only attempt fix if we detect the double-encoding signature
  IF t ~ 'Ã\u0080|Ã\u0082|Ã\u0083|à¸|à¹' THEN
    RETURN convert_from(convert_to(t, 'LATIN1'), 'UTF8');
  END IF;
  RETURN t;
EXCEPTION WHEN OTHERS THEN
  -- If conversion fails, return original text unchanged
  RETURN t;
END;
$$;

-- Fix radar_cards content_th (JSONB — need to convert to text, fix, convert back)
UPDATE radar_cards
SET content_th = fix_double_utf8(content_th::text)::jsonb
WHERE content_th::text ~ 'Ã\u0080|Ã\u0082|Ã\u0083|à¸|à¹';

-- Fix radar_fields text columns
UPDATE radar_fields
SET
  name_th    = fix_double_utf8(name_th),
  tagline_th = fix_double_utf8(tagline_th)
WHERE name_th ~ 'Ã\u0080|Ã\u0082|Ã\u0083|à¸|à¹'
   OR tagline_th ~ 'Ã\u0080|Ã\u0082|Ã\u0083|à¸|à¹';

-- Also fix hero_image_alt_th if present
UPDATE radar_fields
SET hero_image_alt_th = fix_double_utf8(hero_image_alt_th)
WHERE hero_image_alt_th IS NOT NULL
  AND hero_image_alt_th ~ 'Ã\u0080|Ã\u0082|Ã\u0083|à¸|à¹';

-- Clean up helper function
DROP FUNCTION fix_double_utf8(text);
