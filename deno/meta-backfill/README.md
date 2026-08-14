# Meta backfill scheduler

This small Deno Deploy service schedules the protected PassionSeed Meta backfill
endpoint every 15 minutes. The data work remains in the Next.js route at
`/api/cron/meta-backfill`, so this service needs no Meta or Supabase keys.

## Deno Deploy configuration

Deploy this directory as the application's source root; its `deno.json` points
Deno Deploy at `main.ts`. Configure the Deno application with this production
secret:

- `CRON_SECRET`: the same value configured in Vercel.

Optional:

- `META_BACKFILL_URL`: override the production endpoint for a controlled
  environment. It defaults to
  `https://www.passionseed.org/api/cron/meta-backfill`.

Do not configure production credentials in Deno's Development context. Cron
definitions exist on branch timelines too, but the handler checks
`DENO_TIMELINE` and mutates data only on `production`.

## Behavior

- schedule: every 15 minutes, UTC;
- overlapping executions: prevented by Deno Deploy;
- transient failures: retried after 1, 5, and 15 minutes;
- Meta rate limits and batch deadlines: treated as normal resumable outcomes;
- logs: counts and stable error codes only—no message bodies, usernames, or
  provider response payloads.

## Local verification

```bash
npx -y deno@latest task check:meta-backfill
npx -y deno@latest task test:meta-backfill
```
