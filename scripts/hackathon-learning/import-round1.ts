/**
 * Import Round-1 judge scores from the xlsx Highschool / University tabs.
 *
 *   pnpm tsx scripts/hackathon-learning/import-round1.ts [--dry-run] [--target=prod]
 *
 * Reads team names from prod DB to resolve team_id, parses the xlsx,
 * fuzzy-maps names, and upserts into hackathon_round1_scores.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" }); // fallback if .env.production absent

const XLSX_PATH =
  process.env.ROUND1_XLSX ??
  "/Users/pine/Downloads/Next Decade Hackathon Round 1 Responses.xlsx";

const DRY = process.argv.includes("--dry-run");
const TARGET_PROD = process.argv.includes("--target=prod");

const SRC_URL = process.env.HACKATHON_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SRC_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const LOCAL_KEY =
  process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Manual overrides: raw xlsx name -> exact DB team name
const NAME_OVERRIDES: Record<string, string> = {
  "ParaChoose Me ": "ParaChoose Me",
  "Honkatack ": "Honkatack",
  "SamoiAdventure ": "SamoiAdventure",
  "Infinity ": "Infinity",
  "PAMUN Engineering ": "PAMUN Engineering",
};

// Manual ID overrides: raw xlsx name -> exact DB team_id (for duplicate-name teams)
const ID_OVERRIDES: Record<string, string> = {
  "ชัดเจนในเลนเรา": "d2a59186-dce2-4b02-b41e-1108ddf99e2c", // 5-member team, not the 1-member stray
};

// Rows to merge (average) instead of inserting twice — keyed by normalised name
// Value: the single merged total to use
const MERGED_TOTALS: Record<string, number> = {
  "ParaChoose Me": (57.92 + 60.29) / 2, // two judge panels in xlsx → average
};

function normKey(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/\p{C}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return 1 - d[m][n] / Math.max(m, n);
}

function resolveTeam(raw: string, teams: { id: string; name: string }[]) {
  // ID override takes highest priority
  const idOverride = ID_OVERRIDES[raw.trim()];
  if (idOverride) {
    const t = teams.find((t) => t.id === idOverride);
    if (t) return { id: t.id, method: "manual", matchedName: t.name };
  }
  const override = NAME_OVERRIDES[raw];
  if (override) {
    const t = teams.find((t) => normKey(t.name) === normKey(override));
    if (t) return { id: t.id, method: "manual", matchedName: t.name };
  }
  const k = normKey(raw);
  const exact = teams.filter((t) => normKey(t.name) === k);
  if (exact.length === 1) return { id: exact[0].id, method: "exact", matchedName: exact[0].name };
  if (exact.length > 1) return { id: null, method: "ambiguous" };
  let best: { id: string; name: string } | null = null;
  let bestR = 0;
  for (const t of teams) {
    const r = ratio(k, normKey(t.name));
    if (r > bestR) { bestR = r; best = t; }
  }
  if (best && bestR >= 0.78) return { id: best.id, method: "fuzzy", matchedName: best.name };
  return { id: null, method: "unmatched", matchedName: undefined };
}

async function parseXlsx(): Promise<{ raw: string; division: string; total: number }[]> {
  // Dynamically import xlsx (lightweight alternative to openpyxl)
  const XLSX = await import("xlsx");
  const lib = (XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX;
  const wb = lib.readFile(XLSX_PATH);

  const result: { raw: string; division: string; total: number }[] = [];

  for (const [sheetName, division] of [["Highschool", "high_school"], ["University", "university"]] as const) {
    const ws = wb.Sheets[sheetName];
    if (!ws) { console.warn(`Sheet "${sheetName}" not found`); continue; }
    const rows = lib.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 }) as unknown[][];
    // Row 0 = headers, col 0 = team name, col 27 = Total Score
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const name = row[0];
      const total = row[27];
      if (typeof name === "string" && name.trim() && typeof total === "number") {
        result.push({ raw: name.trim(), division, total: Math.round(total * 100) / 100 });
      }
    }
  }
  return result;
}

async function main() {
  const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });
  const { data: teamsData, error } = await src.from("hackathon_teams").select("id, name").limit(500);
  if (error) throw error;
  const teams = teamsData as { id: string; name: string }[];

  const rows = await parseXlsx();
  console.log(`Parsed ${rows.length} rows · ${teams.length} DB teams\n`);

  const records = rows.map((r) => {
    const m = resolveTeam(r.raw, teams);
    const flag = m.method === "exact" || m.method === "manual" ? "  " : "⚠️ ";
    console.log(`${flag}${m.method.padEnd(9)} ${r.raw.padEnd(38)} -> ${m.matchedName ?? "(none)"}  [${r.division}] total=${r.total}`);
    return {
      team_id: m.id,
      raw_team_name: r.raw,
      division: r.division,
      total: r.total,
      match_method: m.method,
    };
  });

  // Deduplicate: if the same team_id appears twice, use the MERGED_TOTALS average
  const seen = new Map<string, typeof records[0]>();
  const deduped: typeof records = [];
  for (const rec of records) {
    if (!rec.team_id) { deduped.push(rec); continue; }
    if (seen.has(rec.team_id)) {
      // Replace total with the pre-computed merged value if available
      const mergedTotal = MERGED_TOTALS[rec.raw_team_name.trim()];
      if (mergedTotal !== undefined) {
        seen.get(rec.team_id)!.total = Math.round(mergedTotal * 100) / 100;
        console.log(`  merged    ${rec.raw_team_name.padEnd(38)} -> averaged to ${seen.get(rec.team_id)!.total}`);
      }
    } else {
      seen.set(rec.team_id, rec);
      deduped.push(rec);
    }
  }

  const unresolved = deduped.filter((r) => !r.team_id);
  console.log(`\nresolved=${deduped.length - unresolved.length}  unresolved=${unresolved.length}  (after dedup: ${deduped.length} rows)`);

  if (DRY) { console.log("(dry-run — nothing written)"); return; }
  if (unresolved.length) {
    console.error("Refusing to write: unresolved names above. Add overrides and retry.");
    process.exit(1);
  }

  const target = TARGET_PROD
    ? createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } })
    : createClient(LOCAL_URL, LOCAL_KEY, { auth: { persistSession: false } });

  await target.from("hackathon_round1_scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: insErr } = await target.from("hackathon_round1_scores").insert(deduped);
  if (insErr) { console.error("Insert failed:", insErr); process.exit(1); }
  console.log(`\n✅ wrote ${deduped.length} rows to ${TARGET_PROD ? "PROD" : "LOCAL"} hackathon_round1_scores`);
}

main().catch((e) => { console.error(e); process.exit(1); });
