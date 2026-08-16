/**
 * P2b: Phase 3 cycle-rigor scoring → hackathon_submission_signals (scope='phase3_cycle').
 *
 *   # preview:
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-phase3.ts --limit=8 --model=vertex:gemini-3.5-flash
 *   # full write:
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-phase3.ts --write --model=vertex:gemini-3.5-flash
 *
 * Scores each Phase-3 cycle on the existing 5-dim rubric (hypothesis_quality, variable_isolation,
 * behavioral_evidence, tester_freshness, synthesis_honesty). Fresh analysis — ignores the bad
 * ai_score/mentor_score already on the row. The deepest "did they really experiment & learn from
 * being wrong" signal. ~132 cycles across ~50 teams.
 */
import { Pool } from "pg";
import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/modelRegistry";
import { formatCycleForPrompt } from "@/lib/hackathon/phase3-grading";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const WRITE = process.argv.includes("--write");
const LIMIT = arg("limit") ? Number(arg("limit")) : undefined;
const MODEL = arg("model") ?? "vertex:gemini-3.5-flash";
const CONC = arg("conc") ? Number(arg("conc")) : 5;
const VERTEX_KEY = process.env.VERTEX_API_KEY ?? "";

const RUBRIC = `Score each dimension 0-20 (total 0-100):
- hypothesis_quality (0-20): Is the hypothesis falsifiable, specific, and non-obvious?
- variable_isolation (0-20): Did they change exactly ONE variable vs the prior cycle?
- behavioral_evidence (0-20): Concrete behavioral observations, not just opinions?
- tester_freshness (0-20): Testing with fresh testers (not friends/team members)?
- synthesis_honesty (0-20): Honest reporting, including negative results and being wrong?`;

const SYSTEM =
  "You are a rigorous learning analyst grading a hackathon team's Phase-3 experiment cycle " +
  "(an iterative hypothesis-test loop). Reward genuine experimentation and intellectual honesty " +
  "(admitting they were wrong), not polish. Submissions may be in Thai. Score strictly per the rubric.";

const Result = z.object({
  hypothesis_quality: z.number().min(0).max(20),
  variable_isolation: z.number().min(0).max(20),
  behavioral_evidence: z.number().min(0).max(20),
  tester_freshness: z.number().min(0).max(20),
  synthesis_honesty: z.number().min(0).max(20),
  total: z.number().min(0).max(100),
  honest_wrongness: z.boolean().describe("Did the team genuinely admit something they got wrong?"),
  rationale: z.string().describe("1-2 sentences citing concrete evidence from the cycle."),
});
type R = z.infer<typeof Result>;

const VSCHEMA = {
  type: "OBJECT",
  properties: {
    hypothesis_quality: { type: "NUMBER" }, variable_isolation: { type: "NUMBER" },
    behavioral_evidence: { type: "NUMBER" }, tester_freshness: { type: "NUMBER" },
    synthesis_honesty: { type: "NUMBER" }, total: { type: "NUMBER" },
    honest_wrongness: { type: "BOOLEAN" }, rationale: { type: "STRING" },
  },
  required: ["hypothesis_quality", "variable_isolation", "behavioral_evidence", "tester_freshness",
             "synthesis_honesty", "total", "honest_wrongness", "rationale"],
};

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let e: unknown;
  for (let i = 0; i < n; i++) { try { return await fn(); } catch (err) { e = err; await new Promise((r) => setTimeout(r, 400 * (i + 1))); } }
  throw e;
}

async function callModel(prompt: string): Promise<R> {
  if (MODEL.startsWith("vertex:")) {
    const id = MODEL.slice("vertex:".length);
    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${id}:generateContent?key=${VERTEX_KEY}`;
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: VSCHEMA, temperature: 0.3 },
      }),
    });
    if (!res.ok) throw new Error(`vertex ${res.status}: ${(await res.text()).slice(0, 140)}`);
    const t = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
    return Result.parse(JSON.parse(t));
  }
  const { object } = await generateObject({ model: getLanguageModel(MODEL), schema: Result, system: SYSTEM, prompt });
  return object;
}

async function main() {
  const pg = new Pool({ connectionString: LOCAL_DB, max: Math.max(4, CONC) });
  try {
    let cycles = (await pg.query(`
      SELECT c.*, t.name AS team_name
        FROM hackathon_phase3_cycles c
        LEFT JOIN hackathon_teams t ON t.id = c.team_id
       ORDER BY c.team_id, c.cycle_number`)).rows;
    if (LIMIT) cycles = cycles.slice(0, LIMIT);
    const verbose = cycles.length <= 30;
    console.log(`Scoring ${cycles.length} Phase-3 cycles · conc=${CONC} · write=${WRITE} · model=${MODEL}\n`);

    const counts = { done: 0, err: 0 };
    let next = 0;
    async function worker() {
      while (next < cycles.length) {
        const c = cycles[next++];
        const prompt = `=== RUBRIC ===\n${RUBRIC}\n\n=== CYCLE ===\n${formatCycleForPrompt(c)}\n\nScore this cycle.`;
        let r: R;
        try { r = await withRetry(() => callModel(prompt)); }
        catch (e) { console.error(`  err cycle ${c.id.slice(0, 8)}: ${(e as Error).message}`); counts.err++; continue; }
        counts.done++;
        if (verbose) console.log(`  total=${String(r.total).padStart(3)} honest=${r.honest_wrongness ? "Y" : "n"}  ${(c.team_name ?? "").slice(0, 24).padEnd(24)} c#${c.cycle_number} | ${r.rationale.slice(0, 80)}`);
        if (WRITE) {
          await pg.query(
            `INSERT INTO hackathon_submission_signals
               (submission_id, submission_scope, team_id, grappling, signals, computed_at)
             VALUES ($1,'phase3_cycle',$2,$3,$4, now())
             ON CONFLICT (submission_id, submission_scope)
             DO UPDATE SET grappling=EXCLUDED.grappling, signals=EXCLUDED.signals, computed_at=now()`,
            [c.id, c.team_id, r.total / 100, JSON.stringify(r)],
          );
        }
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    console.log(`\n✅ scored=${counts.done} errors=${counts.err}`);
  } finally { await pg.end(); }
}

main().catch((e) => { console.error(e); process.exit(1); });
