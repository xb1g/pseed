# Meta backfill scheduler

This Deno Deploy service runs Meta history backfill directly against the
production Supabase database every 15 minutes. Vercel is not in the background
execution path. A second daily cron refreshes normalized Contester and Devpost
source records and promotes explicitly high-school-eligible Contester listings.

## Deno Deploy configuration

Deploy this directory as the application's source root; its `deno.json` points
Deno Deploy at `main.ts`. Configure the Deno application with these
production-only secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `META_PAGE_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`

Do not configure production credentials in Deno's Development context. Cron
definitions exist on branch timelines too, but the handler checks
`DENO_TIMELINE` and mutates data only on `production`.

## Behavior

- Meta schedule: every 15 minutes, UTC;
- competition source schedule: daily at 01:23 UTC;
- overlapping executions: prevented by Deno Deploy;
- transient failures: retried after 1, 5, and 15 minutes;
- completed Graph conversations/media are checkpointed in Supabase;
- each Meta request has a 10-second timeout and the batch has an 8-minute
  budget;
- logs: counts and stable error codes only—no message bodies, usernames, or
  provider response payloads.

## Local verification

```bash
npx -y deno@latest task check:meta-backfill
npx -y deno@latest task test:meta-backfill
```
