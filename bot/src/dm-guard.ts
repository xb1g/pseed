import { ChannelType, type Client, type Message } from "discord.js";

/**
 * The bot refuses conversation.
 *
 * `PROJECTSEED-SAFEGUARDING.md` §3, constraint 2: a DM to the bot gets one
 * automated answer and nothing else. It must not forward, log, or surface DM
 * content to a mentor — so this handler never reads `message.content`, never
 * stores it, and never notifies anyone. Deliberately not "reply with something
 * helpful": a bot that answers questions privately is the thing the rule
 * exists to prevent.
 */
const REFUSAL = [
  "บอทนี้ส่งแค่การแจ้งเตือน ไม่ได้คุยโต้ตอบ และไม่มีใครอ่านข้อความนี้",
  "ถ้ามีอะไรอยากถาม โพสต์ในช่องของรุ่นได้เลย — พี่เลี้ยงอยู่ตรงนั้น",
].join("\n");

/** One reply per person per hour. A refusal that repeats is its own spam. */
const COOLDOWN_MS = 60 * 60 * 1000;

export function registerDmGuard(client: Client): void {
  const lastReplyAt = new Map<string, number>();

  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (message.channel.type !== ChannelType.DM) return;

    const now = Date.now();
    const previous = lastReplyAt.get(message.author.id) ?? 0;
    if (now - previous < COOLDOWN_MS) return;
    lastReplyAt.set(message.author.id, now);

    try {
      await message.reply(REFUSAL);
    } catch (error) {
      console.warn(
        "[dm-guard] could not reply:",
        error instanceof Error ? error.message : error
      );
    }
  });
}
