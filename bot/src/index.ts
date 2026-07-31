import { Client, GatewayIntentBits, Partials } from "discord.js";

import { loadEnv } from "./env";
import { createDb, resolveCohortId } from "./db";
import { registerVoiceTracking, reconcileVoiceState } from "./voice";
import { startReminderLoop } from "./reminders";
import { registerDmGuard } from "./dm-guard";
import { registerCommands, registerInteractions } from "./commands";

async function main(): Promise<void> {
  const env = loadEnv();
  const db = createDb(env);
  const cohortId = await resolveCohortId(db, env.cohortSlug);

  console.log(`ProjectSeed bot starting — cohort ${env.cohortSlug} (${cohortId})`);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      // Voice states are what presence is measured from.
      GatewayIntentBits.GuildVoiceStates,
      // DirectMessages plus MessageContent are needed only so the DM guard can
      // notice a message arrived. It never reads the content — see dm-guard.ts.
      GatewayIntentBits.DirectMessages,
    ],
    // Without the Channel partial, a DM from someone the bot has never messaged
    // arrives with an uncached channel and the guard silently never fires.
    partials: [Partials.Channel, Partials.Message],
  });

  registerVoiceTracking(client, db, env, cohortId);
  registerDmGuard(client);
  registerInteractions(client, db, cohortId);

  let reminderTimer: NodeJS.Timeout | null = null;

  client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user?.tag}`);

    try {
      await reconcileVoiceState(client, db, env, cohortId);
    } catch (error) {
      console.error("[startup] voice reconcile failed:", error);
    }

    reminderTimer = startReminderLoop(client, db, env, cohortId);
    console.log(`Reminder loop running every ${env.reminderIntervalMs}ms`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down`);
    if (reminderTimer) clearInterval(reminderTimer);

    // Close open sessions on the way out. Without this every session stays open
    // until the next startup reconcile, and a redeploy would bank the gap as
    // time somebody spent in voice.
    try {
      const { closeAllVoiceSessions } = await import("./db");
      await closeAllVoiceSessions(db, cohortId);
    } catch (error) {
      console.error("[shutdown] failed to close sessions:", error);
    }

    await client.destroy();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  if (process.argv.includes("--register-commands")) {
    await registerCommands(env);
  }

  await client.login(env.discordToken);
}

main().catch((error) => {
  console.error("Bot failed to start:", error);
  process.exit(1);
});
