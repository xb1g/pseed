/**
 * Portfolio links are public-writable (the signup form inserts as anon), so a
 * submitted string can be `javascript:` or `data:`. Return the URL only when it
 * is safe to put in an href; callers render plain text otherwise.
 *
 * Kept apart from `lib/talent.ts` so client components can import it without
 * dragging in the server-only Supabase client.
 */
export function safeExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}
