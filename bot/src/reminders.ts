import { ChannelType, type Client } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { BotEnv } from "./env";
import { fetchDueReminders, logReminder, type DueReminder } from "./db";

const DAY_NAMES = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

function formatSlot(reminder: DueReminder): string {
  const day = DAY_NAMES[reminder.day_of_week] ?? "?";
  const from = String(reminder.hour_of_day).padStart(2, "0");
  const to = String((reminder.hour_of_day + 1) % 24).padStart(2, "0");
  return `${day} ${from}:00–${to}:00`;
}

/**
 * The channel post is the record.
 *
 * `PROJECTSEED-SAFEGUARDING.md` §3 requires that anything a student is told
 * privately also exists in a channel a second authorized adult can read. So the
 * channel message is built from the whole batch and posted first; a DM is a
 * convenience layered on top of it, never the only copy.
 */
function buildChannelMessage(reminders: DueReminder[]): string {
  const slot = formatSlot(reminders[0]);
  const count = reminders[0].participant_count;
  const names = reminders
    .map((r) => (r.discord_user_id ? `<@${r.discord_user_id}>` : r.display_name))
    .filter(Boolean)
    .join(" ");

  return [
    `**${slot}** กำลังจะเริ่ม — มีคนจองไว้ ${count} คน`,
    names,
    "เจอกันในห้องเสียง",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDmMessage(reminder: DueReminder): string {
  return [
    `**${formatSlot(reminder)}** กำลังจะเริ่ม — มีคนจองช่วงนี้ ${reminder.participant_count} คน`,
    "",
    "_บอทนี้ส่งแค่การแจ้งเตือน ไม่ได้คุยโต้ตอบ — ถ้ามีบัญชี ProjectSeed ทักคุยส่วนตัวกับคุณ นั่นไม่ใช่เรา ให้แจ้งทีมงานในเซิร์ฟเวอร์_",
  ].join("\n");
}

function groupBySlot(reminders: DueReminder[]): Map<string, DueReminder[]> {
  const bySlot = new Map<string, DueReminder[]>();
  for (const reminder of reminders) {
    const bucket = bySlot.get(reminder.slot_start_at);
    if (bucket) bucket.push(reminder);
    else bySlot.set(reminder.slot_start_at, [reminder]);
  }
  return bySlot;
}

async function sendBatch(
  client: Client,
  db: SupabaseClient,
  env: BotEnv,
  reminders: DueReminder[]
): Promise<void> {
  const channelWanted = reminders.filter((r) => r.wants_channel);
  const dmWanted = reminders.filter((r) => r.wants_dm && r.discord_user_id);

  if (channelWanted.length > 0) {
    const channel = await client.channels.fetch(env.reminderChannelId);
    if (channel?.type === ChannelType.GuildText) {
      await channel.send(buildChannelMessage(channelWanted));
      // Logged only after the send resolves. A crash before this point resends
      // next tick, which is the failure we want — a duplicate ping is annoying,
      // a silently dropped one is invisible.
      for (const reminder of channelWanted) {
        await logReminder(db, reminder.participant_id, reminder.slot_start_at, "channel");
      }
    } else {
      console.error(
        `[reminders] DISCORD_REMINDER_CHANNEL_ID is not a text channel: ${env.reminderChannelId}`
      );
    }
  }

  for (const reminder of dmWanted) {
    try {
      const user = await client.users.fetch(reminder.discord_user_id!);
      await user.send(buildDmMessage(reminder));
      await logReminder(db, reminder.participant_id, reminder.slot_start_at, "dm");
    } catch (error) {
      // Closed DMs are the expected case, not an error: onboarding tells people
      // to disable server-member DMs, and that setting also blocks the bot. The
      // channel post already covered them.
      console.warn(
        `[reminders] could not DM ${reminder.discord_user_id}:`,
        error instanceof Error ? error.message : error
      );
      await logReminder(db, reminder.participant_id, reminder.slot_start_at, "dm");
    }
  }
}

export function startReminderLoop(
  client: Client,
  db: SupabaseClient,
  env: BotEnv,
  cohortId: string
): NodeJS.Timeout {
  let running = false;

  const tick = async () => {
    // A slow tick must not overlap the next one, or the same slot gets sent
    // twice before either run reaches the log.
    if (running) return;
    running = true;

    try {
      const due = await fetchDueReminders(db, cohortId);
      if (due.length === 0) return;

      for (const batch of groupBySlot(due).values()) {
        await sendBatch(client, db, env, batch);
      }
    } catch (error) {
      console.error("[reminders] tick failed:", error);
    } finally {
      running = false;
    }
  };

  void tick();
  return setInterval(tick, env.reminderIntervalMs);
}
