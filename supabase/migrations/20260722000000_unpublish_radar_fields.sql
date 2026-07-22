-- Unpublish all radar fields except the 4 active ones:
-- cybersecurity, ai-engineer, data-scientist, software-engineer
UPDATE radar_fields
SET is_published = false
WHERE slug NOT IN ('cybersecurity', 'ai-engineer', 'data-scientist', 'software-engineer');
