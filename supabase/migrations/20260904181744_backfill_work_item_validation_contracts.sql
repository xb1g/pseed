-- Add the validation contract to the four deterministic starter bets.
-- Existing values win so staff edits are never overwritten.

WITH validation_defaults (id, fields) AS (
  VALUES
    (
      '20000000-0000-4000-8000-000000000001'::uuid,
      jsonb_build_object(
        'segment', 'Students with portfolio urgency and the parents approving the purchase.',
        'hypothesis', 'A readiness-based chooser will reduce offer confusion and make the intended price feel coherent.',
        'passBar', 'In 10 live conversations, at least 8 people choose the right program without founder explanation.',
        'result', 'Not tested yet.'
      )
    ),
    (
      '20000000-0000-4000-8000-000000000002'::uuid,
      jsonb_build_object(
        'segment', 'Interested students who need parent approval before paying.',
        'hypothesis', 'A one-page parent packet will preserve intent through the parent handoff.',
        'passBar', 'Test 5 live handoffs. At least 3 proceed to a parent conversation without re-explaining the basics.',
        'result', 'Not tested yet.'
      )
    ),
    (
      '20000000-0000-4000-8000-000000000003'::uuid,
      jsonb_build_object(
        'segment', 'Students who comment PORT but differ in readiness and urgency.',
        'hypothesis', 'Three qualifying questions will route each lead to useful help or the right paid offer.',
        'passBar', 'Across 30 leads, route at least 70% confidently and move at least 20% into a qualified conversation.',
        'result', 'Not tested yet.'
      )
    ),
    (
      '20000000-0000-4000-8000-000000000004'::uuid,
      jsonb_build_object(
        'segment', 'Consenting TechSeed and SHIFT students completing real project work.',
        'hypothesis', 'Structured proof captured during delivery will outperform retrospective testimonials in sales.',
        'passBar', 'Capture complete evidence for 80% of consenting finishers and reuse it in 3 qualified sales conversations.',
        'result', 'Not tested yet.'
      )
    )
)
UPDATE public.work_items AS work_item
SET details = validation_defaults.fields || work_item.details
FROM validation_defaults
WHERE work_item.id = validation_defaults.id;
