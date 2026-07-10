-- Add is_hidden column to radar_cards for hiding deprecated card kinds
ALTER TABLE radar_cards ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Hide non-standard cards (keep only the 11-card standard: hook, fantasyReality, text, salaryProgression, aiImpact, marketThailand, dayInLife, risks, entryRoutes, cta, sources)
UPDATE radar_cards
SET is_hidden = true
WHERE kind IN ('reflection', 'jobs', 'growthCompare', 'list', 'realPeople', 'futureOutlook');

-- Also hide duplicate text cards (position > 20) — only the text at position 20 is standard
UPDATE radar_cards
SET is_hidden = true
WHERE kind = 'text' AND position > 20;
