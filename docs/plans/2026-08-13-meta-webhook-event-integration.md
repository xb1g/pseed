# Meta webhook event integration plan

**Status:** Implemented locally; migration and deployment pending  
**Date:** 13 August 2026  
**Surface:** `POST /api/meta/webhook`  
**Motivating production request:** Vercel request `8rvsd-1786636634686-833e6c7b8993`, received 13 August 2026 at 22:57:14 GMT+7, returned 200 with no database or external calls.

## Outcome

Every valid Meta webhook request must leave an internal, queryable receipt explaining what arrived and what PassionSeed did with it.

User-generated content should appear in the appropriate DM conversation. Operational events should remain out of the student-facing transcript while still being available to admins for delivery diagnostics.

The target behavior is:

| Meta event | Product behavior | Audit behavior |
| --- | --- | --- |
| Text message | Add or deduplicate a DM message | Record `processed` and link the message |
| Image, video, audio, file, sticker, or shared content | Add an attachment message to the thread | Record attachment types and processing result |
| Quick reply or postback | Add the user's selected action to the thread | Preserve the machine payload in metadata |
| Reaction | Show/update the reaction on the target message | Record target message ID and reaction action |
| Message echo | Reconcile the outbound message with Meta's message ID | Record `processed`; do not create a second bubble |
| Delivery receipt | Update outbound delivery state | Record watermark/message IDs |
| Read receipt | Update outbound read state | Record the read watermark |
| Comment change | Continue the existing comment upsert flow | Record and link the comment |
| Referral, opt-in, account linking, standby, unsupported change, or unknown event | Do not add a chat bubble | Record `ignored` with a precise reason and safe payload metadata |

## Current behavior and verified gaps

The current handler in `app/api/meta/webhook/route.ts`:

1. verifies `X-Hub-Signature-256`;
2. treats `body.object === "instagram"` as Instagram and every other object as Facebook;
3. processes only `event.message.text` when it is not an echo;
4. processes only `changes[].field === "comments"`;
5. silently skips every other valid payload;
6. returns `EVENT_RECEIVED` with status 200 even when zero events were handled.

Consequences:

- attachments, reactions, postbacks, delivery/read receipts, and unknown events disappear;
- Vercel's 200 response cannot distinguish “stored,” “duplicate,” or “ignored”;
- Meta retries can fail repeatedly because inbound message insertion is not idempotent even though `platform_message_id` is unique;
- an unsupported `object` value is mislabeled as Facebook;
- the route mixes payload parsing, persistence, username enrichment, and lead classification, making event coverage difficult to test.

## Scope

### Included

- Instagram and Facebook messaging payloads delivered to the existing endpoint.
- Text, attachments, quick replies, postbacks, reactions, echoes, delivery receipts, and read receipts.
- Existing Instagram comment changes.
- A private request/event audit trail with explicit processing outcomes.
- Idempotency across Meta retries and backfills.
- Attachment and event rendering in the existing admin DM transcript.
- Privacy-safe structured runtime logs.
- Unit, persistence, route, RLS, and UI tests.
- A short retention policy for raw failed/unknown payloads.

### Excluded

- Sending media or reactions from the PassionSeed admin inbox.
- Automatic AI interpretation of images, audio, or files.
- Historical backfill of delivery/read events that Meta no longer exposes.
- Changing lead classification based solely on operational events.
- Public or student access to webhook audit records.
- Replacing Meta webhooks with polling.

## Design principles

1. **A 200 means durably accounted for.** Return 200 only after the valid request has a receipt and each contained event has a recorded outcome. Return 5xx on transient persistence failure so Meta can retry.
2. **One event, one normalized kind.** Payload shape detection lives in a pure parser, separate from database writes.
3. **Retries are normal.** Every business mutation must be idempotent. Duplicate delivery is a successful `duplicate`, not an error.
4. **Conversation state follows human content.** Delivery/read/echo events must not move `last_message_at`, change `last_message_direction`, trigger “needs reply,” or enter the lead classifier.
5. **Unknown does not mean lost.** Unsupported events receive a durable `ignored` record with a reason and enough metadata to add support later.
6. **Raw payload access is exceptional.** Supported events retain normalized fields. Only failed and unknown events retain the event payload temporarily.

## Proposed data model

Create a new additive migration after `20260813200000_dm_leads_management.sql`.

Implemented as `supabase/migrations/20260813220000_meta_webhook_event_integration.sql`.

### `meta_webhook_receipts`

One row per valid signed POST, including requests with no supported events.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` PK | Internal receipt ID |
| `provider` | `text` | `meta` for now |
| `provider_request_id` | `text null` | `x-vercel-id`, `x-request-id`, or another available request identifier |
| `object_type` | `text` | Original Meta `body.object`; never silently coerce |
| `body_sha256` | `text` | Correlate retries without retaining the entire request |
| `entry_count` | `integer` | Number of `entry[]` items |
| `event_count` | `integer` | Number of normalized event candidates |
| `processed_count` | `integer` | Successfully applied events |
| `duplicate_count` | `integer` | Already-applied events |
| `ignored_count` | `integer` | Intentionally unsupported/operational no-op events |
| `failed_count` | `integer` | Events that failed processing |
| `status` | `text` | `received`, `processed`, `partial`, or `failed` |
| `received_at` | `timestamptz` | Server receipt time |
| `completed_at` | `timestamptz null` | Processing completion time |
| `error_code` | `text null` | Stable internal code, never raw secrets |

Indexes: `received_at desc`, `body_sha256`, `status where status <> 'processed'`.

### `meta_webhook_events`

One row per event candidate found inside a receipt. Duplicate attempts are retained, because they prove that Meta retried; idempotency is enforced on the destination entities.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` PK | Event-attempt ID |
| `receipt_id` | `uuid` FK | Parent request receipt |
| `dedupe_key` | `text` | Stable event identity or deterministic hash |
| `event_kind` | `text` | Normalized event type |
| `processing_status` | `text` | `processed`, `duplicate`, `ignored`, or `failed` |
| `skip_reason` | `text null` | Stable reason such as `message_echo_without_match` |
| `source_event_id` | `text null` | Meta `mid`, comment ID, postback ID, or target ID when present |
| `conversation_id` | `uuid null` FK | Linked DM conversation |
| `dm_message_id` | `uuid null` FK | Linked DM message |
| `ig_comment_id` | `uuid null` FK | Linked comment |
| `occurred_at` | `timestamptz null` | Source event timestamp |
| `payload_metadata` | `jsonb` | Normalized safe metadata |
| `raw_payload` | `jsonb null` | Only for unknown or failed events, retained temporarily |
| `created_at` | `timestamptz` | Processing time |

Indexes: `receipt_id`, `dedupe_key`, `(event_kind, created_at desc)`, `processing_status where processing_status in ('failed', 'ignored')`, and `conversation_id where conversation_id is not null`.

RLS: enable RLS; admin-only SELECT; no authenticated client INSERT/UPDATE/DELETE. The service-role webhook bypasses RLS. Never expose this table through a public route.

### Extend `dm_messages`

Add:

- `message_type text not null default 'text'` with allowed values `text`, `attachment`, `quick_reply`, `postback`, and `system`;
- `metadata jsonb not null default '{}'` for quick-reply payloads and Meta-specific message metadata;
- `send_status text null` with `pending`, `sent`, `delivered`, `read`, and `failed` for outbound messages;
- `delivered_at timestamptz null`;
- `read_at timestamptz null`.

Keep `body` non-null. For attachment-only messages, generate a stable human-readable fallback such as `[Image]`, `[Audio]`, or `[3 attachments]`. Classification must use only inbound text-bearing `text`, `quick_reply`, and `postback` messages.

### `dm_message_attachments`

Store one row per attachment:

- `id uuid`;
- `message_id uuid` FK with cascade delete;
- `attachment_type text`;
- `source_url text null`;
- `title text null`;
- `payload jsonb not null default '{}'` containing only supported metadata;
- `created_at timestamptz`.

The first release may render Meta's source URL directly. Persistent media ingestion into Supabase Storage is a follow-up because downloading media inside the webhook would increase latency and retry risk. The UI must clearly handle expired or unavailable URLs.

### `dm_message_reactions`

Store current reaction state separately:

- target `message_id` when it can be resolved, plus the raw target `platform_message_id`;
- actor platform ID;
- reaction value;
- action (`react` or `unreact`);
- source timestamp;
- unique key on target platform message + actor.

An `unreact` removes or marks the current reaction without creating a chat bubble.

## Normalized event contract

Add `lib/meta/webhook-events.ts` containing:

- complete TypeScript input types for the Meta shapes accepted by this endpoint;
- a discriminated `NormalizedMetaEvent` union;
- `parseMetaWebhook(raw: unknown): ParseResult`;
- `eventDedupeKey(event)`;
- no database, network, or environment access.

Normalized kinds:

```text
message.text
message.attachment
message.quick_reply
message.echo
message.reaction
messaging.postback
messaging.delivery
messaging.read
comment.created_or_updated
messaging.referral
messaging.optin
messaging.account_linking
messaging.standby
change.unsupported
event.unknown
```

Parsing rules:

- accept only recognized `object` values; unsupported objects are audited and ignored, not labeled Facebook;
- an event may contain text and attachments; normalize both into one message event so it produces one transcript bubble;
- preserve `message.mid` as the primary message dedupe key;
- use comment IDs for comment dedupe;
- use target message ID + actor + timestamp/action for reactions;
- use deterministic SHA-256 of a canonicalized event for event types without a provider ID;
- never throw merely because optional fields are missing; return `event.unknown` with a reason;
- reject malformed top-level JSON with 400, and invalid signatures with 401, without inserting attacker-controlled audit rows.

## Processing flow

Refactor `app/api/meta/webhook/route.ts` into a thin coordinator:

1. Read the raw body once.
2. Verify the signature against the exact raw bytes.
3. Parse JSON safely. Return 400 for invalid JSON.
4. Insert `meta_webhook_receipts(status = 'received')` before event handling.
5. Normalize all `entry.messaging` and `entry.changes` candidates.
6. Process each normalized event independently and insert a corresponding audit event.
7. Update receipt counters and final status.
8. Emit one structured log containing receipt ID, event counts, status, and duration. Do not log message bodies, attachment URLs, access tokens, usernames, or raw sender IDs.
9. Return `EVENT_RECEIVED` with 200 when all event outcomes are durable. Return 500 if the receipt or an intended business write cannot be persisted.

Move event effects into `lib/meta/process-webhook-event.ts`. Keep each handler small:

- `processInboundMessage`
- `processEcho`
- `processReaction`
- `processPostback`
- `processDelivery`
- `processRead`
- `processComment`
- `recordIgnoredEvent`

Classification and username enrichment happen only after a new inbound human-content message is successfully created. Username lookup failure remains non-fatal and is recorded as metadata, because loss of enrichment must not cause Meta to retry an otherwise stored message.

## Idempotency and ordering

### Inbound messages

Replace the current plain insert in `recordInboundMessage` with an idempotent upsert on `platform_message_id`. The function should return `{ conversation, message, outcome: 'created' | 'duplicate' }`.

A duplicate must not:

- advance `last_message_at`;
- change `last_message_direction`;
- rerun classification unnecessarily;
- create duplicate attachments;
- return 500.

### Outbound messages and echoes

Change `sendMetaMessage` to return Meta's message ID. Update the existing outbound row with that ID and `send_status = 'sent'`. If the echo arrives first, reconcile by the Meta ID when possible; otherwise retain an audited ignored echo rather than creating another outbound message.

Record send failure on the existing outbound row with `send_status = 'failed'` and safe error metadata. This preserves the current insert-before-send behavior while making the state truthful.

### Delivery/read receipts

Use event message IDs where present. Where Meta provides only a watermark, update eligible outbound messages at or before that timestamp using monotonic transitions:

```text
pending -> sent -> delivered -> read
```

Never regress a status when events arrive out of order. `read_at` implies delivered, but preserve both timestamps when available.

### Conversation ordering

Only inbound/outbound human content updates conversation recency and turn ownership. Reactions, delivery/read receipts, echoes, and audit events do not reorder the inbox.

## Admin experience

Update both transcript surfaces that consume `DmConversationWithMessages`:

- `components/admin/DmLeadDetailPane.tsx`;
- `app/admin/dm-leads/[id]/page.tsx`.

Rendering requirements:

- image attachments show a constrained thumbnail and open in a safe new tab;
- audio/video use native controls where the source remains available;
- files show type/title and a download/open action;
- unavailable or expired media shows “Attachment no longer available,” not a broken empty bubble;
- quick replies and postbacks show their human-readable title, with payload hidden from the main transcript;
- reactions appear next to their target message;
- outbound bubbles show sent/delivered/read/failed state unobtrusively;
- operational audit events do not appear in the transcript.

Add a minimal admin-only diagnostics section or page listing recent webhook receipts, filterable by status and kind. It should show receipt ID, received time, counts, outcome, skip reason, linked conversation, and retry count signals. Raw payload access should require an explicit expand action and appear only for failed/unknown events.

Before implementing this UI, read `docs/ui-design-system.md` as required by the project instructions.

## Privacy and retention

- Do not write raw request bodies to Vercel logs.
- Do not put message content, usernames, attachment URLs, or sender IDs in structured logs.
- Store normalized supported-event metadata indefinitely with the lead record.
- Store `raw_payload` only for `failed` and `unknown` audit events.
- Delete raw payload bodies after 30 days while retaining the event kind, hash, outcome, timestamps, and reason.
- Implement cleanup with the project's available `pg_cron` support; the cleanup must only set `raw_payload = null`, not delete audit rows.
- Admin-only RLS applies to audit, attachment, and reaction tables.
- Attachment URLs may carry access capability. Never expose them outside an authenticated admin context.

## File-by-file implementation map

| File | Planned change |
| --- | --- |
| `app/api/meta/webhook/route.ts` | Thin verification, receipt lifecycle, normalization, dispatch, final response |
| `lib/meta/webhook-events.ts` | New pure parser, event union, dedupe-key generation |
| `lib/meta/process-webhook-event.ts` | New event dispatcher and per-kind processing functions |
| `lib/meta/graph.ts` | Return outbound message ID; keep username lookup non-fatal |
| `lib/supabase/dm-leads.ts` | Idempotent message writes, attachment/reaction/status persistence |
| `lib/supabase/meta-webhook-events.ts` | New audit receipt/event persistence API |
| `types/dm-leads.ts` | Message type, metadata, attachment, reaction, and send-state types |
| `components/admin/DmLeadDetailPane.tsx` | Render content types, reactions, and send state |
| `app/admin/dm-leads/[id]/page.tsx` | Match the split-pane transcript behavior |
| `app/admin/meta-webhooks/page.tsx` | New admin-only diagnostics surface |
| `supabase/migrations/<timestamp>_meta_webhook_events.sql` | Add audit and message-content schema, RLS, indexes, retention job |
| `app/api/meta/webhook/route.test.ts` | Signature, response, retry, and partial-failure behavior |
| `lib/meta/webhook-events.test.ts` | Payload fixture coverage for every normalized kind |
| `lib/meta/process-webhook-event.test.ts` | Idempotency and event-effect tests |
| `components/admin/DmLeadDetailPane.test.tsx` | Attachment/reaction/status rendering and unavailable media |

Do not overwrite unrelated, currently uncommitted DM-inbox work. Re-read the live versions of these files before implementation and merge around existing changes.

## Test matrix

### Parser tests

- Instagram text message.
- Facebook text message.
- Text plus one or multiple attachments.
- Attachment without text.
- Quick reply payload.
- Postback payload.
- Reaction and un-reaction.
- Echo.
- Delivery with message IDs.
- Delivery/read with watermark only.
- Existing comment change.
- Unsupported change field.
- Unknown messaging object.
- Missing optional sender/message/timestamp fields.
- Malformed top-level JSON.
- Unsupported `body.object`.

Use committed synthetic fixtures. Never commit copied production payloads containing student identifiers or content.

### Persistence tests

- Replaying the same text event creates one `dm_messages` row and two audit attempts.
- Replaying attachments creates no duplicate attachment rows.
- An un-reaction leaves no active duplicate reaction.
- Read-before-delivered does not regress state when delivery arrives later.
- Operational events do not change conversation recency or turn direction.
- Unknown/failed payloads retain raw data initially; cleanup nulls it after the retention window.
- RLS blocks non-admin reads and all authenticated-client mutations.

### Route tests

- Valid signature + supported event returns 200 after persisted outcome.
- Valid signature + ignored event returns 200 with an `ignored` audit row.
- Valid signature + zero event candidates returns 200 with a receipt explaining zero candidates.
- Invalid signature returns 401 and creates no audit row.
- Invalid JSON with a valid signature returns 400.
- Transient Supabase failure returns 500 so Meta retries.
- Duplicate retry returns 200 and is marked duplicate.
- Username enrichment failure does not fail a stored message.

### UI tests

- Each attachment type renders an accessible label.
- Expired attachment fallback remains readable.
- Reaction attaches to the intended message.
- Failed outbound state is visible without exposing provider errors.
- Operational events remain absent from the lead transcript.

## Rollout

### Phase 1: Audit first

Ship receipt/event tables, parser, structured summary logs, and current text/comment processing through the new dispatcher. Do not enable new transcript types yet.

Success gate: for 24 hours, every valid production POST has a receipt whose event counts sum correctly. Compare Vercel invocation count with receipt count, allowing invalid-signature requests to be absent.

### Phase 2: Content events

Enable attachments, quick replies, postbacks, and reactions. Deploy the transcript rendering at the same time so stored content is immediately usable by admins.

Success gate: synthetic signed events and at least one controlled Instagram test per event class create exactly one visible normalized result.

### Phase 3: Delivery lifecycle

Enable echo reconciliation and sent/delivered/read/failed states. Update outbound send persistence to store Meta message IDs.

Success gate: a controlled outbound DM advances monotonically through the states Meta actually sends, without duplicate bubbles or inbox reordering.

### Phase 4: Diagnostics and retention

Expose the admin diagnostics page and activate the 30-day raw-payload cleanup job.

Success gate: admins can answer “what did request X contain and why was it ignored?” using only the receipt ID, and payload cleanup is verified on a seeded expired row.

## Acceptance criteria

The integration is complete when:

1. 100% of valid signed webhook POSTs create one request receipt.
2. Every event candidate has one of four explicit outcomes: `processed`, `duplicate`, `ignored`, or `failed`.
3. Replaying the same Meta event never creates duplicate messages, attachments, comments, or reactions.
4. User-generated supported content appears in the correct admin conversation.
5. Operational events never pollute the transcript or alter “needs reply” ordering.
6. Outbound messages display truthful monotonic send state where Meta supplies it.
7. Unsupported/unknown events are discoverable by receipt ID and skip reason.
8. Invalid signatures create no database rows.
9. No runtime log contains message content, usernames, raw sender IDs, attachment URLs, access tokens, or the raw payload.
10. All new tables have admin-only RLS tests, indexes for their admin queries, and a verified raw-payload retention path.

## Verification commands

```bash
pnpm test -- app/api/meta/webhook/route.test.ts
pnpm test -- lib/meta/webhook-events.test.ts
pnpm test -- lib/meta/process-webhook-event.test.ts
pnpm test -- components/admin/DmLeadDetailPane.test.tsx
pnpm lint
pnpm build
```

After deployment, send controlled signed fixtures and verify receipt IDs in production. Do not test by replaying real student payloads from logs.

## Follow-up work

These are separate from this implementation:

- persist attachment binaries in Supabase Storage before Meta URLs expire;
- alert when failed/unknown event rates cross a threshold;
- include webhook health metrics in the admin analytics dashboard;
- support outbound media, reactions, and templates;
- link DM lead attribution to PathLab signup, trial, and payment events.

## Implementation handoff — 13 August 2026

The approved hybrid scope is implemented in the worktree:

- signed requests are normalized by `lib/meta/webhook-events.ts`;
- `app/api/meta/webhook/route.ts` now creates one durable receipt and one outcome row per candidate event;
- failed processing returns 500 so Meta can retry, while business writes deduplicate on provider IDs;
- attachments, quick replies, postbacks, reactions, echoes, delivery, read, comments, standby, and unknown shapes have explicit handlers;
- transcript rendering is shared through `components/admin/DmMessageBubble.tsx`;
- admins can inspect evidence at `/admin/meta-webhooks` using receipt, request, source-event, conversation, message, and comment IDs;
- failed and unknown raw event payloads are admin-only and cleared after 30 days.
- `supabase/tests/meta_webhook_event_integration.test.sql` asserts RLS, client privileges, cleanup-function security, and retention behavior.

Verification completed locally:

```text
scoped TypeScript error filter for integration files       PASS
targeted ESLint across all changed integration files       PASS
7 parser + route tests                                     PASS
git diff --check                                           PASS
```

The repository-wide TypeScript command remains red on unrelated pre-existing files; its output contains no errors in the integration file set. Database migration and pgTAP execution could not be tested locally because the Docker/OrbStack daemon was not running. No production migration or deployment was performed. The next researcher should apply the migration in a controlled environment, run `supabase test db`, send fixture callbacks for each normalized kind, then verify the resulting IDs and statuses on `/admin/meta-webhooks` before enabling any additional Meta subscriptions.
