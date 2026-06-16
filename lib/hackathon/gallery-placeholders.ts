import type { GalleryProduct, GalleryProductSummary } from "./gallery";

const NAMES = ["MediTrack", "CareLink", "HealthBridge", "NutriScan", "MindEase", "FitPath", "ElderCare", "DiagnoAI", "TeleWell", "ResearchHub"];
const TEAMS = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];
const TAGS = ["Health", "Education", "Productivity", "Mental Health", "Elderly Care", "Nutrition", "Fitness", "Diagnosis", "Telemedicine", "Research"];
const COVERS = [
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", // medical
  "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&q=80", // care
  "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80", // bridge health
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80", // food/nutrition
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", // mindfulness
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", // fitness
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80", // elderly care
  "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80", // diagnosis
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", // telemedicine
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80", // research
];
const PROBLEMS = [
  "Patients struggle to track medications across multiple providers, leading to dangerous interactions and missed doses.",
  "Elderly patients lack easy access to caregivers, causing delayed responses during health emergencies at home.",
  "Rural communities face a severe shortage of specialists — patients travel 3+ hours for a single consultation.",
  "People with chronic conditions have no reliable way to track nutritional intake against their medical guidelines.",
  "Mental health support is inaccessible for most students due to cost, stigma, and long waiting times.",
  "Physical rehabilitation patients drop out early because home exercise programs lack real-time feedback.",
  "Family members caring for elderly relatives have no central tool to coordinate schedules and health updates.",
  "Primary care doctors spend 40% of consultation time on differential diagnosis that AI could assist with.",
  "Underserved communities cannot afford telehealth platforms that charge per-visit fees.",
  "Clinical researchers lack a simple tool to match willing patient volunteers with ongoing trials.",
];
const SOLUTIONS = [
  "MediTrack aggregates prescriptions from all providers into one smart timeline, flags interactions, and sends reminders.",
  "CareLink connects patients to a network of verified caregivers with one-tap emergency alerts and live location sharing.",
  "HealthBridge offers asynchronous video consultations so specialists can review cases on their own schedule.",
  "NutriScan uses food photo recognition to log meals and maps nutrients against personalized medical targets.",
  "MindEase pairs students with peer-support trained volunteers through anonymous text-based sessions.",
  "FitPath generates adaptive home exercise programs with pose estimation via the phone camera.",
  "ElderCare creates a shared family dashboard with medication schedules, appointment reminders, and mood check-ins.",
  "DiagnoAI presents the top differential diagnoses with evidence summaries during the consultation.",
  "TeleWell offers subscription-free telehealth funded by partner hospitals seeking to extend their reach.",
  "ResearchHub matches patients to trials by condition, location, and eligibility criteria in under 60 seconds.",
];
const MEMBERS = [
  ["Anya K.", "Ben L.", "Chai P."],
  ["Dana M.", "Eli R.", "Fon S."],
  ["Grace T.", "Hugo V.", "Iris W."],
  ["Jake X.", "Kae Y.", "Leo Z."],
  ["Maya A.", "Nino B.", "Otto C."],
  ["Pam D.", "Quinn E.", "Rosa F."],
  ["Sam G.", "Tara H.", "Uma I."],
  ["Vera J.", "Will K.", "Xena L."],
  ["Yuki M.", "Zoe N.", "Aran O."],
  ["Boon P.", "Cita Q.", "Dara R."],
];

export const PLACEHOLDER_PRODUCTS: GalleryProductSummary[] = NAMES.map((name, i) => ({
  id: `placeholder-${i}`,
  team_id: `placeholder-team-${i}`,
  product_name: name,
  problem_statement: PROBLEMS[i],
  cover_image_url: COVERS[i],
  tags: [TAGS[i]],
  hackathon_year: 2026,
  hackathon_name: "PassionSeed Hackathon",
  interest_count: 0,
  team_name: `Team ${TEAMS[i]}`,
}));

export function getPlaceholderProduct(teamId: string): GalleryProduct | null {
  const index = PLACEHOLDER_PRODUCTS.findIndex((p) => p.team_id === teamId);
  if (index === -1) return null;
  const p = PLACEHOLDER_PRODUCTS[index];
  return {
    id: p.id,
    team_id: p.team_id,
    product_name: p.product_name,
    problem_statement: PROBLEMS[index],
    solution_description: SOLUTIONS[index],
    cover_image_url: COVERS[index],
    additional_images: [],
    demo_url: null,
    line_qr_url: null,
    tags: p.tags,
    hackathon_year: p.hackathon_year,
    hackathon_name: p.hackathon_name,
    interest_count: 12,
    created_at: new Date().toISOString(),
    team: {
      name: `Team ${TEAMS[index]}`,
      members: MEMBERS[index].map((name) => ({ name })),
    },
  };
}
