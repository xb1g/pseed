/**
 * Uploads TechSeed gallery media to Backblaze B2 and merges the result into
 * the manifest that the /techseed page imports.
 *
 * Filenames in the source folders contain student real names, so every file
 * is renamed to a generic `ts<cohort>-XX.<ext>` key before upload. Student
 * PII never leaves the local machine.
 *
 * Usage:
 *   node scripts/upload_techseed_gallery.mjs <local-dir> <cohort-number>
 *
 * Reads B2 credentials from .env.local (fallback .env), same as the APK
 * publisher. Merges into lib/content/techseed-gallery.json: re-running with
 * the same cohort replaces that cohort's entries and leaves the rest intact.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const repoRoot = process.cwd();
const srcDir = process.argv[2];
const cohort = process.argv[3];

if (!srcDir || !fs.existsSync(srcDir) || !/^\d+$/.test(cohort || "")) {
  console.error(
    "Usage: node scripts/upload_techseed_gallery.mjs <local-dir> <cohort-number>"
  );
  process.exit(1);
}

dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const bucket = process.env.B2_BUCKET_NAME;
const endpoint = process.env.B2_ENDPOINT || "s3.us-west-000.backblazeb2.com";
const accessKeyId = process.env.B2_APPLICATION_KEY_ID;
const secretAccessKey = process.env.B2_APPLICATION_KEY;

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error("Missing Backblaze environment variables");
  process.exit(1);
}

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};
const VIDEO = new Set([".mp4", ".mov", ".webm"]);
const PREFIX = "shift/gallery-web/";

const files = fs
  .readdirSync(srcDir)
  .filter((f) => MIME[path.extname(f).toLowerCase()])
  .sort();

if (files.length === 0) {
  console.error(`No uploadable media found in ${srcDir}`);
  process.exit(1);
}

const region = endpoint.split(".")[1] || "us-west-000";
const client = new S3Client({
  endpoint: `https://${endpoint}`,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const entries = [];
let index = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  index += 1;
  const key = `${PREFIX}ts${cohort}-${String(index).padStart(2, "0")}${ext}`;
  const filePath = path.join(srcDir, file);
  const stat = fs.statSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: MIME[ext],
      ContentLength: stat.size,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  entries.push({
    url: `https://f005.backblazeb2.com/file/${bucket}/${key}`,
    kind: VIDEO.has(ext) ? "video" : "image",
    cohort,
  });
  console.log(`✓ ${file} -> ${key} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

const manifestPath = path.join(repoRoot, "lib/content/techseed-gallery.json");
const existing = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : [];
const merged = [
  ...existing.filter((e) => e.cohort !== cohort),
  ...entries,
].sort((a, b) => a.cohort.localeCompare(b.cohort) || a.url.localeCompare(b.url));

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `\n${entries.length} files uploaded for TechSeed #${cohort}. Manifest: ${manifestPath} (${merged.length} total)`
);
