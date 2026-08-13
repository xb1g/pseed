import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Tracks which IDs a backfill script has already finished, so a rerun after
 * a crash/kill skips them instead of re-spending API-rate-limit budget on
 * work that's already in the DB.
 */
export class Checkpoint {
  private done: Set<string>;
  private readonly path: string;

  constructor(name: string) {
    this.path = `${__dirname}/../.state/${name}.json`;
    mkdirSync(dirname(this.path), { recursive: true });
    this.done = existsSync(this.path)
      ? new Set(JSON.parse(readFileSync(this.path, "utf-8")))
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
