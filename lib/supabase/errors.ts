/**
 * Detects whether an error is a request abort/cancellation.
 * Handles both native DOM `AbortError` and Supabase/PostgREST's
 * wrapped abort error objects.
 */
export function isAbortError(error: unknown): boolean {
  if (!error) return false;

  // Native DOM/Node AbortError thrown from fetch
  if (error instanceof Error && error.name === "AbortError") return true;

  // Supabase/PostgREST wraps abort details in an error object
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (e.message === "signal is aborted without reason") return true;
    if (typeof e.details === "string" && e.details.includes("AbortError")) return true;
    if (typeof e.hint === "string" && e.hint.includes("aborted")) return true;
  }

  return false;
}
