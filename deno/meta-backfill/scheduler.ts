export interface BackfillSectionResult {
  processed: number;
  remaining: number;
  stoppedReason: string;
}

export interface MetaBackfillResult {
  dm: BackfillSectionResult;
  comments: BackfillSectionResult;
}

export interface RunMetaBackfillOptions {
  endpoint: string;
  secret: string;
  fetcher?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSection(value: unknown, name: string): BackfillSectionResult {
  if (
    !isRecord(value) ||
    typeof value.processed !== "number" ||
    typeof value.remaining !== "number" ||
    typeof value.stoppedReason !== "string"
  ) {
    throw new Error(`Invalid ${name} backfill response`);
  }
  return {
    processed: value.processed,
    remaining: value.remaining,
    stoppedReason: value.stoppedReason,
  };
}

export async function runMetaBackfill({
  endpoint,
  secret,
  fetcher = fetch,
}: RunMetaBackfillOptions): Promise<MetaBackfillResult> {
  if (!secret) throw new Error("Missing CRON_SECRET");

  const response = await fetcher(endpoint, {
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) {
    throw new Error(`Meta backfill endpoint returned ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) throw new Error("Invalid Meta backfill response");

  const result = {
    dm: parseSection(payload.dm, "DM"),
    comments: parseSection(payload.comments, "comments"),
  };
  if (
    result.dm.stoppedReason === "error" ||
    result.comments.stoppedReason === "error"
  ) {
    throw new Error("Meta backfill batch reported an error");
  }
  return result;
}
