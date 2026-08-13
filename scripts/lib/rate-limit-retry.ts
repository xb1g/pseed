export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries on Meta's transient app-level rate limit (code 4) with backoff. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && /"code":4\b/.test(error.message);
      if (!isRateLimit || attempt === 4) throw error;
      const waitMs = 30_000 * 2 ** attempt;
      console.log(`  rate limited, waiting ${waitMs / 1000}s before retry ${attempt + 1}/5...`);
      await sleep(waitMs);
    }
  }
  throw new Error("unreachable");
}
