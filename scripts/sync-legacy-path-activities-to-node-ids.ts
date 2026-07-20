import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: true });

import { createClient } from "@supabase/supabase-js";

const LOCAL_URL = "http://localhost:54321";
const LOCAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PROD_URL = process.env.HACKATHON_SUPABASE_URL;
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY;

const PATH_ID = "5b663d2e-d7ae-4936-aff2-dc1b61abf6a4"; // Legacy Web Developer Path

async function syncPath(url: string, key: string, label: string) {
  if (!url || !key) {
    console.log(`⚠️  Skipping ${label}: Missing URL or Key.`);
    return;
  }

  console.log(`\n🌀 Syncing legacy activities to node_ids for ${label}...`);
  const supabase = createClient(url, key);

  // 1. Fetch days for the legacy path
  const { data: days, error: daysErr } = await supabase
    .from("path_days")
    .select("id, day_number, node_ids")
    .eq("path_id", PATH_ID)
    .order("day_number");

  if (daysErr) {
    console.error(`❌ Failed to fetch days on ${label}:`, daysErr.message);
    return;
  }

  if (!days || days.length === 0) {
    console.log(`   No days found for path ${PATH_ID} on ${label}.`);
    return;
  }

  for (const day of days) {
    // 2. Fetch activities for this day
    const { data: activities, error: actErr } = await supabase
      .from("path_activities")
      .select("id")
      .eq("path_day_id", day.id)
      .order("display_order", { ascending: true });

    if (actErr) {
      console.error(`❌ Failed to fetch activities for Day ${day.day_number}:`, actErr.message);
      continue;
    }

    const activityIds = (activities || []).map((a) => a.id);
    console.log(`   Day ${day.day_number}: Found ${activityIds.length} activities.`);

    // 3. Update node_ids with these activity IDs
    const { error: updateErr } = await supabase
      .from("path_days")
      .update({ node_ids: activityIds })
      .eq("id", day.id);

    if (updateErr) {
      console.error(`❌ Failed to update Day ${day.day_number}:`, updateErr.message);
    } else {
      console.log(`   ✅ Day ${day.day_number}: Updated node_ids to:`, activityIds);
    }
  }
}

async function run() {
  // Sync locally
  await syncPath(LOCAL_URL, LOCAL_KEY || "", "Local Database");

  // Sync in production
  if (PROD_URL && PROD_KEY) {
    await syncPath(PROD_URL, PROD_KEY, "Production Database");
  }
}

run().catch(console.error);
