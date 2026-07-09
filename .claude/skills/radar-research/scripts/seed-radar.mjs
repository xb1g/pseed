#!/usr/bin/env node
/**
 * Seed a radar field with cards and sources to BOTH local and production.
 *
 * Usage: node seed-radar.mjs <path-to-data.json>
 *
 * The JSON file should match the template from seed-template.mjs:
 * { field: {...}, sources: [...], cards: [...] }
 *
 * Requires:
 * - .env.local with HACKATHON_SUPABASE_URL and HACKATHON_SUPABASE_SERVICE_ROLE_KEY
 * - Local Supabase running (container supabase_db_pseed)
 */

import fs from "fs";
import path from "path";

const dataPath = process.argv[2];
if (!dataPath) {
  console.error("Usage: node seed-radar.mjs <path-to-data.json>");
  process.exit(1);
}

// Load env
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^(\w+)=(.+)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const PROD_URL = env.HACKATHON_SUPABASE_URL;
const PROD_KEY = env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY;
const LOCAL_URL = "http://127.0.0.1:54321";
const LOCAL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!PROD_URL || !PROD_KEY) {
  console.error(
    "Missing HACKATHON_SUPABASE_URL or HACKATHON_SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const { field, sources, cards } = data;

if (!field?.slug) {
  console.error("field.slug is required");
  process.exit(1);
}

// Calculate score from metrics if not set
if (field.score == null && field.research?.metrics) {
  const m = field.research.metrics;
  const raw =
    ((m.demand_growth ?? 0) / 10 +
      (m.grad_employment_pct ?? 0) / 100 +
      (1 - (m.saturation_level ?? 0) / 10) +
      (1 - (m.progression_difficulty ?? 0) / 10)) /
    4;
  field.score = Math.round(raw * 10);
}

async function upsert(baseUrl, apiKey, table, rows, onConflict) {
  const url = `${baseUrl}/rest/v1/${table}`;
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  };
  if (onConflict) {
    headers.Prefer += `,on_conflict=${onConflict}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${table} upsert failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function getFieldId(baseUrl, apiKey, slug) {
  const url = `${baseUrl}/rest/v1/radar_fields?slug=eq.${encodeURIComponent(slug)}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const rows = await res.json();
  return rows?.[0]?.id;
}

async function seedTarget(label, baseUrl, apiKey) {
  console.log(`\n--- ${label} ---`);

  // 1. Upsert field
  console.log(`  Upserting field: ${field.slug}`);
  await upsert(baseUrl, apiKey, "radar_fields", field);

  // 2. Get field_id
  const fieldId = await getFieldId(baseUrl, apiKey, field.slug);
  if (!fieldId) throw new Error(`Field ${field.slug} not found after upsert`);
  console.log(`  Field ID: ${fieldId}`);

  // 3. Upsert sources
  if (sources?.length) {
    const srcRows = sources.map((s) => ({ ...s, field_id: fieldId }));
    console.log(`  Upserting ${srcRows.length} sources`);
    await upsert(baseUrl, apiKey, "radar_sources", srcRows);
  }

  // 4. Upsert cards
  if (cards?.length) {
    const cardRows = cards.map((c) => ({ ...c, field_id: fieldId }));
    console.log(`  Upserting ${cardRows.length} cards`);
    await upsert(baseUrl, apiKey, "radar_cards", cardRows);
  }

  // 5. Verify
  const verifyField = await getFieldId(baseUrl, apiKey, field.slug);
  const srcCount = await fetch(
    `${baseUrl}/rest/v1/radar_sources?field_id=eq.${fieldId}&select=ref`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } }
  ).then((r) => r.json());
  const cardCount = await fetch(
    `${baseUrl}/rest/v1/radar_cards?field_id=eq.${fieldId}&select=kind`,
    { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } }
  ).then((r) => r.json());

  console.log(
    `  Verified: field=${verifyField ? "ok" : "MISSING"}, sources=${srcCount.length}, cards=${cardCount.length}`
  );
}

try {
  await seedTarget("PRODUCTION", PROD_URL, PROD_KEY);
} catch (e) {
  console.error("Production error:", e.message);
}

try {
  await seedTarget("LOCAL", LOCAL_URL, LOCAL_KEY);
} catch (e) {
  console.error("Local error:", e.message);
  console.error(
    "  (Is local Supabase running? Try: npx supabase start)"
  );
}

console.log("\nDone.");
