import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentMetaWebhookReceipts } from "@/lib/supabase/meta-webhook-events";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "failed" || status === "partial") return "destructive";
  if (status === "ignored" || status === "duplicate") return "secondary";
  if (status === "processed") return "default";
  return "outline";
}

export default async function MetaWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const filters = await searchParams;
  const allReceipts = await getRecentMetaWebhookReceipts(100);
  const receipts = allReceipts.filter((receipt) => {
    if (filters.status && receipt.status !== filters.status) return false;
    if (
      filters.kind &&
      !receipt.meta_webhook_events.some((event) => event.event_kind === filters.kind)
    ) {
      return false;
    }
    return true;
  });
  const bodyAttempts = allReceipts.reduce<Record<string, number>>((counts, receipt) => {
    counts[receipt.body_sha256] = (counts[receipt.body_sha256] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Meta webhook diagnostics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Durable evidence for the latest signed webhook deliveries. Raw payloads are retained only
          for failed or unknown events and cleared after 30 days.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3">
        <label className="space-y-1 text-xs font-medium">
          <span>Status</span>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="block h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="processed">Processed</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
            <option value="received">Still processing</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium">
          <span>Exact event kind</span>
          <input
            name="kind"
            defaultValue={filters.kind ?? ""}
            placeholder="message.attachment"
            className="block h-9 w-56 rounded-md border bg-background px-2 text-sm"
          />
        </label>
        <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground">
          Filter
        </button>
        {(filters.status || filters.kind) && (
          <Link href="/admin/meta-webhooks" className="pb-2 text-xs underline underline-offset-2">
            Clear
          </Link>
        )}
      </form>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {allReceipts.length === 0
              ? "No webhook receipts recorded yet."
              : "No webhook receipts match these filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {receipt.object_type} · {formatTimestamp(receipt.received_at)}
                    </CardTitle>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      Receipt {receipt.id}
                      {receipt.provider_request_id ? ` · Request ${receipt.provider_request_id}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusVariant(receipt.status)}>{receipt.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{receipt.event_count} events</span>
                  <span>{receipt.processed_count} processed</span>
                  <span>{receipt.duplicate_count} duplicate</span>
                  <span>{receipt.ignored_count} ignored</span>
                  <span>{receipt.failed_count} failed</span>
                  {bodyAttempts[receipt.body_sha256] > 1 && (
                    <span>{bodyAttempts[receipt.body_sha256]} matching-body attempts</span>
                  )}
                  <span className="font-mono">Body {receipt.body_sha256.slice(0, 12)}…</span>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Event</th>
                        <th className="px-3 py-2 font-medium">Outcome</th>
                        <th className="px-3 py-2 font-medium">Reason / evidence</th>
                        <th className="px-3 py-2 font-medium">Occurred</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.meta_webhook_events.map((event) => (
                        <tr key={event.id} className="border-t align-top">
                          <td className="px-3 py-2">
                            <p className="font-medium">{event.event_kind}</p>
                            <p className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground">
                              {event.source_event_id || event.dedupe_key}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={statusVariant(event.processing_status)}>
                              {event.processing_status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {event.skip_reason && <p>{event.skip_reason}</p>}
                            {event.conversation_id && (
                              <Link
                                href={`/admin/dm-leads/${event.conversation_id}`}
                                className="block break-all text-primary underline underline-offset-2"
                              >
                                Conversation {event.conversation_id}
                              </Link>
                            )}
                            {event.dm_message_id && (
                              <p className="break-all font-mono text-[10px] text-muted-foreground">
                                Message {event.dm_message_id}
                              </p>
                            )}
                            {event.ig_comment_id && (
                              <p className="break-all font-mono text-[10px] text-muted-foreground">
                                Comment {event.ig_comment_id}
                              </p>
                            )}
                            {event.raw_payload && (
                              <details className="mt-1">
                                <summary className="cursor-pointer font-medium text-destructive">
                                  Raw failed/unknown payload
                                </summary>
                                <pre className="mt-1 max-h-48 max-w-xl overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[10px]">
                                  {JSON.stringify(event.raw_payload, null, 2)}
                                </pre>
                              </details>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {formatTimestamp(event.occurred_at ?? event.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
