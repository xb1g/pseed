-- Normalize all radar card positions to the 11-card standard:
-- 0=hook, 10=fantasyReality, 40=salaryProgression, 70=aiImpact, 80=marketThailand,
-- 90=dayInLife, 110=risks, 120=entryRoutes, 130=text, 140=cta, 150=sources

-- Delete hidden text cards at position 130 (deprecated duplicates that would conflict)
DELETE FROM radar_cards WHERE kind = 'text' AND position = 130 AND is_hidden = true;

DO $$
DECLARE
  f RECORD;
  kinds TEXT[] := ARRAY['hook','fantasyReality','salaryProgression','aiImpact','marketThailand','dayInLife','risks','entryRoutes','text','cta','sources'];
  positions INT[] := ARRAY[0, 10, 40, 70, 80, 90, 110, 120, 130, 140, 150];
BEGIN
  FOR f IN SELECT DISTINCT field_id FROM radar_cards LOOP
    -- Move ALL cards (hidden and visible) to temp positions to clear the board
    UPDATE radar_cards SET position = position + 20000
    WHERE field_id = f.field_id;

    -- Set visible cards to standard positions by kind
    FOR i IN 1..array_length(kinds, 1) LOOP
      UPDATE radar_cards SET position = positions[i]
      WHERE field_id = f.field_id AND kind = kinds[i] AND is_hidden = false;
    END LOOP;

    -- Move hidden cards to 900+ range so they don't conflict
    UPDATE radar_cards SET position = position - 20000 + 900
    WHERE field_id = f.field_id AND position >= 20000;
  END LOOP;
END $$;
