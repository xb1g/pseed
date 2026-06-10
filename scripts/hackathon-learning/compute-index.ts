/**
 * P2 rollup: fold per-submission plan-fidelity into the team/participant Learning Index,
 * and assign the Learning × Semifinal quadrant. Run AFTER compute-fidelity --write.
 *
 *   pnpm tsx scripts/hackathon-learning/compute-index.ts
 *
 * Learning Index = blend of plan-fidelity (substance), iteration, and engagement.
 * ai_likelihood is rolled up but kept as its OWN column — never folded into the index.
 */
import { Pool } from "pg";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// Per-team fidelity/ai aggregates: a team's own team-submissions + its members' individual subs.
const TEAM_SIGNALS_SQL = `
  WITH team_sig AS (
    SELECT s.team_id::text AS team_id, sig.grappling, sig.ai_likelihood
      FROM hackathon_submission_signals sig
      JOIN hackathon_phase_activity_team_submissions s
        ON s.id = sig.submission_id AND sig.submission_scope='team'
  ),
  indiv_sig AS (
    SELECT m.team_id::text AS team_id, sig.grappling, sig.ai_likelihood
      FROM hackathon_submission_signals sig
      JOIN hackathon_phase_activity_submissions s
        ON s.id = sig.submission_id AND sig.submission_scope='individual'
      JOIN hackathon_team_members m ON m.participant_id = s.participant_id
  ),
  combined AS (
    SELECT * FROM team_sig UNION ALL SELECT * FROM indiv_sig
  )
  SELECT team_id,
         avg(grappling)        AS fidelity,
         avg(ai_likelihood)    AS ai_likelihood,
         count(*)              AS scored_subs
    FROM combined GROUP BY team_id`;

// Phase-3 cycle rigor per team (scope='phase3_cycle'); grappling = cycle total/100.
const TEAM_PHASE3_SQL = `
  SELECT team_id::text AS team_id,
         avg(grappling)                              AS cycle_rigor,
         count(*)                                    AS cycles,
         bool_or((signals->>'honest_wrongness')::boolean) AS any_honest
    FROM hackathon_submission_signals
   WHERE submission_scope='phase3_cycle' AND team_id IS NOT NULL
   GROUP BY team_id`;

// Coverage per team: which phases they actually submitted in (for completion factor).
const TEAM_COVERAGE_SQL = `
  SELECT sig.team_id::text AS team_id,
         array_agg(DISTINCT pp.phase_number) FILTER (WHERE pp.phase_number IS NOT NULL) AS phases
    FROM hackathon_submission_signals sig
    JOIN hackathon_phase_activity_submissions ps ON ps.id = sig.submission_id AND sig.submission_scope='individual'
    JOIN hackathon_phase_activities a ON a.id = ps.activity_id
    JOIN hackathon_program_phases pp ON pp.id = a.phase_id
   WHERE sig.team_id IS NOT NULL
   GROUP BY sig.team_id`;

function normalizer(vals: number[]): (v: number) => number {
  const xs = vals.filter((v) => Number.isFinite(v));
  const min = Math.min(...xs), max = Math.max(...xs);
  return (v: number) => (max > min ? (v - min) / (max - min) : 0.5);
}
function median(vals: number[]): number {
  const xs = vals.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  return xs.length ? xs[Math.floor(xs.length / 2)] : 0;
}

async function main() {
  const pg = new Pool({ connectionString: LOCAL_DB });
  try {
    const sig = new Map<string, { fidelity: number; ai: number; n: number }>();
    for (const r of (await pg.query(TEAM_SIGNALS_SQL)).rows) {
      sig.set(r.team_id, { fidelity: Number(r.fidelity), ai: Number(r.ai_likelihood), n: Number(r.scored_subs) });
    }
    const p3 = new Map<string, { rigor: number; cycles: number; honest: boolean }>();
    for (const r of (await pg.query(TEAM_PHASE3_SQL)).rows) {
      p3.set(r.team_id, { rigor: Number(r.cycle_rigor), cycles: Number(r.cycles), honest: !!r.any_honest });
    }
    const cov = new Map<string, number[]>();
    for (const r of (await pg.query(TEAM_COVERAGE_SQL)).rows) {
      cov.set(r.team_id, (r.phases ?? []).map(Number));
    }
    // population mean fidelity (submission-weighted) — shrinkage target for low-n teams.
    let wf = 0, wn = 0;
    for (const s of sig.values()) { wf += s.fidelity * s.n; wn += s.n; }
    const POP_MEAN = wn ? wf / wn : 0.6;
    const K = 5; // shrinkage strength: a team needs ~K submissions to "own" its average

    // existing behavioral team metrics
    const metrics = (await pg.query(
      `SELECT team_id::text, engagement_score, iteration_score, semifinal_total
         FROM hackathon_learning_metrics WHERE subject_type='team'`,
    )).rows;

    const nEng = normalizer(metrics.map((m) => Number(m.engagement_score)));
    const nIter = normalizer(metrics.map((m) => Number(m.iteration_score)));

    const updates = metrics.map((m) => {
      const s = sig.get(m.team_id);
      const c = p3.get(m.team_id);
      const rawFid = s ? s.fidelity : null;               // 0..1 raw plan-fidelity (what they did)
      const n = s ? s.n : 0;
      // low-n shrinkage: few submissions get pulled toward the population mean
      const fidelity = rawFid === null ? null : (n * rawFid + K * POP_MEAN) / (n + K);
      const rigor = c ? c.rigor : null;
      const ai = s ? s.ai : null;

      // quality blend (0..1)
      const parts: Array<[number, number]> = [];
      if (fidelity !== null) parts.push([0.45, fidelity]);
      if (rigor !== null) parts.push([0.25, rigor]);
      parts.push([0.18, nIter(Number(m.iteration_score))]);
      parts.push([0.12, nEng(Number(m.engagement_score))]);
      const wsum = parts.reduce((a, [w]) => a + w, 0);
      const quality = parts.reduce((a, [w, v]) => a + w * v, 0) / wsum;

      // completion factor: how far through the program they actually went
      const phases = cov.get(m.team_id) ?? [];
      const didP1 = phases.includes(1), didP2 = phases.includes(2);
      const didP3 = (c?.cycles ?? 0) > 0;
      const didSemi = m.semifinal_total !== null;
      const completion = 0.25 * (didP1 ? 1 : 0) + 0.35 * (didP2 ? 1 : 0)
                       + 0.25 * (didP3 ? 1 : 0) + 0.15 * (didSemi ? 1 : 0);
      // finishers rewarded: completion scales 0.3..1.0 of quality (never fully zeroes a real submission)
      const learning = quality * (0.3 + 0.7 * completion) * 100;

      return {
        team_id: m.team_id,
        grappling: rawFid === null ? null : Math.round(rawFid * 1000) / 10, // table shows RAW fidelity
        ai_likelihood: ai === null ? null : Math.round(ai * 1000) / 10,
        learning_index: Math.round(learning * 10) / 10,
        completion: Math.round(completion * 100),
        semifinal_total: num(m.semifinal_total),
        scored: n,
        cycles: c?.cycles ?? 0,
        honest: c?.honest ?? false,
      };
    });

    // Quadrant vs semifinal (only teams with a semifinal score)
    const finalists = updates.filter((u) => u.semifinal_total !== null);
    const medLearn = median(finalists.map((u) => u.learning_index));
    const medSemi = median(finalists.map((u) => u.semifinal_total as number));
    const quadrant = (u: typeof updates[number]) => {
      if (u.semifinal_total === null) return null;
      const hiL = u.learning_index >= medLearn, hiS = (u.semifinal_total as number) >= medSemi;
      return hiL && hiS ? "grew_delivered" : hiL && !hiS ? "undervalued_growth"
           : !hiL && hiS ? "polished_coaster" : "disengaged";
    };

    await pg.query("BEGIN");
    for (const u of updates) {
      await pg.query(
        `UPDATE hackathon_learning_metrics
            SET grappling_score=$2, ai_likelihood=$3, learning_index=$4, quadrant=$5,
                evidence = evidence || $6::jsonb, computed_at=now()
          WHERE subject_type='team' AND team_id=$1`,
        [u.team_id, u.grappling, u.ai_likelihood, u.learning_index, quadrant(u),
         JSON.stringify({ phase3_cycles: u.cycles, honest_wrongness: u.honest, completion: u.completion, scored_subs: u.scored })],
      );
    }
    await pg.query("COMMIT");

    console.log(`✅ updated ${updates.length} teams · ${finalists.length} with semifinal`);
    console.log(`   medians: learning=${medLearn.toFixed(1)} semifinal=${medSemi.toFixed(1)}\n`);
    console.log("Finalists by quadrant (learning_index / semifinal):");
    const order = ["undervalued_growth", "grew_delivered", "polished_coaster", "disengaged"];
    const labeled = (await pg.query(
      `SELECT lm.learning_index, lm.grappling_score, lm.ai_likelihood, lm.semifinal_total, lm.quadrant,
              lm.evidence->>'label' AS team
         FROM hackathon_learning_metrics lm
        WHERE subject_type='team' AND semifinal_total IS NOT NULL`,
    )).rows;
    for (const q of order) {
      console.log(`\n  [${q}]`);
      for (const r of labeled.filter((x) => x.quadrant === q).sort((a, b) => b.learning_index - a.learning_index)) {
        console.log(`    L=${Number(r.learning_index).toFixed(1).padStart(5)}  fid=${r.grappling_score ?? "-"}  ai=${r.ai_likelihood ?? "-"}  semi=${Number(r.semifinal_total).toFixed(1)}  ${r.team}`);
      }
    }
  } finally {
    await pg.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
