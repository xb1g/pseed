/**
 * Normalises path_content rows into something renderable.
 *
 * Authored content is not consistently shaped. `content_body` may hold plain
 * text, or a JSON string in one of two forms, and some rows carry the only
 * human-readable text in `metadata` instead:
 *
 *   {"body": "...", "title": "..."}          prose activity
 *   {"title": "...", "description": "..."}   pointer to a chat/reflection tool
 *   "\n\nLink: https://…" + metadata.description   resource link
 *
 * Rendering `content_body` directly leaks raw JSON to students, so every read
 * path goes through here.
 */
export interface NormalizedContent {
  title: string | null;
  /** Main prose, may contain markdown */
  body: string | null;
  /** Short supporting line, shown under the title */
  description: string | null;
  /** First URL found in the body or the content_url column */
  link: string | null;
}

interface RawContentRow {
  content_title?: string | null;
  content_body?: string | null;
  content_url?: string | null;
  metadata?: Record<string, any> | null;
}

const LINK_PREFIX = /^\s*Link:\s*/i;

function parseMaybeJson(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    // Body merely happens to start with a brace — treat it as prose
    return null;
  }
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/https?:\/\/\S+/);
  return match ? match[0] : null;
}

export function normalizeContentBlock(row: RawContentRow): NormalizedContent {
  const metadata = row.metadata || {};
  const rawBody = row.content_body || "";
  const parsed = parseMaybeJson(rawBody);

  // A JSON body supersedes the raw string; anything else is prose
  const bodyFromJson = parsed ? asText(parsed.body) : null;
  const titleFromJson = parsed ? asText(parsed.title) : null;
  const descFromJson = parsed ? asText(parsed.description) : null;

  const prose = parsed
    ? bodyFromJson
    : asText(rawBody.replace(LINK_PREFIX, "")) &&
        !LINK_PREFIX.test(rawBody.trim())
      ? asText(rawBody)
      : null;

  return {
    title: asText(row.content_title) || titleFromJson,
    body: prose,
    description: descFromJson || asText(metadata.description),
    link: asText(row.content_url) || extractUrl(rawBody),
  };
}

/**
 * Best available objective text for an AI chat activity. The stored body is
 * usually a JSON descriptor, and the actual student-facing prompt lives in
 * metadata.
 */
export function aiChatObjective(
  row: RawContentRow,
  fallback?: string | null,
): string {
  const normalized = normalizeContentBlock(row);
  const suggested = asText(row.metadata?.suggested_prompt);

  return (
    normalized.body ||
    normalized.description ||
    suggested ||
    asText(fallback) ||
    ""
  );
}
