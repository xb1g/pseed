/**
 * P2 plan-fidelity + independent AI-likelihood per submission.
 *
 *   # preview a sample (no DB write) to validate the signal:
 *   pnpm tsx scripts/hackathon-learning/compute-fidelity.ts --activity=1 --phase=2 --limit=12
 *   # full pass, persist to hackathon_submission_signals (LOCAL):
 *   pnpm tsx scripts/hackathon-learning/compute-fidelity.ts --write
 *
 * Grades each submission against ITS activity spec (lib/hackathon/phase-specs): which
 * "what to look for" criteria are met, which red flags are hit, proximity to the strong/weak
 * exemplar. This is purpose-built analysis — it does NOT reuse the old ai-grader verdicts.
 * ai_likelihood is estimated independently in the same call and kept in its own column.
 */
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/modelRegistry";
import { getActivitySpec, formatActivitySpecForPrompt } from "@/lib/hackathon/phase-specs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SRC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SRC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const WRITE = process.argv.includes("--write");
const LIMIT = arg("limit") ? Number(arg("limit")) : undefined;
const ONLY_PHASE = arg("phase") ? Number(arg("phase")) : undefined;
const ONLY_ORDER = arg("activity") ? Number(arg("activity")) : undefined;
const MODEL = arg("model");
const CONC = arg("conc") ? Number(arg("conc")) : 6;

const Result = z.object({
  plan_fidelity: z.number().min(0).max(1).describe("How well the submission fulfills THIS activity's specific learning goal — not length, not writing polish."),
  criteria_met: z.array(z.string()).describe("Which 'what to look for' items are satisfied (short labels)."),
  criteria_missed: z.array(z.string()),
  red_flags_hit: z.array(z.string()).describe("Which red flags are present."),
  exemplar_proximity: z.enum(["strong", "mixed", "weak"]),
  rationale: z.string().describe("1-2 sentences citing concrete evidence from the submission."),
  ai_likelihood: z.number().min(0).max(1).describe("INDEPENDENT estimate: probability the text was AI-generated. Judge separately from fidelity — using AI well does not lower fidelity."),
  ai_signals: z.array(z.string()).describe("Markers behind the ai_likelihood estimate."),
});

// Model resolution kept LOCAL to this analytics script (shared modelRegistry untouched).
// kimi-k2 / groq -> Kimi-K2 on Groq (free-ish, fast). deepseek* -> wired DeepSeek. else default.
function resolveModel() {
  const m = MODEL ?? "";
  if (m.startsWith("groq:")) {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY ?? "",
    });
    return groq(m.slice("groq:".length)); // e.g. groq:openai/gpt-oss-120b
  }
  if (m.startsWith("gemini")) {
    // Pass any Gemini id straight through (registry only maps a fixed allowlist).
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "" });
    return google(m);
  }
  return getLanguageModel(MODEL); // handles deepseek-chat, etc.
}

// generateObject retry — structured-output models intermittently return non-conforming JSON.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 400 * (i + 1))); }
  }
  throw lastErr;
}

// Vertex AI global endpoint accepts the GCP API key via ?key= (no OAuth/project needed).
// Used when --model=vertex:<id> (e.g. vertex:gemini-3.5-flash). Key from VERTEX_API_KEY env.
const VERTEX_KEY = process.env.VERTEX_API_KEY ?? "";
const VERTEX_SCHEMA = {
  type: "OBJECT",
  properties: {
    plan_fidelity: { type: "NUMBER" },
    criteria_met: { type: "ARRAY", items: { type: "STRING" } },
    criteria_missed: { type: "ARRAY", items: { type: "STRING" } },
    red_flags_hit: { type: "ARRAY", items: { type: "STRING" } },
    exemplar_proximity: { type: "STRING", enum: ["strong", "mixed", "weak"] },
    rationale: { type: "STRING" },
    ai_likelihood: { type: "NUMBER" },
    ai_signals: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["plan_fidelity", "criteria_met", "criteria_missed", "red_flags_hit",
             "exemplar_proximity", "rationale", "ai_likelihood", "ai_signals"],
};

async function vertexGenerate(system: string, prompt: string): Promise<z.infer<typeof Result>> {
  const modelId = (MODEL ?? "vertex:gemini-3.5-flash").slice("vertex:".length);
  const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${modelId}:generateContent?key=${VERTEX_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: VERTEX_SCHEMA, temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`vertex ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("vertex: empty response");
  return Result.parse(JSON.parse(text));
}

const SYSTEM =
  "You are a rigorous learning analyst for a Thai/English student hackathon. " +
  "Given an activity's spec (learning goal, what to look for, red flags, strong/weak exemplars) " +
  "and a student's submission, assess how well the submission fulfills the activity's SPECIFIC " +
  "intent. Reward genuine engagement with the problem; do not reward length or polish. " +
  "Separately and independently, estimate whether the text reads as AI-generated — this is a " +
  "neutral observation, NOT a penalty (students may use AI as a tool). Submissions may be in Thai.";

interface SubRow {
  id: string; text_answer: string | null; image_url: string | null;
  display_order: number; title: string; phase_number: number;
  owner: string | null; scope: "individual" | "team";
}

async function loadSubs(pg: Pool): Promise<SubRow[]> {
  const indiv = await pg.query(`
    SELECT s.id, s.text_answer, s.image_url, a.display_order, a.title,
           pp.phase_number, p.name AS owner, 'individual' AS scope
      FROM hackathon_phase_activity_submissions s
      JOIN hackathon_phase_activities a ON a.id = s.activity_id
      LEFT JOIN hackathon_program_phases pp ON pp.id = a.phase_id
      LEFT JOIN hackathon_participants p ON p.id = s.participant_id
     WHERE s.status='submitted' AND COALESCE(s.text_answer,'') <> ''`);
  const team = await pg.query(`
    SELECT s.id, s.text_answer, s.image_url, a.display_order, a.title,
           pp.phase_number, t.name AS owner, 'team' AS scope
      FROM hackathon_phase_activity_team_submissions s
      JOIN hackathon_phase_activities a ON a.id = s.activity_id
      LEFT JOIN hackathon_program_phases pp ON pp.id = a.phase_id
      LEFT JOIN hackathon_teams t ON t.id = s.team_id
     WHERE s.status='submitted' AND COALESCE(s.text_answer,'') <> ''`);
  return [...indiv.rows, ...team.rows]
    .map((r) => ({
      id: r.id, text_answer: r.text_answer, image_url: r.image_url,
      display_order: r.display_order, title: r.title,
      phase_number: r.phase_number ?? 0, owner: r.owner,
      scope: r.scope as "individual" | "team",
    }))
    .filter((r) => (!ONLY_PHASE || r.phase_number === ONLY_PHASE) && (!ONLY_ORDER || r.display_order === ONLY_ORDER));
}

async function score(sub: SubRow) {
  const spec = await getActivitySpec(sub.phase_number, sub.display_order, sub.title);
  if (!spec) return null;
  const specBlock = formatActivitySpecForPrompt(spec);
  const prompt =
    `=== ACTIVITY SPEC ===\n${specBlock}\n\n` +
    `=== STUDENT SUBMISSION (activity: ${sub.title}) ===\n${sub.text_answer}\n\n` +
    `Score plan_fidelity against the spec above, and estimate ai_likelihood independently.`;
  if ((MODEL ?? "").startsWith("vertex:")) {
    return withRetry(() => vertexGenerate(SYSTEM, prompt));
  }
  const { object } = await withRetry(() =>
    generateObject({ model: resolveModel(), schema: Result, system: SYSTEM, prompt }),
  );
  return object;
}

async function processOne(pg: Pool, sub: SubRow, verbose: boolean): Promise<"done" | "skip" | "err"> {
  let res;
  try { res = await score(sub); }
  catch (e) { console.error(`  err ${sub.id.slice(0, 8)}: ${(e as Error).message}`); return "err"; }
  if (!res) return "skip";
  if (verbose) {
    const owner = (sub.owner ?? sub.id.slice(0, 8)).slice(0, 22);
    console.log(
      `  fid=${res.plan_fidelity.toFixed(2)} ${res.exemplar_proximity.padEnd(6)} ` +
      `met=${res.criteria_met.length} flags=${res.red_flags_hit.length} ` +
      `ai=${res.ai_likelihood.toFixed(2)}  ${owner.padEnd(22)} | ${res.rationale.slice(0, 90)}`,
    );
  }
  if (WRITE) {
    await pg.query(
      `INSERT INTO hackathon_submission_signals
         (submission_id, submission_scope, grappling, ai_likelihood, signals, computed_at)
       VALUES ($1,$2,$3,$4,$5, now())
       ON CONFLICT (submission_id, submission_scope)
       DO UPDATE SET grappling=EXCLUDED.grappling, ai_likelihood=EXCLUDED.ai_likelihood,
                     signals=EXCLUDED.signals, computed_at=now()`,
      [sub.id, sub.scope, res.plan_fidelity, res.ai_likelihood, JSON.stringify(res)],
    );
  }
  return "done";
}

async function main() {
  const pg = new Pool({ connectionString: LOCAL_DB, max: Math.max(4, CONC) });
  try {
    let subs = await loadSubs(pg);
    if (LIMIT) subs = subs.slice(0, LIMIT);
    const verbose = subs.length <= 40;
    console.log(`Scoring ${subs.length} submissions · conc=${CONC} · write=${WRITE} · model=${MODEL ?? "default"}\n`);

    const counts = { done: 0, skip: 0, err: 0 };
    let next = 0, completed = 0;
    async function worker() {
      while (next < subs.length) {
        const sub = subs[next++];
        counts[await processOne(pg, sub, verbose)]++;
        if (!verbose && ++completed % 50 === 0) {
          console.log(`  …${completed}/${subs.length}  (done=${counts.done} skip=${counts.skip} err=${counts.err})`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    console.log(`\n✅ scored=${counts.done} skipped(no spec)=${counts.skip} errors=${counts.err}`);
  } finally {
    await pg.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
