import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase.from("seeds").select("id, title, map_id, cover_image_url").eq("seed_type", "pathlab");
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
main();
