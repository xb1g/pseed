#!/usr/bin/env node
/**
 * Process a source mascot video into transparent WebP frames.
 *
 * Usage:
 *   node scripts/process-mascot-video.mjs [path/to/source.mp4]
 *
 * Defaults:
 *   input:  public/hackathon/gallery/mascot-source.mp4
 *   output: public/hackathon/gallery/mascot-frames/
 *
 * The script removes a pure-white background, resizes to a display-friendly
 * width, writes numbered WebP frames with alpha, and generates manifest.json.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const input = path.resolve(
  process.argv[2] || path.join(repoRoot, "assets/hackathon/gallery/mascot-source.mp4")
);
const outputDir = path.join(repoRoot, "public/hackathon/gallery/mascot-frames");
const manifestPath = path.join(outputDir, "manifest.json");

const TARGET_FPS = 24;
const TARGET_WIDTH = 240;
const COLORKEY_TOLERANCE = 0.12; // tune if light mascot parts disappear
const HUE_SHIFT = 55; // rotate the source green mascot toward blue
const HUE_SATURATION = 0.75; // slightly desaturate so dark areas don't pick up a strong green cast
const SHADOW_GREEN_BALANCE = -0.12; // pull green out of the shadows

const WEBP_OPTIONS = {
  quality: 85,
  alphaQuality: 85,
  effort: 6,
};

function ensureFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    console.error("❌ ffmpeg is required but not found in PATH");
    process.exit(1);
  }
}

function cleanOutputDir() {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });
}

function extractPngFrames() {
  const pattern = path.join(outputDir, "%04d.png");
  // Filter order:
  // 1. drop fps first so we process fewer frames
  // 2. remove white background at full resolution
  // 3. scale down with lanczos
  const vf = [
    `fps=${TARGET_FPS}`,
    `hue=h=${HUE_SHIFT}:s=${HUE_SATURATION}`,
    `colorbalance=gs=${SHADOW_GREEN_BALANCE}`,
    `colorkey=white:${COLORKEY_TOLERANCE}:0.0`,
    `scale=${TARGET_WIDTH}:-1:flags=lanczos`,
    "format=rgba",
  ].join(",");

  const cmd = [
    "ffmpeg",
    "-y",
    "-i",
    `"${input}"`,
    "-vf",
    `"${vf}"`,
    "-start_number",
    "1",
    "-compression_level",
    "9",
    `"${pattern}"`,
  ].join(" ");

  console.log(`▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: repoRoot });
}

async function convertToWebp() {
  const pngFiles = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  if (pngFiles.length === 0) {
    throw new Error("No PNG frames were generated");
  }

  console.log(`\n🗜  Converting ${pngFiles.length} PNG frames to WebP...`);

  let totalIn = 0;
  let totalOut = 0;

  for (const pngFile of pngFiles) {
    const pngPath = path.join(outputDir, pngFile);
    const webpFile = pngFile.replace(/\.png$/, ".webp");
    const webpPath = path.join(outputDir, webpFile);

    const inputStats = fs.statSync(pngPath);
    totalIn += inputStats.size;

    await sharp(pngPath)
      .webp(WEBP_OPTIONS)
      .toFile(webpPath);

    const outputStats = fs.statSync(webpPath);
    totalOut += outputStats.size;

    fs.unlinkSync(pngPath);
  }

  const ratio = ((1 - totalOut / totalIn) * 100).toFixed(1);
  console.log(`   ${(totalIn / 1024).toFixed(0)} KB → ${(totalOut / 1024).toFixed(0)} KB (${ratio}% smaller)`);
}

async function validateAndBuildManifest() {
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".webp"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  if (files.length === 0) {
    throw new Error("No WebP frames were generated");
  }

  let width = 0;
  let height = 0;
  let emptyFrames = 0;

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const img = sharp(filePath);
    const meta = await img.metadata();
    const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    if (!meta.hasAlpha) {
      throw new Error(`${file} does not have an alpha channel`);
    }

    width = info.width;
    height = info.height;

    // Check if any pixel is non-transparent
    let hasVisiblePixel = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) {
        hasVisiblePixel = true;
        break;
      }
    }
    if (!hasVisiblePixel) {
      console.warn(`⚠️  ${file} appears to be fully transparent`);
      emptyFrames += 1;
    }
  }

  const manifest = {
    fps: TARGET_FPS,
    width,
    height,
    frames: files,
    frameCount: files.length,
    source: path.relative(repoRoot, input),
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("\n✅ Mascot frames processed");
  console.log(`   Frames:   ${files.length}${emptyFrames ? ` (${emptyFrames} empty)` : ""}`);
  console.log(`   Size:     ${width}×${height}`);
  console.log(`   FPS:      ${TARGET_FPS}`);
  console.log(`   Manifest: ${path.relative(repoRoot, manifestPath)}`);
}

async function main() {
  if (!fs.existsSync(input)) {
    console.error(`❌ Source video not found: ${input}`);
    process.exit(1);
  }

  ensureFfmpeg();
  cleanOutputDir();
  extractPngFrames();
  await convertToWebp();
  await validateAndBuildManifest();
}

main().catch((err) => {
  console.error("\n❌ Processing failed:", err.message);
  process.exit(1);
});
