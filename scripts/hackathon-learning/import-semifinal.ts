/**
 * Import Round-2 semifinal judge scores into hackathon_semifinal_scores (LOCAL by default).
 *
 *   pnpm tsx scripts/hackathon-learning/import-semifinal.ts [--dry-run] [--target=prod]
 *
 * Reads team names from the SOURCE (prod) to resolve team_id, parses the judge xlsx via the
 * python extractor, fuzzy-maps names, and upserts into the TARGET db (local unless --target=prod).
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

const XLSX =
  process.env.SEMIFINAL_XLSX ??
  "/Users/bunyasit/Downloads/The Next Decade Hackathon_ Round 2 Judge.xlsx";

const DRY = process.argv.includes("--dry-run");
const TARGET_PROD = process.argv.includes("--target=prod");

// Source = prod (read team names). Target = local unless --target=prod.
const SRC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SRC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const LOCAL_KEY =
  process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ??
  // standard local-dev service_role JWT (not a secret; identical on every local install)
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Confirmed fuzzy resolutions (raw judge name -> exact DB team name). Keeps re-runs deterministic.
const NAME_OVERRIDES: Record<string, string> = {
  nosleepdev: "No Sleep Devs",
  "แล้วแต่จะคิด ชีวิตคนละแบบ": "แล้วแต่เลย ชีวิตคนละแบบ",
};

interface SemifinalRow {
  raw_team_name: string;
  division: string;
  panel: string;
  judge_count: number;
  scores: Record<string, number | null>;
  total: number;
  per_judge: unknown[];
  comments: string[];
  rank_in_panel: number;
}

function normKey(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/\p{C}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

// Levenshtein ratio in [0,1].
function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return 1 - d[m][n] / Math.max(m, n);
}

async function loadTeams(src: SupabaseClient) {
  const { data, error } = await src
    .from("hackathon_teams")
    .select("id, name")
    .limit(500);
  if (error) throw error;
  return data as { id: string; name: string }[];
}

function resolveTeam(
  raw: string,
  teams: { id: string; name: string }[],
): { id: string | null; method: string; matchedName?: string } {
  const override = NAME_OVERRIDES[raw];
  if (override) {
    const t = teams.find((t) => normKey(t.name) === normKey(override));
    if (t) return { id: t.id, method: "manual", matchedName: t.name };
  }
  const k = normKey(raw);
  const exact = teams.filter((t) => normKey(t.name) === k);
  if (exact.length === 1) return { id: exact[0].id, method: "exact", matchedName: exact[0].name };
  if (exact.length > 1) return { id: null, method: "ambiguous" };
  // fuzzy
  let best: { id: string; name: string } | null = null;
  let bestR = 0;
  for (const t of teams) {
    const r = ratio(k, normKey(t.name));
    if (r > bestR) { bestR = r; best = t; }
  }
  if (best && bestR >= 0.82) return { id: best.id, method: "fuzzy", matchedName: best.name };
  return { id: null, method: "unmatched" };
}

async function main() {
  const rowsJson = execFileSync(
    "python3",
    [path.join(__dirname, "extract_semifinal.py"), XLSX],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  const rows = JSON.parse(rowsJson) as SemifinalRow[];

  const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });
  const teams = await loadTeams(src);
  console.log(`Parsed ${rows.length} judge teams · ${teams.length} DB teams\n`);

  const records = rows.map((r) => {
    const m = resolveTeam(r.raw_team_name, teams);
    const flag = m.method === "exact" || m.method === "manual" ? "  " : "⚠️";
    console.log(
      `${flag} ${m.method.padEnd(9)} ${r.raw_team_name.padEnd(34)} -> ${m.matchedName ?? "(none)"}`,
    );
    return {
      team_id: m.id,
      raw_team_name: r.raw_team_name,
      division: r.division,
      panel: r.panel,
      score_problem: r.scores.problem,
      score_solution: r.scores.solution,
      score_market_fit: r.scores.market_fit,
      score_readiness: r.scores.readiness,
      score_journey: r.scores.journey,
      score_pitching: r.scores.pitching,
      total: r.total,
      judge_count: r.judge_count,
      rank_in_panel: r.rank_in_panel,
      per_judge: r.per_judge,
      comments: r.comments,
      match_method: m.method,
    };
  });

  const unresolved = records.filter((r) => !r.team_id);
  console.log(
    `\nresolved=${records.length - unresolved.length} unresolved=${unresolved.length}`,
  );
  if (DRY) { console.log("\n(dry-run — nothing written)"); return; }
  if (unresolved.length) {
    console.error("Refusing to write: unresolved team names above. Fix overrides first.");
    process.exit(1);
  }

  const target = TARGET_PROD
    ? createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } })
    : createClient(LOCAL_URL, LOCAL_KEY, { auth: { persistSession: false } });

  // Feature-owned table: clear + insert for idempotent re-runs.
  await target.from("hackathon_semifinal_scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await target.from("hackathon_semifinal_scores").insert(records);
  if (error) { console.error("Insert failed:", error); process.exit(1); }
  console.log(`\n✅ wrote ${records.length} rows to ${TARGET_PROD ? "PROD" : "LOCAL"} hackathon_semifinal_scores`);
}

main().catch((e) => { console.error(e); process.exit(1); });
