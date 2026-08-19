/**
 * Builds the DM Copilot Chrome extension into `extension/dist`.
 *
 * Chrome cannot load TypeScript, so every entry point is transpiled to ESM
 * JavaScript and the static assets (manifest, popup HTML, CSS, icons) are
 * copied alongside with their `.ts` references rewritten to `.js`.
 *
 * Usage: pnpm build:extension  (then load `extension/dist` unpacked)
 */

import { build } from "esbuild";
import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "extension");
const out = join(src, "dist");

const ENTRIES = [
  "background/service-worker.ts",
  "content/instagram.ts",
  "content/copilot.ts",
  "popup/settings.ts",
  "devtools/devtools.ts",
  "devtools/panel.ts",
];

/** Content scripts cannot be ESM; only the service worker may be a module. */
const IIFE_ENTRIES = new Set([
  "content/instagram.ts",
  "content/copilot.ts",
  "popup/settings.ts",
  "devtools/devtools.ts",
  "devtools/panel.ts",
]);

async function bundleEntry(entry) {
  await build({
    entryPoints: [join(src, entry)],
    outfile: join(out, entry.replace(/\.ts$/, ".js")),
    bundle: true,
    format: IIFE_ENTRIES.has(entry) ? "iife" : "esm",
    target: "chrome120",
    platform: "browser",
    logLevel: "warning",
  });
}

/** Rewrites every `.ts` path in the manifest to the built `.js` path. */
function retargetManifest(manifest) {
  const swap = (p) => (typeof p === "string" ? p.replace(/\.ts$/, ".js") : p);
  manifest.background.service_worker = swap(manifest.background.service_worker);
  manifest.content_scripts = manifest.content_scripts.map((cs) => ({
    ...cs,
    js: cs.js.map(swap),
  }));
  manifest.web_accessible_resources = manifest.web_accessible_resources?.map((war) => ({
    ...war,
    resources: war.resources.map(swap),
  }));
  return manifest;
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  await Promise.all(ENTRIES.map(bundleEntry));

  const manifest = JSON.parse(await readFile(join(src, "manifest.json"), "utf8"));
  await writeFile(join(out, "manifest.json"), JSON.stringify(retargetManifest(manifest), null, 2));

  // HTML pages are copied verbatim except for their script src, which must
  // point at the built .js.
  for (const page of ["popup/settings.html", "devtools/panel.html"]) {
    const html = (await readFile(join(src, page), "utf8")).replace(
      /src="([^"]+)\.ts"/g,
      'src="$1.js"'
    );
    await mkdir(dirname(join(out, page)), { recursive: true });
    await writeFile(join(out, page), html);
  }
  await writeFile(
    join(out, "devtools/devtools.html"),
    '<!doctype html>\n<meta charset="utf-8" />\n<script src="devtools.js"></script>\n'
  );
  await cp(join(src, "content/style.css"), join(out, "content/style.css"));
  await cp(join(src, "icons"), join(out, "icons"), { recursive: true });

  console.log(`✅ extension built → ${out}`);
}

main().catch((error) => {
  console.error("❌ extension build failed:", error);
  process.exit(1);
});
