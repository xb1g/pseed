-- Seed participants
INSERT INTO hackathon_participants (id, name, email, phone, password_hash, university, role, track, grade_level, experience_level, referral_source, bio)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Ploy Thanakit',  'ploy@example.com',  '0800000001', 'x', 'Chulalongkorn University', 'developer', 'health', 'undergraduate', 3, 'friend', 'Full-stack developer focused on health tech.'),
  ('11111111-0000-0000-0000-000000000002', 'Nat Surawit',    'nat@example.com',   '0800000002', 'x', 'Mahidol University',       'designer',  'health', 'undergraduate', 2, 'social', 'Product designer focused on accessibility.'),
  ('11111111-0000-0000-0000-000000000003', 'Pim Jirayu',     'pim@example.com',   '0800000003', 'x', 'KMITL',                    'developer', 'health', 'undergraduate', 4, 'event',  'Full-stack dev who loves data pipelines.'),
  ('11111111-0000-0000-0000-000000000004', 'Arm Kittisak',   'arm@example.com',   '0800000004', 'x', 'Thammasat University',     'developer', 'mental', 'undergraduate', 3, 'friend', 'ML engineer interested in mental health.'),
  ('11111111-0000-0000-0000-000000000005', 'Fon Naruemon',   'fon@example.com',   '0800000005', 'x', 'Kasetsart University',     'designer',  'mental', 'undergraduate', 2, 'social', 'UX researcher and illustrator.'),
  ('11111111-0000-0000-0000-000000000006', 'Tong Phiraphon', 'tong@example.com',  '0800000006', 'x', 'KMUTT',                    'developer', 'mental', 'graduate',      4, 'event',  'Backend engineer, fintech background.'),
  ('11111111-0000-0000-0000-000000000007', 'Aom Siriporn',   'aom@example.com',   '0800000007', 'x', 'Chiang Mai University',    'developer', 'health', 'undergraduate', 3, 'friend', 'Mobile developer, iOS first.'),
  ('11111111-0000-0000-0000-000000000008', 'Beam Chayanit',  'beam@example.com',  '0800000008', 'x', 'Chulalongkorn University', 'designer',  'health', 'undergraduate', 2, 'social', 'Visual designer who loves systems.'),
  ('11111111-0000-0000-0000-000000000009', 'Mook Nattida',   'mook@example.com',  '0800000009', 'x', 'NIDA',                     'developer', 'health', 'graduate',      3, 'event',  'Data scientist, public health focus.')
ON CONFLICT (email) DO NOTHING;

-- Seed teams
INSERT INTO hackathon_teams (id, name, lobby_code, owner_id)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'MindBridge', 'MIND01', '11111111-0000-0000-0000-000000000004'),
  ('22222222-0000-0000-0000-000000000002', 'VitalTrack', 'VITA02', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000003', 'CareLoop',   'CARE03', '11111111-0000-0000-0000-000000000007')
ON CONFLICT (lobby_code) DO NOTHING;

-- Seed team members
INSERT INTO hackathon_team_members (team_id, participant_id)
VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000007'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000008'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Seed gallery products
INSERT INTO hackathon_gallery_products (
  team_id, product_name, problem_statement, solution_description,
  cover_image_url, tags, hackathon_year, hackathon_name, is_published, interest_count
)
VALUES
(
  '22222222-0000-0000-0000-000000000001',
  'MindBridge',
  'Therapists in Thailand carry caseloads of 80+ patients, leaving almost no time to track how each patient is doing between sessions.',
  'MindBridge sits between therapy sessions. Patients log daily mood check-ins through a simple LINE chatbot — no app to download, no login to remember. The therapist sees a dashboard that flags patients whose mood has dropped significantly, so they can reach out before a crisis forms.

The system uses a validated PHQ-2 scale adapted for Thai conversational context, built by Fon after reviewing 40 hours of real patient intake transcripts. Tong built the LINE webhook and scoring pipeline in three days. Arm trained a small classifier that identifies distress language in free-text responses, adding a second signal beyond the numeric score.

In the 5-day sprint, we piloted with three volunteer therapists at a clinic in Bangkok. They flagged MindBridge as the tool they wished existed two years ago.',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80',
  ARRAY['Mental Health', 'Healthcare', 'AI'],
  2026, 'The Next Decade', true, 7
),
(
  '22222222-0000-0000-0000-000000000002',
  'VitalTrack',
  'Elderly patients discharged from hospital after a cardiac event are readmitted within 30 days at a rate of 22% in Thailand — often because nobody caught the early warning signs at home.',
  'VitalTrack is a post-discharge monitoring kit for cardiac patients. A low-cost Bluetooth pulse oximeter pairs with a Thai-language mobile app that guides patients through a daily 3-minute vital signs check. The app flags readings outside safe thresholds and sends an SMS alert to the patient''s registered nurse.

Ploy built the app in React Native, Nat designed the Thai-language onboarding flow tested with three elderly participants during the hackathon, and Pim wrote the alerting backend on Supabase Edge Functions.

The product targets government hospitals with limited nursing staff. The alert system routes to an on-call nurse rather than requiring a dedicated care manager. During our hackathon test, it correctly flagged a simulated low-oxygen reading in under 90 seconds.',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  ARRAY['Preventive Health', 'IoT', 'Elderly Care'],
  2026, 'The Next Decade', true, 12
),
(
  '22222222-0000-0000-0000-000000000003',
  'CareLoop',
  'Informal caregivers — family members looking after a sick relative at home — have no structured way to hand off information when shifts change, leading to missed medications, duplicate doses, and untracked symptoms.',
  'CareLoop is a shared care log for families. Each family has a private room where caregivers log medication doses, symptom notes, and appointment reminders. When a shift changes, the incoming caregiver opens the app and gets a summary of what happened in the last 12 hours, generated in plain Thai by a small language model.

Aom built the iOS app, Beam designed the handoff summary card, and Mook trained the summarizer on anonymized caregiver notes collected through a consent form we ran during the hackathon.

The product does not require everyone in the family to be tech-savvy. The primary interface is a large-type log view designed for users over 60. The AI summary is the only piece that requires internet; the log itself works offline.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80',
  ARRAY['Caregiving', 'AI', 'Family Health'],
  2026, 'The Next Decade', true, 4
);
