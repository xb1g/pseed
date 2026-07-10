-- Fix accountant salaryProgression: rename title→level and yearsExp→years in JSONB
UPDATE radar_cards
SET content_th = jsonb_set(
  content_th,
  '{levels}',
  (
    SELECT jsonb_agg(
      (elem - 'title' - 'yearsExp')
      || jsonb_build_object('level', elem->>'title')
      || jsonb_build_object('years', elem->>'yearsExp')
    )
    FROM jsonb_array_elements(content_th->'levels') AS elem
  )
)
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id
  AND radar_fields.slug = 'accountant'
  AND radar_cards.kind = 'salaryProgression'
  AND content_th->'levels'->0 ? 'title';
