# DM Copilot — install

Internal Chrome extension for the PassionSeed team. It reads the open Instagram
DM thread, asks `/api/copilot/advise` for the playbook bucket + drafts, and
pastes the chosen reply into IG's compose box. **It never sends a message on
your behalf** — you press send in IG, exactly as you do today.

## One-time setup

### 1. Apply the migration

```bash
supabase db push
```

This creates `dm_copilot_tokens` and `dm_copilot_audit_log` in production.

### 2. Mint a token

Open `/admin/dm-leads/copilot` and click **สร้าง token**. Give it a name like
`boon macbook`. The raw token (`psdmlp_…`) is shown once with a copy button —
save it somewhere safe, you cannot retrieve it again. Anyone with this string
can hit the copilot API as you until you revoke it.

Default TTL is 90 days. You can rotate / revoke from the same page at any
time.

### 3. Build the extension

Chrome cannot load TypeScript, so the sources are bundled into
`extension/dist` (gitignored) before loading:

```bash
pnpm build:extension
```

Re-run this after any edit under `extension/`, then hit **reload** on the
extension card in `chrome://extensions`.

### 4. Load the extension unpacked

```bash
# Chrome → chrome://extensions → toggle "Developer mode" → "Load unpacked"
# pick /Users/bunyasit/dev/pseed/extension/dist  (the dist dir, not extension/)
```

The extension icon appears in your toolbar. Pin it for easy access.

### 5. Paste the token

Click the extension icon → paste the bearer + the API base URL
(`https://www.passionseed.org` by default). Click **Save**. You only do this
once per machine.

## Day-to-day use

1. Open a DM thread on `instagram.com/direct/t/<id>`.
2. The copilot tray appears in the lower-right corner. It shows the lead's
   bucket label, the coverage offer, and the messaging-window status:
   - 🟢 `window · <24h` — safe to reply from the admin inbox or in IG.
   - 🟡 `window · 24h-7d` — IG blocks the auto-send path; reply from IG by
     hand, the tray still works.
   - 🔴 `window · closed` — neither API nor IG can reply until the lead writes
     again. The tray greys out the chips.
3. Click a chip to paste its body into IG's compose box. Edit, then press send
   in IG.
   Under the playbook chips sits **🤖 ตอบตามบทสนทนา**: drafts written from the
   thread itself, for the questions the ladder has no chip for. They obey the
   same guardrails (no invented dates, prices, or links) and disappear
   silently when the model is unreachable.
   The lead's @handle is optional. Without it the playbook still runs off the
   messages; what you lose is stored lead context and the outbound log.
4. `/api/copilot/log` writes the outbound to `dm_messages` so the playbook log
   in `/admin/dm-leads` stays correct.

## Debugging: the DevTools panel

Open DevTools on the Instagram tab → **DM Copilot** tab. It shows the whole
pipeline in one place, which the tray cannot: API base, whether a token is
stored, whether both content scripts loaded, the parsed path / username /
message count / compose box, and the last advise result or rejection reason.

- **Rescan thread** forces a fresh DOM read (IG mutates lazily).
- **Test token** hits `/api/copilot/ping` and logs the reason on failure.
- **Load full history** scrolls the thread back until IG stops rendering
  older messages (IG virtualises the list, so only rendered bubbles exist),
  then rescans. Capped at 25 passes / 20s.
- **Clear log** empties the buffer.

The buffer lives in `chrome.storage.session`, capped at 300 entries, and dies
with the browser session. It holds metadata only, never message bodies.

## What it does NOT do

- It does not call the Send API. All bytes go through your logged-in IG
  session.
- It does not bypass Meta's 7-day window in IG itself.
- It does not introduce new copy. The chips and scripts come from the same
  `lib/dm-leads/playbook.ts` and `lib/dm-leads/scripts.ts` modules the admin
  inbox uses.
- It does not see any thread you don't have open in IG. Cold threads the lead
  never replied to do not appear unless you open them.

## If a token leaks

Open `/admin/dm-leads/copilot`, find the row, click **revoke**. The next
request from the leaked bearer returns `401`. The audit table keeps a record
of which bearer hit which endpoint when, so you can see how far it got.

## Uninstall

`chrome://extensions` → Copilot → **Remove**. Tokens you created are still
listed under `/admin/dm-leads/copilot` until you revoke them by hand.
