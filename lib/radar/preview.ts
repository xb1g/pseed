import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Local preview of unpublished Radar content.
 *
 * Radar content has to be staged: rows land in the production database before
 * the code that renders them is deployed, so publishing early puts dead tiles
 * in front of real visitors. Preview mode lets a developer see the unpublished
 * territory locally while production keeps serving only published rows.
 *
 * Three conditions, all required, so this cannot leak into production:
 *   1. NODE_ENV is not "production" — false for `next build` on Vercel.
 *   2. RADAR_PREVIEW_UNPUBLISHED is explicitly "true".
 *   3. A service role key is present to read past RLS.
 *
 * Condition 1 alone is sufficient; 2 and 3 exist so that a developer running a
 * normal `pnpm dev` still sees exactly what visitors see, by default.
 */
export function isRadarPreview(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.RADAR_PREVIEW_UNPUBLISHED === "true" &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * Read client for Radar surfaces. Service role in preview so unpublished rows
 * are visible; anon otherwise, which keeps every RLS policy in force.
 *
 * Untyped on purpose: the radar_skills family predates the generated types.
 */
export function radarReadClient<DB = any>(): SupabaseClient<DB> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing Supabase environment variables");

  const preview = isRadarPreview();
  const key = preview
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing Supabase environment variables");

  return createClient<DB>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Applies an `is_published` filter unless preview mode is on. Written as a
 * helper so no caller can forget the preview branch and silently hide content.
 *
 * The cast is deliberate: constraining the generic to the PostgREST builder's
 * own shape makes TypeScript walk its recursive type and bail with TS2589, so
 * the filter is applied through a minimal structural type and the caller's
 * original builder type is handed straight back.
 */
type PublishFilterable = { eq(column: string, value: boolean): unknown };

export function wherePublished<T>(query: T, column = "is_published"): T {
  if (isRadarPreview()) return query;
  return (query as PublishFilterable).eq(column, true) as T;
}
