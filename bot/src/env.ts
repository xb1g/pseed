/**
 * Bot configuration, validated once at startup.
 *
 * Fails loudly and immediately rather than at the first Discord call: a bot
 * that connects to the gateway and then discovers it has no Supabase key will
 * sit there looking healthy while silently recording nothing.
 */

export interface BotEnv {
  discordToken: string;
  guildId: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  /** Text channel the reminders are posted to. */
  reminderChannelId: string;
  cohortSlug: string;
  /** Voice channels to record. Empty means every voice channel in the guild. */
  voiceChannelIds: string[];
  reminderIntervalMs: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadEnv(): BotEnv {
  return {
    discordToken: required("DISCORD_BOT_TOKEN"),
    guildId: required("DISCORD_GUILD_ID"),
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    reminderChannelId: required("DISCORD_REMINDER_CHANNEL_ID"),
    cohortSlug: process.env.PSEED_COHORT_SLUG?.trim() || "alumni-mvp",
    voiceChannelIds: (process.env.PSEED_VOICE_CHANNEL_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    // Once a minute. Lead times are set in whole minutes, so polling faster
    // buys nothing and polling slower makes a 5-minute lead unreliable.
    reminderIntervalMs: Number(process.env.PSEED_REMINDER_INTERVAL_MS ?? 60_000),
  };
}
