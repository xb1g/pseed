import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROD_URL = "https://iikrvgjfkuijcpvdwzvv.supabase.co";
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(PROD_URL, PROD_KEY);

const WORKSHOP_ID = "26c7bf41-4749-4e72-a115-8f0752cbacd9";

async function main() {
  const { error: insertError } = await supabase.from("seed_categories").upsert({
    id: WORKSHOP_ID,
    name: "Workshop"
  });
  
  if (insertError) {
    console.error("Error inserting Workshop category:", insertError);
  } else {
    console.log("Inserted Workshop category.");
  }

  const titles = [
    "Product Manager: Tech Product Strategy & Lifecycle",
    "Data Scientist: Predictive Modeling & Statistical Inference",
    "Cybersecurity Specialist: Threat Analysis & Intelligence",
    "AI Integration Engineer",
    "Full-Stack Engineer: Core Application Development"
  ];

  const { error: updateError } = await supabase.from("seeds")
    .update({ category_id: WORKSHOP_ID })
    .in("title", titles);

  if (updateError) {
    console.error("Error updating seeds:", updateError);
  } else {
    console.log("Updated seeds to Workshop category.");
  }
}
main();
