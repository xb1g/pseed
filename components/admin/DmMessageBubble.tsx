import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
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

  return (
    <div
      className={cn(
        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
        inbound ? "mr-auto bg-muted" : "ml-auto bg-primary text-primary-foreground",
        message.send_status === "failed" && "ring-2 ring-destructive/70"
      )}
    >
      {message.message_type !== "text" && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {message.message_type.replace("_", " ")}
        </p>
      )}
      <p className="whitespace-pre-wrap">{message.body}</p>

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
        {status && <span className="capitalize">· {status}</span>}
      </p>
    </div>
  );
}
