/**
 * P4: Phase 4 / Round 1 video-pitch scoring → hackathon_submission_signals (scope='phase4_video').
 *
 *   # extract videos from the form CSV first:
 *   python3 scripts/hackathon-learning/extract_videos.py "<csv>" > /tmp/videos.json
 *
 *   # preview (read + grade a few, no DB write):
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-video.ts --videos=/tmp/videos.json --limit=3 --model=vertex:gemini-3.5-flash
 *   # full write:
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-video.ts --videos=/tmp/videos.json --write --model=vertex:gemini-3.5-flash
 *
 * gemini-3.5-flash reads the YouTube video natively (fileData {fileUri, mimeType}). ONE call per
 * video: watch it, grade on the pitch rubric (story/evidence/delivery), flag AI-likelihood, and —
 * the part the user asked for — emit a one-line `journey_summary` of how the team's idea evolved
 * (e.g. "started X, pivoted to Y after interviews"). Reads team text context (problem + thai_desc)
 * from the CSV alongside the video so the journey line is grounded, not invented.
 *
 * Two independent scores preserved: `total` (pitch quality, grappling=total/100) and `ai_likelihood`
 * (0-100, stored in signals, never folded into quality).
 */
import { readFileSync } from "fs";
import { Pool } from "pg";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const WRITE = process.argv.includes("--write");
const LIMIT = arg("limit") ? Number(arg("limit")) : undefined;
const MODEL = arg("model") ?? "vertex:gemini-3.5-flash";
const CONC = arg("conc") ? Number(arg("conc")) : 3;
const VIDEOS = arg("videos") ?? "/tmp/videos.json";
const VERTEX_KEY = process.env.VERTEX_API_KEY ?? "";

interface VideoRow {
  team: string;
  league?: string;
  project?: string;
  track?: string;
  video_url: string;
  prototype?: string;
  problem?: string;
  thai_desc?: string;
}

const RUBRIC = `Score the video pitch (total 0-100):
- story_clarity (0-30): Is the problem→solution narrative clear and coherent? Does it tell a real journey?
- evidence_integration (0-40): Does the pitch show real user evidence — interviews, prototype demo, tester reactions — not just claims?
- delivery (0-30): Confident, well-structured delivery; the video actually demonstrates the product working.`;

const SYSTEM =
  "You are a rigorous learning analyst reviewing a hackathon team's Round-1 video pitch. " +
  "Watch the entire video. Reward teams that show genuine user research and a working prototype, " +
  "and that honestly describe how their idea changed; do not reward polished slides with no evidence. " +
  "Videos and on-screen text may be in Thai. Score strictly per the rubric.";

// Vertex structured-output schema.
const VSCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    journey_summary: { type: "STRING" },
    problem_shown: { type: "BOOLEAN" },
    solution_shown: { type: "BOOLEAN" },
    demo_shown: { type: "BOOLEAN" },
    story_clarity: { type: "NUMBER" },
    evidence_integration: { type: "NUMBER" },
    delivery: { type: "NUMBER" },
    total: { type: "NUMBER" },
    ai_likelihood: { type: "NUMBER" },
    rationale: { type: "STRING" },
  },
  required: [
    "summary", "journey_summary", "problem_shown", "solution_shown", "demo_shown",
    "story_clarity", "evidence_integration", "delivery", "total", "ai_likelihood", "rationale",
  ],
};

interface Result {
  summary: string;
  journey_summary: string;
  problem_shown: boolean;
  solution_shown: boolean;
  demo_shown: boolean;
  story_clarity: number;
  evidence_integration: number;
  delivery: number;
  total: number;
  ai_likelihood: number;
  rationale: string;
}

// --- team-name resolution (mirrors import-semifinal.ts) ---
const NAME_OVERRIDES: Record<string, string> = {
  "แล้วแต่จะคิด ชีวิตคนละแบบ": "แล้วแต่เลย ชีวิตคนละแบบ",
};
function normKey(s: string): string {
  return s.normalize("NFKC").replace(/\p{C}/gu, "").toLowerCase().replace(/\s+/g, "").trim();
}
function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
}
function resolveTeam(raw: string, teams: { id: string; name: string }[]) {
  const ov = NAME_OVERRIDES[raw];
  if (ov) { const t = teams.find((t) => normKey(t.name) === normKey(ov)); if (t) return { id: t.id, name: t.name, method: "manual" }; }
  const k = normKey(raw);
  const exact = teams.filter((t) => normKey(t.name) === k);
  if (exact.length === 1) return { id: exact[0].id, name: exact[0].name, method: "exact" };
  let best: { id: string; name: string } | null = null, bestR = 0;
  for (const t of teams) { const r = ratio(k, normKey(t.name)); if (r > bestR) { bestR = r; best = t; } }
  if (best && bestR >= 0.82) return { id: best.id, name: best.name, method: `fuzzy:${bestR.toFixed(2)}` };
  return { id: null as string | null, name: "", method: "unresolved" };
}

function normalizeYouTube(u: string): string {
  // gemini fileUri wants a canonical watch URL. Decode wrapper redirects (instagram l.instagram.com,
  // percent-encoded youtu.be) and strip ?si=/shorturl form.
  let s = u;
  try { s = decodeURIComponent(u); } catch { /* keep raw */ }
  const m = s.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : s;
}

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let e: unknown;
  for (let i = 0; i < n; i++) { try { return await fn(); } catch (err) { e = err; await new Promise((r) => setTimeout(r, 800 * (i + 1))); } }
  throw e;
}

async function gradeVideo(v: VideoRow): Promise<Result> {
  const id = MODEL.slice("vertex:".length);
  const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${id}:generateContent?key=${VERTEX_KEY}`;
  const ctx = [
    v.project && `Project: ${v.project}`,
    v.track && `Track: ${v.track}`,
    v.problem && `Problem (team-written): ${v.problem}`,
    v.thai_desc && `Description (team-written): ${v.thai_desc}`,
  ].filter(Boolean).join("\n");
  const prompt =
    `=== RUBRIC ===\n${RUBRIC}\n\n=== TEAM CONTEXT (text from their submission form) ===\n${ctx || "(none)"}\n\n` +
    `Watch the video, then: score the rubric; estimate ai_likelihood (0-100, how likely the pitch/script/visuals are AI-generated rather than the team's own work); ` +
    `write a one-line journey_summary of how their idea evolved (what they started with vs. where they ended, and what changed their mind — e.g. interviews/tests). If the video doesn't reveal a pivot, state the core idea plainly.`;

  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{
        role: "user",
        parts: [
          { fileData: { fileUri: normalizeYouTube(v.video_url), mimeType: "video/*" } },
          { text: prompt },
        ],
      }],
      generationConfig: { responseMimeType: "application/json", responseSchema: VSCHEMA, temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`vertex ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const t = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) throw new Error("empty candidate");
  return JSON.parse(t) as Result;
}

async function main() {
  let videos = JSON.parse(readFileSync(VIDEOS, "utf-8")) as VideoRow[];
  if (LIMIT) videos = videos.slice(0, LIMIT);
  const pg = new Pool({ connectionString: LOCAL_DB, max: Math.max(4, CONC) });
  try {
    const teams = (await pg.query(`SELECT id, name FROM hackathon_teams`)).rows as { id: string; name: string }[];
    console.log(`Grading ${videos.length} videos · conc=${CONC} · write=${WRITE} · model=${MODEL}\n`);

    const counts = { done: 0, err: 0, unresolved: 0 };
    let next = 0;
    async function worker() {
      while (next < videos.length) {
        const v = videos[next++];
        const tm = resolveTeam(v.team, teams);
        if (!tm.id) { console.error(`  unresolved team: ${v.team}`); counts.unresolved++; continue; }
        let r: Result;
        try { r = await withRetry(() => gradeVideo(v)); }
        catch (e) { console.error(`  err ${v.team}: ${(e as Error).message}`); counts.err++; continue; }
        counts.done++;
        console.log(
          `  total=${String(r.total).padStart(3)} ai=${String(r.ai_likelihood).padStart(3)} ` +
          `demo=${r.demo_shown ? "Y" : "n"}  ${tm.name.slice(0, 22).padEnd(22)} [${tm.method}]\n` +
          `      journey: ${r.journey_summary}`,
        );
        if (WRITE) {
          await pg.query(
            `INSERT INTO hackathon_submission_signals
               (submission_id, submission_scope, team_id, grappling, signals, computed_at)
             VALUES ($1,'phase4_video',$1,$2,$3, now())
             ON CONFLICT (submission_id, submission_scope)
             DO UPDATE SET grappling=EXCLUDED.grappling, signals=EXCLUDED.signals, computed_at=now()`,
            [tm.id, r.total / 100, JSON.stringify({ ...r, video_url: v.video_url })],
          );
        }
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    console.log(`\n✅ graded=${counts.done} errors=${counts.err} unresolved=${counts.unresolved}`);
  } finally { await pg.end(); }
}

main().catch((e) => { console.error(e); process.exit(1); });
