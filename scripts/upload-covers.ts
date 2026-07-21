import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PROD_URL = "https://iikrvgjfkuijcpvdwzvv.supabase.co";
const PROD_KEY = process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(PROD_URL, PROD_KEY);

const images = [
  { 
    title: "Product Manager: Tech Product Strategy & Lifecycle", 
    file: "pm_simple_cover_1784659632099.jpg"
  },
  { 
    title: "Data Scientist: Predictive Modeling & Statistical Inference", 
    file: "ds_simple_cover_1784659643621.jpg"
  }
];

async function main() {
  for (const img of images) {
    const fullPath = path.join("/Users/bunyasit/.gemini/antigravity-cli/brain/a13a8252-8629-499e-a9ee-d02dbdcc94ef", img.file);
    if (!fs.existsSync(fullPath)) {
      console.log(`Missing file: ${fullPath}`);
      continue;
    }

    const buffer = fs.readFileSync(fullPath);
    const fileName = `covers/${Date.now()}-${img.file}`;

    console.log(`Uploading ${img.file} to seed-assets bucket...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("seed-assets")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload error for ${img.file}:`, uploadError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("seed-assets")
      .getPublicUrl(fileName);

    console.log(`Uploaded to ${publicUrl}`);

    // Update the seed
    const { data: seedData, error: seedError } = await supabase
      .from("seeds")
      .update({ cover_image_url: publicUrl })
      .eq("title", img.title)
      .select();

    if (seedError) {
      console.error(`Error updating seed ${img.title}:`, seedError);
    } else {
      console.log(`Updated seed cover for ${img.title}:`, seedData?.length);
    }
  }
}

main().catch(console.error);
