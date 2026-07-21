import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROD_URL = "https://iikrvgjfkuijcpvdwzvv.supabase.co";
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(PROD_URL, PROD_KEY);

async function main() {
  const { data } = await supabase.from("seed_categories").select("id, name");
  console.log("Categories:", data);
}
main();
