/**
 * One-off: copy computed learning-analytics rows local → prod.
 * Reads from local Postgres, upserts to prod via the service-role key (bypasses RLS).
 * Rows are copied verbatim (id preserved) so re-runs are idempotent (onConflict=id).
 * FK targets (teams, submissions, cycles) already exist on prod — no replica trick needed.
 *
 *   pnpm exec dotenv -e .env.production -o -- pnpm exec tsx scripts/hackathon-learning/backfill-prod.ts
 */
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const LOCAL_DB = process.env.LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PROD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLES = ["hackathon_semifinal_scores", "hackathon_submission_signals", "hackathon_learning_metrics"];

async function main() {
  if (!PROD_URL || !PROD_KEY) { console.error("❌ missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  if (PROD_URL.includes("127.0.0.1") || PROD_URL.includes("localhost")) { console.error("❌ refusing: SUPABASE_URL points local, not prod"); process.exit(1); }

  const pg = new Pool({ connectionString: LOCAL_DB, max: 4 });
  const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });
  try {
    for (const table of TABLES) {
      const rows = (await pg.query(`SELECT * FROM ${table}`)).rows;
      let done = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await prod.from(table).upsert(batch, { onConflict: "id" });
        if (error) { console.error(`  ✗ ${table} batch ${i}: ${error.message}`); process.exit(1); }
        done += batch.length;
      }
      console.log(`  ✓ ${table}: ${done} rows`);
    }
    console.log("✅ backfill complete");
  } finally { await pg.end(); }
}

main().catch((e) => { console.error(e); process.exit(1); });
