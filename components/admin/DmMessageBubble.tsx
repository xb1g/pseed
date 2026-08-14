import { AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeliveryBlockedByPrivacy, isDeliveryFailed } from "@/lib/dm-leads/delivery-status";
import type { DmMessage } from "@/types/dm-leads";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function messageStatus(message: DmMessage): string | null {
  if (message.direction !== "outbound" || !message.send_status) return null;
  return message.send_status;
}

export function DmMessageBubble({ message }: { message: DmMessage }) {
  const inbound = message.direction === "inbound";
  const status = messageStatus(message);
  const privacyBlocked = isDeliveryBlockedByPrivacy(message);
  const failed = isDeliveryFailed(message);

  return (
    <div
      className={cn(
        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
        inbound ? "mr-auto bg-muted" : "ml-auto bg-primary text-primary-foreground",
        failed && "border-2 border-destructive/70 bg-destructive/10 text-foreground"
      )}
    >
      {message.message_type !== "text" && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {message.message_type.replace("_", " ")}
        </p>
      )}
      <p className="whitespace-pre-wrap">{message.body}</p>

      {privacyBlocked && (
        <div className="mt-2 rounded border border-destructive/40 bg-destructive/15 p-2 text-xs text-destructive">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>ส่งไม่ถึง (ติด Instagram Privacy Settings)</span>
          </div>
          <p className="mt-0.5 text-[11px] opacity-90">
            บัญชีนี้ตั้งค่าไม่รับ Message Requests จากบุคคลภายนอก ทำให้ข้อความ DM ถูกตีกลับ
          </p>
        </div>
      )}

      {!privacyBlocked && failed && (
        <div className="mt-2 rounded border border-destructive/40 bg-destructive/15 p-2 text-xs text-destructive">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>ส่งไม่สำเร็จ (Delivery Failed)</span>
          </div>
        </div>
      )}

      {(message.dm_message_attachments ?? []).length > 0 && (
        <div className="mt-2 space-y-1.5">
          {(message.dm_message_attachments ?? [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((attachment) => (
              <div key={attachment.id} className="rounded border border-current/20 px-2 py-1.5 text-xs">
                <p className="font-medium">
                  {attachment.title || attachment.attachment_type || "Attachment"}
                </p>
                {attachment.source_url && (
                  <a
                    href={attachment.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    Open attachment <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
        </div>
      )}

      {(message.dm_message_reactions ?? []).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Message reactions">
          {(message.dm_message_reactions ?? []).map((reaction) => (
            <span
              key={reaction.id}
              className="rounded-full border border-current/20 px-1.5 py-0.5 text-xs"
              title={`Reaction from ${reaction.actor_platform_user_id}`}
            >
              {reaction.reaction || "Reaction"}
            </span>
          ))}
        </div>
      )}

      <p className="mt-1 flex items-center justify-end gap-1.5 text-xs opacity-70">
        <span>{formatDate(message.sent_at)}</span>
        {status && <span className={cn("capitalize", failed && "font-semibold text-destructive")}>· {status}</span>}
      </p>
    </div>
  );
}

