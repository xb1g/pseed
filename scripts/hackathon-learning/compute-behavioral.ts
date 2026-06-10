/**
 * P1 behavioral signals → hackathon_learning_metrics (LOCAL).
 *
 *   pnpm tsx scripts/hackathon-learning/compute-behavioral.ts
 *
 * Computes per-participant and per-team engagement from submission cadence, completion,
 * breadth, and (structural) iteration. Text/image/grappling signals + the full Learning
 * Index come in P2/P3 — those columns are left null here. ai_likelihood stays independent.
 * Denormalized labels live in evidence.label so the dashboard reads only this table.
 */
import { Client } from "pg";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

type Row = Record<string, number | string | null>;
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/** min-max normalize a metric across the population → 0..1 (0 if degenerate). */
function normalizer(rows: Row[], key: string): (v: number) => number {
  const vals = rows.map((r) => num(r[key]));
  const min = Math.min(...vals), max = Math.max(...vals);
  return (v: number) => (max > min ? (v - min) / (max - min) : 0);
}

const PARTICIPANT_SQL = `
  SELECT participant_id::text,
         count(*)                                            AS subs,
         count(*) FILTER (WHERE status='submitted')          AS submitted,
         count(DISTINCT activity_id)                         AS activities,
         COALESCE(sum(jsonb_array_length(revisions)),0)      AS revisions,
         count(*) FILTER (WHERE jsonb_array_length(revisions)>0) AS revised_subs,
         count(*) FILTER (WHERE COALESCE(text_answer,'')<>'')   AS with_text,
         count(*) FILTER (WHERE image_url IS NOT NULL OR COALESCE(array_length(file_urls,1),0)>0) AS with_image,
         EXTRACT(EPOCH FROM (max(submitted_at)-min(created_at)))/3600 AS span_hours
    FROM hackathon_phase_activity_submissions
   WHERE participant_id IS NOT NULL
   GROUP BY participant_id`;

// Team activity = the team's own team-submissions + the individual submissions of its members.
const TEAM_SQL = `
  WITH team_direct AS (
    SELECT team_id::text,
           count(*)                                        AS t_subs,
           count(*) FILTER (WHERE status='submitted')      AS t_submitted,
           count(DISTINCT activity_id)                     AS t_activities,
           COALESCE(sum(jsonb_array_length(revisions)),0)  AS t_revisions,
           count(*) FILTER (WHERE image_url IS NOT NULL OR COALESCE(array_length(file_urls,1),0)>0) AS t_with_image,
           min(created_at) AS t_first, max(submitted_at) AS t_last
      FROM hackathon_phase_activity_team_submissions
     WHERE team_id IS NOT NULL
     GROUP BY team_id
  ),
  member_roll AS (
    SELECT m.team_id::text,
           count(DISTINCT m.participant_id)                AS members,
           count(s.id)                                     AS m_subs,
           count(s.id) FILTER (WHERE s.status='submitted') AS m_submitted,
           count(DISTINCT s.activity_id)                   AS m_activities,
           COALESCE(sum(jsonb_array_length(s.revisions)),0) AS m_revisions,
           count(s.id) FILTER (WHERE s.image_url IS NOT NULL OR COALESCE(array_length(s.file_urls,1),0)>0) AS m_with_image,
           min(s.created_at) AS m_first, max(s.submitted_at) AS m_last
      FROM hackathon_team_members m
      LEFT JOIN hackathon_phase_activity_submissions s ON s.participant_id = m.participant_id
     GROUP BY m.team_id
  )
  SELECT t.id::text AS team_id, t.name AS team_name,
         COALESCE(mr.members,0)                          AS members,
         COALESCE(td.t_subs,0)+COALESCE(mr.m_subs,0)      AS subs,
         COALESCE(td.t_submitted,0)+COALESCE(mr.m_submitted,0) AS submitted,
         COALESCE(td.t_activities,0)+COALESCE(mr.m_activities,0) AS activities,
         COALESCE(td.t_revisions,0)+COALESCE(mr.m_revisions,0)   AS revisions,
         COALESCE(td.t_with_image,0)+COALESCE(mr.m_with_image,0) AS with_image,
         EXTRACT(EPOCH FROM (
            GREATEST(COALESCE(td.t_last,mr.m_last), COALESCE(mr.m_last,td.t_last))
          - LEAST(COALESCE(td.t_first,mr.m_first), COALESCE(mr.m_first,td.t_first))
         ))/3600 AS span_hours,
         sf.total AS semifinal_total
    FROM hackathon_teams t
    LEFT JOIN team_direct  td ON td.team_id = t.id::text
    LEFT JOIN member_roll  mr ON mr.team_id = t.id::text
    LEFT JOIN hackathon_semifinal_scores sf ON sf.team_id = t.id`;

function scoreTeam(rows: Row[]) {
  const nCompletion = (r: Row) => (num(r.subs) ? num(r.submitted) / num(r.subs) : 0);
  const nBreadth = normalizer(rows, "activities");
  const nIter = normalizer(
    rows.map((r) => ({ ...r, iter: num(r.subs) ? num(r.revisions) / num(r.subs) : 0 })),
    "iter",
  );
  const nImg = (r: Row) => (num(r.subs) ? num(r.with_image) / num(r.subs) : 0);
  const nSpan = normalizer(rows, "span_hours");
  return rows.map((r) => {
    const iter = num(r.subs) ? num(r.revisions) / num(r.subs) : 0;
    const engagement =
      0.30 * nCompletion(r) +
      0.25 * nBreadth(num(r.activities)) +
      0.20 * nIter(iter) +
      0.15 * nImg(r) +
      0.10 * nSpan(num(r.span_hours));
    return {
      team_id: r.team_id as string,
      team_name: r.team_name as string,
      members: num(r.members),
      engagement_score: Math.round(engagement * 1000) / 10, // 0..100
      iteration_score: Math.round(nIter(iter) * 1000) / 10,
      semifinal_total: r.semifinal_total === null ? null : num(r.semifinal_total),
      behavioral: {
        subs: num(r.subs), submitted: num(r.submitted), activities: num(r.activities),
        revisions: num(r.revisions), with_image: num(r.with_image),
        span_hours: Math.round(num(r.span_hours) * 10) / 10,
      },
    };
  });
}

async function main() {
  const pg = new Client({ connectionString: LOCAL_DB });
  await pg.connect();
  try {
    const teams = scoreTeam((await pg.query(TEAM_SQL)).rows);
    const participants = (await pg.query(PARTICIPANT_SQL)).rows;

    await pg.query("BEGIN");
    await pg.query("DELETE FROM hackathon_learning_metrics");

    for (const t of teams) {
      await pg.query(
        `INSERT INTO hackathon_learning_metrics
           (subject_type, team_id, iteration_score, engagement_score, semifinal_total, behavioral, evidence)
         VALUES ('team',$1,$2,$3,$4,$5,$6)`,
        [t.team_id, t.iteration_score, t.engagement_score, t.semifinal_total,
         JSON.stringify(t.behavioral), JSON.stringify({ label: t.team_name, members: t.members })],
      );
    }
    // participant rows: structural engagement only (completion×breadth×iteration), normalized
    const pn = {
      breadth: normalizer(participants, "activities"),
      iter: normalizer(
        participants.map((r) => ({ ...r, it: num(r.subs) ? num(r.revisions) / num(r.subs) : 0 })),
        "it",
      ),
    };
    for (const r of participants) {
      const completion = num(r.subs) ? num(r.submitted) / num(r.subs) : 0;
      const it = num(r.subs) ? num(r.revisions) / num(r.subs) : 0;
      const eng = 0.4 * completion + 0.35 * pn.breadth(num(r.activities)) + 0.25 * pn.iter(it);
      await pg.query(
        `INSERT INTO hackathon_learning_metrics
           (subject_type, participant_id, iteration_score, engagement_score, behavioral)
         VALUES ('participant',$1,$2,$3,$4)`,
        [r.participant_id, Math.round(pn.iter(it) * 1000) / 10, Math.round(eng * 1000) / 10,
         JSON.stringify({ subs: num(r.subs), submitted: num(r.submitted), activities: num(r.activities), revisions: num(r.revisions) })],
      );
    }
    await pg.query("COMMIT");

    const ranked = teams.filter((t) => t.behavioral.subs > 0).sort((a, b) => b.engagement_score - a.engagement_score);
    console.log(`✅ wrote ${teams.length} team + ${participants.length} participant metric rows\n`);
    console.log("Top 12 teams by engagement (· = has semifinal):");
    for (const t of ranked.slice(0, 12)) {
      const sf = t.semifinal_total !== null ? `sf=${t.semifinal_total}` : "  -  ";
      console.log(`  ${t.engagement_score.toFixed(1).padStart(5)}  iter=${t.iteration_score.toFixed(1).padStart(4)}  ${sf.padEnd(9)}  ${t.team_name}`);
    }
  } catch (e) {
    await pg.query("ROLLBACK"); throw e;
  } finally {
    await pg.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
