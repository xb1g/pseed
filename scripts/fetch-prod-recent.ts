import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase.from("seeds").select("id, title, map_id, cover_image_url").order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  console.log("Seeds:", JSON.stringify(data.map(d => d.title), null, 2));
  
  const { data: lmData } = await supabase.from("learning_maps").select("id, title, map_type").order("created_at", { ascending: false }).limit(20);
  console.log("Learning Maps:", JSON.stringify(lmData.map(d => `${d.title} (${d.map_type})`), null, 2));
}
main();
