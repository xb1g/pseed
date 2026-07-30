import type { User } from "@supabase/supabase-js";

/**
 * What we keep from a linked Discord identity.
 *
 * `userId` is the snowflake. It is the only field the phase-2 bot can join on —
 * usernames are mutable and avatars are cosmetic — so it is the field that has
 * to survive every sync.
 */
export interface DiscordIdentity {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
}

interface DiscordIdentityData {
  provider_id?: string | null;
  sub?: string | null;
  user_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  preferred_username?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
}

/**
 * Reads the Discord identity off the Supabase user, whether it arrived through
 * `signInWithOAuth` (Discord was the signup provider) or `linkIdentity` (an
 * existing Google/email account added it later). Both land in the same array,
 * which is why the hub never has to care which route the user took.
 */
export function extractDiscordIdentity(user: User | null): DiscordIdentity | null {
  const identity = user?.identities?.find((i) => i.provider === "discord");
  if (!identity) return null;

  const data = (identity.identity_data ?? {}) as DiscordIdentityData;
  const userId = identity.id || data.provider_id || data.sub || null;
  if (!userId) return null;

  return {
    userId: String(userId),
    username:
      data.user_name ??
      data.preferred_username ??
      data.full_name ??
      data.name ??
      null,
    avatarUrl: data.avatar_url ?? data.picture ?? null,
  };
}

export function hasDiscordIdentity(user: User | null): boolean {
  return extractDiscordIdentity(user) !== null;
}
