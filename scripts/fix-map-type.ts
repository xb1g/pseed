import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROD_URL = "https://iikrvgjfkuijcpvdwzvv.supabase.co";
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(PROD_URL, PROD_KEY);

const titles = [
  "Product Manager: Tech Product Strategy & Lifecycle",
  "Data Scientist: Predictive Modeling & Statistical Inference",
  "Cybersecurity Specialist: Threat Analysis & Intelligence",
  "AI Integration Engineer",
  "Full-Stack Engineer: Core Application Development"
];

async function main() {
  const { data: seeds } = await supabase.from("seeds").select("id, map_id").in("title", titles);
  console.log("Seeds:", seeds);
  
  if (seeds && seeds.length > 0) {
    for (const seed of seeds) {
      const { error } = await supabase.from("learning_maps")
        .update({ 
          map_type: "seed",
          parent_seed_id: seed.id 
        })
        .eq("id", seed.map_id);
      if (error) console.error(`Error for map ${seed.map_id}:`, error);
      else console.log(`Updated map_type and parent_seed_id for map ${seed.map_id} successfully.`);
    }
  }
}
main();
