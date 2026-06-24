-- Allow the cross-field growth-comparison card kind.
ALTER TABLE radar_cards DROP CONSTRAINT IF EXISTS radar_cards_kind_check;
ALTER TABLE radar_cards ADD CONSTRAINT radar_cards_kind_check CHECK (kind IN
  ('hook','fantasyReality','text','jobs','list','cta',
   'dayInLife','salaryProgression','growthCompare','aiImpact','marketThailand',
   'entryRoutes','risks','realPeople','sources'));
