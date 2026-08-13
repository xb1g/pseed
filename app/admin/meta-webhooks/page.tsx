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

export default async function MetaWebhooksPage() {
  const receipts = await getRecentMetaWebhookReceipts(100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Meta webhook diagnostics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Durable evidence for the latest signed webhook deliveries. Raw payloads are retained only
          for failed or unknown events and cleared after 30 days.
        </p>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No webhook receipts recorded yet.
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
