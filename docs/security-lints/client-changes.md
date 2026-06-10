# Required Client-Side Code Change

Enabling RLS on `public.hackathon_team_matching_waitlist` requires migrating the three
team-matching routes from the anon cookie client to the service-role client. This is
**safe**: each route already authenticates the participant in-code via
`getSessionParticipant(token)` (custom hackathon session — these users are NOT Supabase
auth users, so `auth.uid()` is NULL and RLS policies keyed on it cannot work). The
authorization check stays; only the DB client changes. This matches the pattern already
used by `app/api/hackathon/push-subscribe/route.ts`.

## Files to change (3)
- `app/api/hackathon/team/match/status/route.ts`
- `app/api/hackathon/team/match/join/route.ts`
- `app/api/hackathon/team/match/cancel/route.ts`

## Change (each file)
Replace the SSR cookie client with a service-role client.

**Remove:**
```ts
import { createClient } from "@/utils/supabase/server";
...
const supabase = await createClient();
```

**Add** (top of file):
```ts
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```
**Replace the call site:**
```ts
const supabase = getServiceClient();
```

## Constraints
- Do NOT remove or weaken the `getSessionParticipant(token)` auth gate or the
  `if (!token) return 401` / `if (!participant) return ...` checks. Authorization must
  stay enforced in code since RLS is now bypassed.
- Keep every query scoped by `participant.id` exactly as before — do not broaden what
  rows a request can touch.
- `cookies()` / `SESSION_COOKIE` reads stay (that's how the participant token is found);
  only the Supabase DB client construction changes.
- Verify no other code in these files relied on the SSR client's auth context.

## Verify after change
- `pnpm build` / `pnpm lint` pass.
- `grep -rn "utils/supabase/server" app/api/hackathon/team/match/` returns nothing.
- Manual: join → status → cancel matching flow still works (orchestrator QA step).
