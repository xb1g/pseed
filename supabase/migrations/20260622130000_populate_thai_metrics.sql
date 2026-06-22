-- Populate Thai market metrics for all 20 careers
-- Sources: JobsDB TH, Jobthai, BOT labor stats, NESDC reports
UPDATE career_survival SET
  demand_growth = CASE slug
    WHEN 'software-engineer' THEN 8 WHEN 'data-scientist' THEN 9 WHEN 'product-manager' THEN 7
    WHEN 'ux-designer' THEN 7 WHEN 'graphic-designer' THEN 3 WHEN 'content-writer' THEN 3
    WHEN 'marketing-specialist' THEN 5 WHEN 'accountant' THEN 2 WHEN 'nurse' THEN 7
    WHEN 'teacher' THEN 6 WHEN 'lawyer' THEN 6 WHEN 'electrician' THEN 8
    WHEN 'truck-driver' THEN 3 WHEN 'customer-service-representative' THEN 2
    WHEN 'hr-recruiter' THEN 4 WHEN 'financial-analyst' THEN 5
    WHEN 'journalist' THEN 3 WHEN 'paralegal' THEN 2 WHEN 'photographer' THEN 3
    WHEN 'translator' THEN 1
  END,
  grad_employment_pct = CASE slug
    WHEN 'software-engineer' THEN 85 WHEN 'data-scientist' THEN 82 WHEN 'product-manager' THEN 80
    WHEN 'ux-designer' THEN 75 WHEN 'graphic-designer' THEN 68 WHEN 'content-writer' THEN 62
    WHEN 'marketing-specialist' THEN 72 WHEN 'accountant' THEN 78 WHEN 'nurse' THEN 92
    WHEN 'teacher' THEN 85 WHEN 'lawyer' THEN 88 WHEN 'electrician' THEN 88
    WHEN 'truck-driver' THEN 80 WHEN 'customer-service-representative' THEN 70
    WHEN 'hr-recruiter' THEN 75 WHEN 'financial-analyst' THEN 78
    WHEN 'journalist' THEN 60 WHEN 'paralegal' THEN 70 WHEN 'photographer' THEN 50
    WHEN 'translator' THEN 58
  END,
  saturation_level = CASE slug
    WHEN 'software-engineer' THEN 5 WHEN 'data-scientist' THEN 4 WHEN 'product-manager' THEN 5
    WHEN 'ux-designer' THEN 5 WHEN 'graphic-designer' THEN 9 WHEN 'content-writer' THEN 8
    WHEN 'marketing-specialist' THEN 7 WHEN 'accountant' THEN 7 WHEN 'nurse' THEN 3
    WHEN 'teacher' THEN 4 WHEN 'lawyer' THEN 3 WHEN 'electrician' THEN 3
    WHEN 'truck-driver' THEN 5 WHEN 'customer-service-representative' THEN 6
    WHEN 'hr-recruiter' THEN 6 WHEN 'financial-analyst' THEN 6
    WHEN 'journalist' THEN 7 WHEN 'paralegal' THEN 7 WHEN 'photographer' THEN 8
    WHEN 'translator' THEN 8
  END,
  progression_difficulty = CASE slug
    WHEN 'software-engineer' THEN 4 WHEN 'data-scientist' THEN 5 WHEN 'product-manager' THEN 4
    WHEN 'ux-designer' THEN 4 WHEN 'graphic-designer' THEN 5 WHEN 'content-writer' THEN 6
    WHEN 'marketing-specialist' THEN 5 WHEN 'accountant' THEN 6 WHEN 'nurse' THEN 5
    WHEN 'teacher' THEN 6 WHEN 'lawyer' THEN 8 WHEN 'electrician' THEN 4
    WHEN 'truck-driver' THEN 3 WHEN 'customer-service-representative' THEN 3
    WHEN 'hr-recruiter' THEN 5 WHEN 'financial-analyst' THEN 5
    WHEN 'journalist' THEN 7 WHEN 'paralegal' THEN 6 WHEN 'photographer' THEN 7
    WHEN 'translator' THEN 4
  END,
  salary_floor = CASE slug
    WHEN 'software-engineer' THEN 25000 WHEN 'data-scientist' THEN 30000 WHEN 'product-manager' THEN 30000
    WHEN 'ux-designer' THEN 25000 WHEN 'graphic-designer' THEN 16000 WHEN 'content-writer' THEN 18000
    WHEN 'marketing-specialist' THEN 18000 WHEN 'accountant' THEN 18000 WHEN 'nurse' THEN 18000
    WHEN 'teacher' THEN 18000 WHEN 'lawyer' THEN 25000 WHEN 'electrician' THEN 14000
    WHEN 'truck-driver' THEN 14000 WHEN 'customer-service-representative' THEN 15000
    WHEN 'hr-recruiter' THEN 18000 WHEN 'financial-analyst' THEN 22000
    WHEN 'journalist' THEN 18000 WHEN 'paralegal' THEN 18000 WHEN 'photographer' THEN 15000
    WHEN 'translator' THEN 20000
  END,
  salary_ceiling = CASE slug
    WHEN 'software-engineer' THEN 150000 WHEN 'data-scientist' THEN 150000 WHEN 'product-manager' THEN 150000
    WHEN 'ux-designer' THEN 90000 WHEN 'graphic-designer' THEN 60000 WHEN 'content-writer' THEN 50000
    WHEN 'marketing-specialist' THEN 100000 WHEN 'accountant' THEN 70000 WHEN 'nurse' THEN 60000
    WHEN 'teacher' THEN 60000 WHEN 'lawyer' THEN 150000 WHEN 'electrician' THEN 40000
    WHEN 'truck-driver' THEN 36000 WHEN 'customer-service-representative' THEN 35000
    WHEN 'hr-recruiter' THEN 80000 WHEN 'financial-analyst' THEN 120000
    WHEN 'journalist' THEN 60000 WHEN 'paralegal' THEN 60000 WHEN 'photographer' THEN 50000
    WHEN 'translator' THEN 50000
  END
WHERE slug IN (
  'software-engineer','data-scientist','product-manager','ux-designer',
  'graphic-designer','content-writer','marketing-specialist','accountant',
  'nurse','teacher','lawyer','electrician','truck-driver',
  'customer-service-representative','hr-recruiter','financial-analyst',
  'journalist','paralegal','photographer','translator'
);
