import { MetaGraphApiError } from "../../lib/meta/graph";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimited(error: unknown): boolean {
  return (
    (error instanceof MetaGraphApiError && error.isRateLimited) ||
    (error instanceof Error && /"code":\s*(?:4|17|32|613)\b/.test(error.message))
  );
}

/** Retries Meta's transient rate limits with bounded exponential backoff. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isRateLimited(error) || attempt === 4) throw error;

      const waitMs = 30_000 * 2 ** attempt;
      console.log(`  rate limited, waiting ${waitMs / 1000}s before retry ${attempt + 1}/5...`);
      await sleep(waitMs);
    }
  }

  throw new Error("Meta retry loop exited unexpectedly");
}
