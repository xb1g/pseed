import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Stores completed IDs for resumable one-off scripts that do not need to
 * revisit already imported resources.
 */
export class Checkpoint {
  private readonly done: Set<string>;
  private readonly path: string;

  constructor(name: string) {
    this.path = resolve(process.cwd(), "scripts", ".state", `${name}.json`);
    mkdirSync(dirname(this.path), { recursive: true });
    this.done = existsSync(this.path)
      ? new Set(JSON.parse(readFileSync(this.path, "utf-8")) as string[])
      : new Set();
  }

  has(id: string): boolean {
    return this.done.has(id);
  }

  markDone(id: string): void {
    this.done.add(id);
    writeFileSync(this.path, JSON.stringify([...this.done]));
  }

  get size(): number {
    return this.done.size;
  }
}
