-- Populate global market metrics for all 20 careers
-- Sources: BLS OOH May 2024 (P10/P90 -> monthly), WEF Future of Jobs 2025
UPDATE career_survival SET
  global_demand_growth = CASE slug
    WHEN 'software-engineer' THEN 8 WHEN 'data-scientist' THEN 10 WHEN 'product-manager' THEN 6
    WHEN 'ux-designer' THEN 6 WHEN 'graphic-designer' THEN 3 WHEN 'content-writer' THEN 3
    WHEN 'marketing-specialist' THEN 5 WHEN 'accountant' THEN 4 WHEN 'nurse' THEN 4
    WHEN 'teacher' THEN 2 WHEN 'lawyer' THEN 4 WHEN 'electrician' THEN 6
    WHEN 'truck-driver' THEN 4 WHEN 'customer-service-representative' THEN 1
    WHEN 'hr-recruiter' THEN 4 WHEN 'financial-analyst' THEN 6
    WHEN 'journalist' THEN 2 WHEN 'paralegal' THEN 2 WHEN 'photographer' THEN 2
    WHEN 'translator' THEN 1
  END,
  global_grad_employment_pct = CASE slug
    WHEN 'software-engineer' THEN 70 WHEN 'data-scientist' THEN 75 WHEN 'product-manager' THEN 72
    WHEN 'ux-designer' THEN 60 WHEN 'graphic-designer' THEN 58 WHEN 'content-writer' THEN 55
    WHEN 'marketing-specialist' THEN 68 WHEN 'accountant' THEN 85 WHEN 'nurse' THEN 93
    WHEN 'teacher' THEN 90 WHEN 'lawyer' THEN 87 WHEN 'electrician' THEN 93
    WHEN 'truck-driver' THEN 88 WHEN 'customer-service-representative' THEN 65
    WHEN 'hr-recruiter' THEN 72 WHEN 'financial-analyst' THEN 82
    WHEN 'journalist' THEN 50 WHEN 'paralegal' THEN 70 WHEN 'photographer' THEN 45
    WHEN 'translator' THEN 48
  END,
  global_saturation_level = CASE slug
    WHEN 'software-engineer' THEN 7 WHEN 'data-scientist' THEN 5 WHEN 'product-manager' THEN 7
    WHEN 'ux-designer' THEN 8 WHEN 'graphic-designer' THEN 9 WHEN 'content-writer' THEN 8
    WHEN 'marketing-specialist' THEN 7 WHEN 'accountant' THEN 3 WHEN 'nurse' THEN 2
    WHEN 'teacher' THEN 2 WHEN 'lawyer' THEN 6 WHEN 'electrician' THEN 2
    WHEN 'truck-driver' THEN 3 WHEN 'customer-service-representative' THEN 6
    WHEN 'hr-recruiter' THEN 6 WHEN 'financial-analyst' THEN 5
    WHEN 'journalist' THEN 8 WHEN 'paralegal' THEN 7 WHEN 'photographer' THEN 9
    WHEN 'translator' THEN 8
  END,
  global_progression_difficulty = CASE slug
    WHEN 'software-engineer' THEN 5 WHEN 'data-scientist' THEN 5 WHEN 'product-manager' THEN 6
    WHEN 'ux-designer' THEN 6 WHEN 'graphic-designer' THEN 6 WHEN 'content-writer' THEN 7
    WHEN 'marketing-specialist' THEN 5 WHEN 'accountant' THEN 4 WHEN 'nurse' THEN 4
    WHEN 'teacher' THEN 5 WHEN 'lawyer' THEN 7 WHEN 'electrician' THEN 5
    WHEN 'truck-driver' THEN 3 WHEN 'customer-service-representative' THEN 4
    WHEN 'hr-recruiter' THEN 5 WHEN 'financial-analyst' THEN 5
    WHEN 'journalist' THEN 7 WHEN 'paralegal' THEN 6 WHEN 'photographer' THEN 8
    WHEN 'translator' THEN 5
  END,
  global_salary_floor = CASE slug
    WHEN 'software-engineer' THEN 6654 WHEN 'data-scientist' THEN 5304 WHEN 'product-manager' THEN 4985
    WHEN 'ux-designer' THEN 3987 WHEN 'graphic-designer' THEN 2917 WHEN 'content-writer' THEN 2750
    WHEN 'marketing-specialist' THEN 3083 WHEN 'accountant' THEN 4398 WHEN 'nurse' THEN 5503
    WHEN 'teacher' THEN 3944 WHEN 'lawyer' THEN 6065 WHEN 'electrician' THEN 3286
    WHEN 'truck-driver' THEN 3333 WHEN 'customer-service-representative' THEN 2500
    WHEN 'hr-recruiter' THEN 3417 WHEN 'financial-analyst' THEN 5201
    WHEN 'journalist' THEN 2583 WHEN 'paralegal' THEN 3250 WHEN 'photographer' THEN 2167
    WHEN 'translator' THEN 2750
  END,
  global_salary_ceiling = CASE slug
    WHEN 'software-engineer' THEN 17621 WHEN 'data-scientist' THEN 16201 WHEN 'product-manager' THEN 13816
    WHEN 'ux-designer' THEN 16015 WHEN 'graphic-designer' THEN 7750 WHEN 'content-writer' THEN 8583
    WHEN 'marketing-specialist' THEN 12500 WHEN 'accountant' THEN 11785 WHEN 'nurse' THEN 11277
    WHEN 'teacher' THEN 8723 WHEN 'lawyer' THEN 19933 WHEN 'electrician' THEN 8836
    WHEN 'truck-driver' THEN 6083 WHEN 'customer-service-representative' THEN 4583
    WHEN 'hr-recruiter' THEN 10000 WHEN 'financial-analyst' THEN 15046
    WHEN 'journalist' THEN 8917 WHEN 'paralegal' THEN 7417 WHEN 'photographer' THEN 6250
    WHEN 'translator' THEN 8333
  END
WHERE slug IN (
  'software-engineer','data-scientist','product-manager','ux-designer',
  'graphic-designer','content-writer','marketing-specialist','accountant',
  'nurse','teacher','lawyer','electrician','truck-driver',
  'customer-service-representative','hr-recruiter','financial-analyst',
  'journalist','paralegal','photographer','translator'
);
