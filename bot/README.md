# ProjectSeed Discord bot

Records who was actually in voice, reminds people about the hours they declared,
and answers `/stats`. Linear: PS-213.

It is a long-running gateway client, not a serverless function — Discord voice
state arrives over a persistent WebSocket, so it needs a process that stays up
(Railway, Fly, or any small VM). Everything it writes goes through
`service_role`-only functions; see
`supabase/migrations/20260801000000_projectseed_bot_rpcs.sql`.

## Running

```bash
pnpm bot:register   # once, and after changing any slash command
pnpm bot:dev        # local, reads .env.local
pnpm bot:start      # production
```

## Environment

| Variable | Required | Notes |
|---|---|---|
| `DISCORD_BOT_TOKEN` | yes | Regenerate in the Discord developer portal if it 401s |
| `DISCORD_GUILD_ID` | yes | |
| `DISCORD_REMINDER_CHANNEL_ID` | yes | Text channel the reminders post to |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | |
| `PSEED_COHORT_SLUG` | no | Defaults to `alumni-mvp` |
| `PSEED_VOICE_CHANNEL_IDS` | no | Comma-separated. Empty means every voice channel |
| `PSEED_REMINDER_INTERVAL_MS` | no | Defaults to 60000 |

## Discord setup

Intents — enable **Server Members** is *not* required; the bot needs:

- `Guilds`
- `Guild Voice States`
- `Direct Messages`

Permissions in the guild: `View Channels`, `Send Messages`, `Use Slash Commands`
on the reminder channel, and `View Channel` + `Connect` on the voice channels it
should observe. It never speaks in voice and never needs `Connect` to transmit.

## What it does

**Voice presence.** `voiceStateUpdate` opens and closes rows in
`pseed_voice_sessions`. Mute, deafen, stream and camera all fire the same event
with an unchanged channel, so only a channel change counts as presence.

On startup it closes every open session in the cohort and re-opens for whoever
is genuinely in voice right now. While the process is down no leave events
arrive, so an untouched open row would bank hours nobody was present for.
Shutdown closes sessions for the same reason. `pseed_voice_close_all` caps a
recovered session at four hours.

**Reminders.** Polls `pseed_due_reminders` once a minute — that RPC applies each
person's lead time and `notify_min_people`, and excludes anyone already in
`pseed_reminder_log`. Channel post first, then DMs. The log is written only
after a send resolves: a crash then resends next tick, and a duplicate ping is
better than a silently dropped one.

**`/stats`.** Ephemeral, guild-only. Someone else's hours are theirs to share,
so a public reply would turn `/stats @someone` into a way to put a quiet week on
display.

## Safeguarding constraints — not optional

`docs/project/PROJECTSEED-SAFEGUARDING.md` §3 permits bot DMs under three rules,
and the code implements all three. Do not relax them without changing that
policy first.

1. **Broadcast only, never conversational.** The bot never asks a question or
   invites a reply.
2. **Replies are refused, not read.** `dm-guard.ts` answers a DM once per hour
   with a fixed refusal. It never reads `message.content`, never stores it, and
   never surfaces it to a mentor.
3. **Anything that matters is also in the channel.** The channel post is the
   record; a DM is a convenience on top of it, never the only copy.

The reason is stated in the policy: a bot cannot groom anyone, but a Discord
bot's name and avatar are trivially copied by an ordinary account. If students
learn ProjectSeed sometimes DMs them, they lose the clean signal that a private
message claiming to be from us is always wrong.

Voice presence is behavioural data about minors. Retention and what parents are
told must be decided before this runs against a cohort containing any.
