/**
 * Snapshot the small hackathon ENTITY tables from prod -> local, so the learning-analytics
 * pipeline + dashboard can run self-contained on local. Read-only on prod.
 *
 *   pnpm tsx scripts/hackathon-learning/snapshot.ts
 *
 * FK constraints + triggers are bypassed on the local side (session_replication_role=replica),
 * so table order doesn't matter and grading/score triggers don't fire. Big behavioral tables
 * (page_views, sessions) are intentionally NOT copied — the pipeline aggregates those from prod.
 */
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

const SRC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SRC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const DEFAULT_TABLES = [
  "hackathon_program_phases",
  "hackathon_challenges",
  "hackathon_participants",
  "hackathon_teams",
  "hackathon_team_members",
  "hackathon_phase_activities",
  "hackathon_phase_activity_assessments",
  "hackathon_phase_activity_submissions",
  "hackathon_phase_activity_team_submissions",
  "hackathon_phase3_cycles",
  "hackathon_phase3_cycle_steps",
];

// Allow snapshotting a subset (e.g. just Phase-3 tables) without truncating teams/submissions.
const TABLES = process.env.SNAPSHOT_TABLES ? process.env.SNAPSHOT_TABLES.split(",") : DEFAULT_TABLES;

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });

async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const page = 1000;
  let from = 0;
  const out: Record<string, unknown>[] = [];
  for (;;) {
    const { data, error } = await src.from(table).select("*").range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
    from += page;
  }
  return out;
}

interface Col { name: string; udt: string; isArray: boolean; }

async function localCols(pg: Client, table: string): Promise<Col[]> {
  const { rows } = await pg.query(
    `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
        AND is_generated='NEVER' AND is_identity='NO'
      ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => ({
    name: r.column_name,
    udt: r.udt_name,
    isArray: r.data_type === "ARRAY",
  }));
}

function encode(val: unknown, col: Col): unknown {
  if (val === null || val === undefined) return null;
  if (col.udt === "json" || col.udt === "jsonb") return JSON.stringify(val);
  return val; // pg handles arrays + scalars natively
}

async function main() {
  const pg = new Client({ connectionString: LOCAL_DB });
  await pg.connect();
  try {
    await pg.query("BEGIN");
    await pg.query("SET session_replication_role = replica"); // bypass FK + triggers
    for (const table of TABLES) {
      const cols = await localCols(pg, table);
      const colNames = cols.map((c) => c.name);
      const rows = await fetchAll(table);
      await pg.query(`TRUNCATE public.${table} CASCADE`);
      if (!rows.length) { console.log(`${table.padEnd(44)} 0`); continue; }

      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        const params: unknown[] = [];
        const tuples = slice.map((row) => {
          const ph = cols.map((c) => {
            params.push(encode(row[c.name], c));
            return `$${params.length}`;
          });
          return `(${ph.join(",")})`;
        });
        await pg.query(
          `INSERT INTO public.${table} (${colNames.map((n) => `"${n}"`).join(",")}) VALUES ${tuples.join(",")} ON CONFLICT DO NOTHING`,
          params,
        );
      }
      console.log(`${table.padEnd(44)} ${rows.length}`);
    }
    await pg.query("COMMIT");
    console.log("\n✅ snapshot complete (local)");
  } catch (e) {
    await pg.query("ROLLBACK");
    throw e;
  } finally {
    await pg.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
