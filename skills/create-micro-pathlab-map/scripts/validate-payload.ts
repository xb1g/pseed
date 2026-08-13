import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const schemaPath = path.join(process.cwd(), "lib/maps/micro-pathlab-import.ts");
  const { microPathLabMapImportSchema } = await import(pathToFileURL(schemaPath).href);

  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: validate-payload.ts <payload.json>");
    process.exit(2);
  }

  let input: unknown;
  try {
    input = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Invalid JSON: ${message}`);
    process.exit(1);
  }

  const result = microPathLabMapImportSchema.safeParse(input);
  if (!result.success) {
    for (const issue of result.error.issues) {
      console.error(`ERROR: ${issue.path.join(".") || "payload"}: ${issue.message}`);
    }
    console.error(`Validation failed with ${result.error.issues.length} error(s).`);
    process.exit(1);
  }

  console.log(
    `Valid standalone Micro PathLab map: ${result.data.nodes.length} nodes, ` +
      `${result.data.connections.length} connections, ${result.data.map.estimatedMinutes} minutes.`,
  );
}

void main();
