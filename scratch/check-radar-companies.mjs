import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("missing env"); process.exit(1); }
const supabase = createClient(url, key);

const { data: field, error: fe } = await supabase
  .from("radar_fields").select("id").eq("slug", "ai-engineer").single();
if (fe) throw fe;

const { data: card, error: ce } = await supabase
  .from("radar_cards").select("kind, content_th, content_en")
  .eq("field_id", field.id).eq("kind", "marketThailand").single();
if (ce) throw ce;

console.log(JSON.stringify({
  companies_th: card.content_th?.companies,
  companies_en: card.content_en?.companies,
}, null, 2));
