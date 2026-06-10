/**
 * P5: Cross-phase team journey → hackathon_learning_metrics.journey_summary.
 *
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-journey.ts --limit=5 --model=vertex:gemini-3.5-flash
 *   VERTEX_API_KEY=... pnpm tsx scripts/hackathon-learning/compute-journey.ts --write --model=vertex:gemini-3.5-flash
 *
 * For each team, gather the FULL corpus of their work — Phase 1-2 submission text (individual +
 * team, ordered by phase/activity), Phase 3 experiment cycles (the pivots), and the Round-1 video
 * summary — and synthesize ONE line of how their idea actually evolved: what they started with,
 * what changed it (interviews/tests/cycles), where they ended. Grounded across every phase, not
 * just the pitch. Text-only call (cheap) since the video was already watched in compute-video.
 */
import { Pool } from "pg";
import { formatCycleForPrompt } from "@/lib/hackathon/phase3-grading";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const WRITE = process.argv.includes("--write");
const LIMIT = arg("limit") ? Number(arg("limit")) : undefined;
const MODEL = arg("model") ?? "vertex:gemini-3.5-flash";
const CONC = arg("conc") ? Number(arg("conc")) : 4;
const VERTEX_KEY = process.env.VERTEX_API_KEY ?? "";

const SYSTEM =
  "You are a learning analyst tracing how a hackathon team's idea evolved across the whole program. " +
  "You are given their work in order: Phase 1-2 worksheet answers, Phase 3 experiment cycles (hypothesis→test→synthesis), " +
  "and a Round-1 video recap. Identify the real arc: what they STARTED with, the specific thing that CHANGED their direction " +
  "(an interview insight, a failed test, a cycle result), and where they LANDED. If there was no pivot, say so and state the " +
  "core idea and how they validated it. The source work may be in Thai, but ALWAYS write the " +
  "journey_summary in English. Be concrete — name the trigger, not generic 'they iterated'.";

const VSCHEMA = {
  type: "OBJECT",
  properties: {
    journey_summary: { type: "STRING", description: "ONE sentence. Started X → changed by Y → landed Z." },
    pivoted: { type: "BOOLEAN" },
  },
  required: ["journey_summary", "pivoted"],
};

interface Corpus { teamId: string; name: string; blocks: string[]; }

async function callModel(prompt: string): Promise<{ journey_summary: string; pivoted: boolean }> {
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
  if (!res.ok) throw new Error(`vertex ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const t = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(t);
}

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let e: unknown;
  for (let i = 0; i < n; i++) { try { return await fn(); } catch (err) { e = err; await new Promise((r) => setTimeout(r, 600 * (i + 1))); } }
  throw e;
}

const clip = (s: string, n = 700) => (s.length > n ? s.slice(0, n) + "…" : s);

async function buildCorpus(pg: Pool): Promise<Corpus[]> {
  const teams = (await pg.query(
    `SELECT team_id, t.name FROM hackathon_learning_metrics m
       JOIN hackathon_teams t ON t.id = m.team_id
      WHERE m.subject_type='team' AND m.team_id IS NOT NULL`,
  )).rows as { team_id: string; name: string }[];

  // Phase 1-2 submissions (individual via team membership + team-level), ordered by phase/activity.
  const subs = (await pg.query(`
    SELECT tm.team_id, pp.phase_number, a.display_order, a.title, s.text_answer
      FROM hackathon_phase_activity_submissions s
      JOIN hackathon_team_members tm ON tm.participant_id = s.participant_id
      JOIN hackathon_phase_activities a ON a.id = s.activity_id
      LEFT JOIN hackathon_program_phases pp ON pp.id = a.phase_id
     WHERE s.status='submitted' AND COALESCE(s.text_answer,'') <> ''
    UNION ALL
    SELECT s.team_id, pp.phase_number, a.display_order, a.title, s.text_answer
      FROM hackathon_phase_activity_team_submissions s
      JOIN hackathon_phase_activities a ON a.id = s.activity_id
      LEFT JOIN hackathon_program_phases pp ON pp.id = a.phase_id
     WHERE s.status='submitted' AND COALESCE(s.text_answer,'') <> ''
    ORDER BY 2, 3`)).rows as { team_id: string; phase_number: number; display_order: number; title: string; text_answer: string }[];

  const cycles = (await pg.query(
    `SELECT * FROM hackathon_phase3_cycles ORDER BY team_id, cycle_number`,
  )).rows as Record<string, unknown>[];

  const videos = (await pg.query(
    `SELECT team_id, signals FROM hackathon_submission_signals WHERE submission_scope='phase4_video'`,
  )).rows as { team_id: string; signals: Record<string, unknown> }[];

  const byTeam = new Map<string, string[]>();
  const push = (id: string, block: string) => { const a = byTeam.get(id) ?? []; a.push(block); byTeam.set(id, a); };

  for (const s of subs)
    push(s.team_id, `[Phase ${s.phase_number ?? "?"} · ${s.title}] ${clip(s.text_answer)}`);
  for (const c of cycles)
    push(c.team_id as string, `[Phase 3 cycle #${c.cycle_number}]\n${clip(formatCycleForPrompt(c as never), 900)}`);
  for (const v of videos) {
    const sj = v.signals ?? {};
    const recap = [sj.summary, sj.journey_summary].filter(Boolean).join(" — ");
    if (recap) push(v.team_id, `[Round-1 video] ${clip(recap)}`);
  }

  return teams
    .map((t) => ({ teamId: t.team_id, name: t.name, blocks: byTeam.get(t.team_id) ?? [] }))
    .filter((c) => c.blocks.length > 0);
}

async function main() {
  const pg = new Pool({ connectionString: LOCAL_DB, max: Math.max(4, CONC) });
  try {
    let corpus = await buildCorpus(pg);
    if (LIMIT) corpus = corpus.slice(0, LIMIT);
    console.log(`Synthesizing journeys for ${corpus.length} teams · conc=${CONC} · write=${WRITE} · model=${MODEL}\n`);

    const counts = { done: 0, err: 0 };
    let next = 0;
    async function worker() {
      while (next < corpus.length) {
        const c = corpus[next++];
        const prompt =
          `Team: ${c.name}\n\n=== THEIR WORK IN ORDER ===\n${c.blocks.join("\n\n")}\n\n` +
          `Write the one-line journey_summary tracing how this idea evolved across the phases above.`;
        let r: { journey_summary: string; pivoted: boolean };
        try { r = await withRetry(() => callModel(prompt)); }
        catch (e) { console.error(`  err ${c.name}: ${(e as Error).message}`); counts.err++; continue; }
        counts.done++;
        console.log(`  ${r.pivoted ? "↪" : "→"} ${c.name.slice(0, 22).padEnd(22)} (${c.blocks.length} works) ${r.journey_summary}`);
        if (WRITE)
          await pg.query(
            `UPDATE hackathon_learning_metrics SET journey_summary=$2 WHERE team_id=$1 AND subject_type='team'`,
            [c.teamId, r.journey_summary],
          );
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    console.log(`\n✅ synthesized=${counts.done} errors=${counts.err}`);
  } finally { await pg.end(); }
}

main().catch((e) => { console.error(e); process.exit(1); });
