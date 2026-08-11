// Seeds the "LaunchPad" startup PathLab (curriculum/pathlab/startup/README.md)
// into the learning-map runtime, so it plays on the phone-friendly trail view
// at /map/<id> and can be gated behind a lobby (the squad room).
//
// Shape: 6 linear nodes (one per curriculum day), each with a text briefing
// (Hook / Learn / Do) and one `text_answer` assessment carrying the day's
// deliverables. `text_answer` submissions land in `submitted`, which the
// unlock rule treats as complete — so a solo student advances without waiting
// on a grader, and a mentor can still grade the submissions afterwards.
//
// Usage:
//   set -a; source .env.local; set +a; node scripts/seed-startup-pathlab.mjs
//
// Idempotent: every row uses a fixed UUID and is upserted on its primary key.
// INSERTS/UPSERTS ONLY — never deletes.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "   Run with: set -a; source .env.local; set +a; node scripts/seed-startup-pathlab.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Fixed UUIDs -----------------------------------------------------------
const MAP_ID = "00000000-0000-0000-0000-000000000020";
const LOBBY_ID = "00000000-0000-0000-0015-000000000001";
const LOBBY_CODE = "LAUNCH";

const nodeId = (n) => `00000000-0000-0000-0011-${String(n).padStart(12, "0")}`;
const pathId = (n) => `00000000-0000-0000-0012-${String(n).padStart(12, "0")}`;
const contentId = (n) => `00000000-0000-0000-0013-${String(n).padStart(12, "0")}`;
const assessmentId = (n) => `00000000-0000-0000-0014-${String(n).padStart(12, "0")}`;

const SPRITES = ["/islands/crystal.png", "/islands/desert.png", "/islands/winter.png"];

// --- Curriculum ------------------------------------------------------------
// Ported from curriculum/pathlab/startup/README.md. `body` is the Learn + Do
// briefing the student reads; `deliverables` becomes the assessment prompt.
const DAYS = [
  {
    n: 1,
    title: "Day 1 — Spot the Problem",
    theme: "Every great startup starts with a real problem",
    hook: "The best businesses don't sell products — they kill pain points. Today, you become a Problem Hunter.",
    body: `
      <h3>Learn (5 min)</h3>
      <p>What makes a problem worth solving? <strong>frequency × intensity × market size</strong>.</p>
      <ul>
        <li><strong>Airbnb</strong> — can't afford hotels</li>
        <li><strong>Grab</strong> — can't find a safe ride</li>
        <li><strong>Canva</strong> — design tools are too hard</li>
      </ul>
      <p>Key concept: <strong>Problem–Solution Fit</strong>. Don't start with an idea, start with a pain.</p>

      <h3>Do (20 min)</h3>
      <p><strong>🔍 Problem Safari</strong></p>
      <ol>
        <li>List 5 problems you personally hit this week — school, commuting, studying, shopping, social media, health.</li>
        <li>Rate each one: <strong>pain</strong> (1–5), <strong>frequency</strong> (1–5), and <strong>who else has it</strong> (just me / my friends / everyone).</li>
        <li>Pick your #1 — highest pain × frequency × reach.</li>
      </ol>
      <p><strong>✍️ Problem Statement</strong> — write your problem in this format:</p>
      <blockquote><strong>[Who]</strong> struggles with <strong>[problem]</strong> because <strong>[reason]</strong>, which causes <strong>[consequence]</strong>.</blockquote>
      <p>Example: <em>High school students struggle with finding reliable study groups because they don't know who's serious, which causes wasted time and bad grades.</em></p>
    `,
    deliverables: [
      "Problem Safari — 5 problems, each rated on pain, frequency, and reach",
      "Your #1 problem written as a one-sentence problem statement",
    ],
    careers: "Product Manager · UX Researcher",
  },
  {
    n: 2,
    title: "Day 2 — Who's Your Customer?",
    theme: "You're not building for \"everyone\" — find your exact person",
    hook: "If your answer to 'who's your customer?' is 'everyone' — you have no customer. Today you'll find your ONE person.",
    body: `
      <h3>Learn (5 min)</h3>
      <p>A <strong>customer persona</strong> is a fictional character standing in for your ideal user. Niching down is how it starts: Instagram began with photographers, Facebook with one campus.</p>
      <p>Key concept: <strong>early adopters</strong> — the people so frustrated they'll try anything.</p>

      <h3>Do (20 min)</h3>
      <p><strong>🧑‍🎤 Build Your Persona</strong> — name, age, grade, school type, daily routine, apps they use, what frustrates them most about your problem, the workaround they use today, and how much time or money that workaround wastes.</p>
      <p><strong>⚡ Assumption Check</strong> — list 3 assumptions and rate your confidence (guess / somewhat sure / very sure):</p>
      <ol>
        <li>I assume they care about ___ because ___</li>
        <li>I assume they currently do ___ to solve this</li>
        <li>I assume they'd pay for or use ___ if it existed</li>
      </ol>
      <p><strong>📱 Quick Validation</strong> — write 3 questions you'd ask a real person. Open-ended only.</p>
      <ul>
        <li>Good: "Tell me about the last time you had this problem."</li>
        <li>Bad: "Would you use my app?" — everyone says yes, nobody means it.</li>
      </ul>
    `,
    deliverables: [
      "Customer persona card — the full profile",
      "3 assumptions, each with a confidence rating",
      "3 open-ended validation questions",
    ],
    careers: "UX Researcher · Data Analyst",
  },
  {
    n: 3,
    title: "Day 3 — The Business Model",
    theme: "A cool idea without a business model is just a hobby",
    hook: "You've found a real problem and a real customer. But how does this become a business?",
    body: `
      <h3>Learn (5 min)</h3>
      <p>The <strong>Lean Canvas</strong> is a one-page business model. Revenue models worth knowing:</p>
      <ul>
        <li><strong>Freemium</strong> — free basic, pay for premium (Spotify, games)</li>
        <li><strong>Subscription</strong> — monthly fee (Netflix, gym)</li>
        <li><strong>Marketplace</strong> — take a cut of transactions (Grab, Shopee)</li>
        <li><strong>Advertising</strong> — free for users, sell attention (Instagram, YouTube)</li>
        <li><strong>One-time purchase</strong> — pay once (apps, courses)</li>
      </ul>
      <p>Key concept: <strong>unit economics</strong> — does selling one unit make money or lose money?</p>

      <h3>Do (25 min)</h3>
      <p><strong>📋 Lean Canvas</strong> — fill all eight boxes: Problem (top 3 pains from Day 1), Customer (from Day 2), Solution, Value Prop (one sentence), Revenue model, Pricing and why, Channels, Costs.</p>
      <p><strong>💰 Napkin Math</strong> — charge ฿X per month × Y customers in month 1 = revenue. Subtract main costs. Profit or loss? If you're burning cash, what has to change?</p>
      <p><strong>🔀 Decision Point</strong> — pick one; it sets up Day 4:</p>
      <ul>
        <li><strong>A) Digital Product</strong> — app, website, or online tool</li>
        <li><strong>B) Physical Product/Service</strong> — something in the real world</li>
        <li><strong>C) Content/Community</strong> — media, education, or community</li>
      </ul>
    `,
    deliverables: [
      "Completed Lean Canvas — all eight boxes",
      "Napkin math — revenue, costs, profit or loss",
      "Path choice: A, B, or C",
    ],
    careers: "Business Analyst / CFO · Strategy Consultant",
  },
  {
    n: 4,
    title: "Day 4 — Build Something Real",
    theme: "Stop planning, start making — even if it's ugly",
    hook: "Founders ship ugly things fast and learn. Today you build your MVP. Emphasis on MINIMUM.",
    body: `
      <h3>Learn (5 min)</h3>
      <p>An <strong>MVP</strong> is the smallest thing you can build to test whether your idea works. Famously ugly ones:</p>
      <ul>
        <li><strong>Dropbox</strong> — just a video showing the concept</li>
        <li><strong>Zappos</strong> — bought shoes from stores and shipped them by hand</li>
        <li><strong>Buffer</strong> — one landing page with a pricing button</li>
      </ul>
      <p>Key concept: <strong>Build → Measure → Learn</strong>. You're not building a product, you're building a learning machine.</p>

      <h3>Do (25 min)</h3>
      <p><strong>🛠️ Pick one MVP type</strong> based on your Day 3 path:</p>
      <ul>
        <li><strong>Landing page</strong> — headline, problem, how it works in 3 steps, call-to-action</li>
        <li><strong>Storyboard</strong> — 6 panels, problem in panel 1 to solved in panel 6. Stick figures are fine.</li>
        <li><strong>Fake ad</strong> — one Instagram/TikTok ad: visual + caption + hashtags + CTA</li>
        <li><strong>Prototype walkthrough</strong> — 4–6 screens: landing → main feature → key interaction → success</li>
        <li><strong>Explainer script</strong> — 60 seconds: hook 5s, problem 10s, solution 20s, how it works 15s, CTA 10s</li>
      </ul>
      <p><strong>🤔 The Mom Test</strong> — if you showed this to a stranger: what's the first question they'd ask, what would confuse them, and what would make them say "oh, that's cool"?</p>
    `,
    deliverables: [
      "Your chosen MVP type",
      "The actual MVP — describe it, or paste a link to the file/photo",
      "Mom Test — three answers",
    ],
    careers: "Product Designer · Software Developer",
  },
  {
    n: 5,
    title: "Day 5 — Get Your First Users",
    theme: "Building it is 20% of the work. Getting people to care is 80%.",
    hook: "You've built something. Cool. Nobody cares yet. Attention is the real currency.",
    body: `
      <h3>Learn (5 min)</h3>
      <p>Growth channels that actually work for startups: organic social, word of mouth and referrals, communities (Discord, LINE groups, Reddit), partnerships, and content marketing.</p>
      <p>Key concept: <strong>CAC</strong> — how much does it cost to get one customer?</p>
      <p>The <strong>AARRR funnel</strong>: Acquisition (how they find you), Activation (good first experience), Retention (they come back), Revenue (they pay), Referral (they tell friends).</p>

      <h3>Do (25 min)</h3>
      <p><strong>📈 Growth Plan</strong> — plan your first 100 users in three phases: 0→10, 10→50, 50→100. For each, name the channel and what you actually do. Rules: the first 10 come from direct outreach, no ads. Budget is ฿0 up to 50 users, then ฿500 max.</p>
      <p><strong>📱 One Piece of Content</strong> — make a single post: platform, caption or script, the visual, and a hook in the first line. Authentic, not salesy.</p>
      <p><strong>🎮 Decision Scenario</strong> — Week 2, 47 users, growth slowing, ฿2,000 in the budget. A friend says "just pay for Instagram ads." What do you do?</p>
      <ul>
        <li><strong>A)</strong> ฿1,500 on Instagram ads targeting your audience</li>
        <li><strong>B)</strong> ฿0 — DM 20 current users, ask why they signed up, improve the product</li>
        <li><strong>C)</strong> ฿500 on a small collab with a micro-influencer who matches your audience</li>
        <li><strong>D)</strong> Your own strategy</li>
      </ul>
      <p>Explain your reasoning in 3–4 sentences.</p>
    `,
    deliverables: [
      "Growth plan — first 100 users across three phases",
      "One social post — caption plus visual description",
      "Decision scenario — your choice and your reasoning",
    ],
    careers: "Growth Marketer · Community Manager",
  },
  {
    n: 6,
    title: "Day 6 — Pitch Day",
    theme: "The grand finale — sell your vision",
    hook: "Every startup lives or dies by its pitch. Today, you make them believe.",
    body: `
      <h3>Learn (5 min)</h3>
      <p>Anatomy of a good pitch: <strong>hook</strong> → <strong>problem</strong> (make them feel it) → <strong>solution</strong> → <strong>how it works</strong> (3 steps max) → <strong>traction</strong> → <strong>business model</strong> → <strong>the ask</strong>.</p>
      <p>Key concept: <strong>storytelling beats statistics</strong>. Investors invest in founders, not spreadsheets.</p>

      <h3>Do (30 min)</h3>
      <p><strong>🎯 Seven-slide deck</strong>: Title (name + tagline) · Problem (Day 1) · Solution (show your MVP) · How It Works (3 steps) · Market (persona + napkin math) · Business Model (money + growth) · The Ask (be specific).</p>
      <p><strong>🎙️ 60-second pitch script</strong> — hook 10s, problem 10s, solution 15s, how it works 10s, why now / why you 10s, the ask 5s.</p>
      <p><strong>📊 Self-grade your journey</strong> — what surprised you most, what was hardest, would you actually build this for real, which business role excited you most (product, marketing, finance, sales), and how interested are you in entrepreneurship now on a 1–10 scale.</p>
    `,
    deliverables: [
      "7-slide pitch deck — describe it or paste the link",
      "60-second pitch script",
      "Self-reflection — all five answers",
    ],
    careers: "CEO / Founder · Sales / BD",
  },
];

// --- Rows ------------------------------------------------------------------
const mapRow = {
  id: MAP_ID,
  title: "LaunchPad — Startup Trial",
  description:
    "A 6-day startup accelerator you can run from your phone. Spot a real problem, find your customer, model the business, ship an ugly MVP, get your first users, and pitch it. ~30–45 min a day.",
  creator_id: null,
  difficulty: 2,
  // `learning_maps.category` is constrained to ai | 3d | unity | hacking | custom.
  category: "custom",
  visibility: "public",
  map_type: "public",
  metadata: {
    source: "curriculum/pathlab/startup/README.md",
    audience: "Grade 9–11",
    days: DAYS.length,
    minutes_per_day: "30–45",
  },
};

const nodeRows = DAYS.map((day, i) => ({
  id: nodeId(day.n),
  map_id: MAP_ID,
  title: day.title,
  instructions: day.hook,
  difficulty: Math.min(3, Math.ceil(day.n / 2)),
  sprite_url: SPRITES[i % SPRITES.length],
  node_type: day.n === DAYS.length ? "end" : "learning",
  metadata: {
    day: day.n,
    theme: day.theme,
    careers: day.careers,
    // Explicit layout so the non-trail canvas doesn't scatter the days.
    position: { x: 240, y: i * 220 },
  },
}));

const pathRows = DAYS.slice(0, -1).map((day) => ({
  id: pathId(day.n),
  source_node_id: nodeId(day.n),
  destination_node_id: nodeId(day.n + 1),
}));

const contentRows = DAYS.map((day) => ({
  id: contentId(day.n),
  node_id: nodeId(day.n),
  content_type: "text",
  content_title: day.title,
  content_body: `<p><em>${day.theme}</em></p><blockquote>${day.hook}</blockquote>${day.body}`,
  content_url: null,
  display_order: 0,
}));

// One open-response assessment per day. `is_graded: false` keeps the student
// moving on submit; a mentor can still read and grade every submission later.
const assessmentRows = DAYS.map((day) => ({
  id: assessmentId(day.n),
  node_id: nodeId(day.n),
  assessment_type: "text_answer",
  points_possible: day.deliverables.length,
  is_graded: false,
  metadata: {
    prompt:
      `Hand in your Day ${day.n} work:\n` +
      day.deliverables.map((d) => `• ${d}`).join("\n"),
    allow_multiple_attempts: true,
    max_attempts: 3,
  },
}));

const lobbyRow = {
  id: LOBBY_ID,
  map_id: MAP_ID,
  name: "LaunchPad — Squad 1",
  join_code: LOBBY_CODE,
  is_open: true,
  created_by: null,
};

// --- Upserts (in FK dependency order) --------------------------------------
async function upsert(table, rows) {
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");
  if (error) {
    console.error(`❌ Upsert into ${table} failed:`, error.message);
    console.error(`   details: ${error.details || "(none)"} | hint: ${error.hint || "(none)"}`);
    process.exit(1);
  }
  console.log(`✅ ${table}: ${data.length} row(s) upserted`);
  return data.length;
}

console.log(`Seeding LaunchPad startup PathLab into ${supabaseUrl} ...\n`);

const counts = {};
counts.learning_maps = await upsert("learning_maps", [mapRow]);
counts.map_nodes = await upsert("map_nodes", nodeRows);
counts.node_paths = await upsert("node_paths", pathRows);
counts.node_content = await upsert("node_content", contentRows);
counts.node_assessments = await upsert("node_assessments", assessmentRows);
counts.map_lobbies = await upsert("map_lobbies", [lobbyRow]);

console.log("\n--- Summary ---");
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}
console.log(`\nMap URL:    /map/${MAP_ID}`);
console.log(`Lobby code: ${LOBBY_CODE}`);
