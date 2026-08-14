import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  FileText,
  Film,
  ImageIcon,
  Music,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeliveryBlockedByPrivacy, isDeliveryFailed } from "@/lib/dm-leads/delivery-status";
import type { DmMessage, DmMessageAttachment } from "@/types/dm-leads";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Messenger/WhatsApp-style delivery ticks. The underlying data
 * (delivered_at/read_at) has been captured from Meta's webhook since before
 * this session, but the UI only ever printed the raw send_status string —
 * this renders it as the icon progression admins actually recognize.
 */
function DeliveryTicks({ message }: { message: DmMessage }) {
  if (message.direction !== "outbound" || !message.send_status) return null;

  if (message.send_status === "failed") {
    return (
      <span className="inline-flex items-center gap-0.5 text-destructive" title="Failed to send">
        <AlertCircle className="h-3 w-3" />
      </span>
    );
  }
  if (message.read_at || message.send_status === "read") {
    return (
      <span className="inline-flex items-center text-sky-400" title={`Read${message.read_at ? ` · ${formatDate(message.read_at)}` : ""}`}>
        <CheckCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (message.delivered_at || message.send_status === "delivered") {
    return (
      <span className="inline-flex items-center opacity-70" title={`Delivered${message.delivered_at ? ` · ${formatDate(message.delivered_at)}` : ""}`}>
        <CheckCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (message.send_status === "sent") {
    return (
      <span className="inline-flex items-center opacity-70" title="Sent">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  // pending
  return (
    <span className="inline-flex items-center opacity-50" title="Sending…">
      <Clock className="h-3 w-3" />
    </span>
  );
}

function isImageAttachment(attachment: DmMessageAttachment): boolean {
  if (attachment.attachment_type === "image") return true;
  if (
    attachment.source_url &&
    /\.(jpe?g|png|webp|gif|heic|heif|svg)(\?.*)?$/i.test(attachment.source_url)
  ) {
    return true;
  }
  const mime =
    typeof attachment.payload?.mime_type === "string" ? attachment.payload.mime_type : "";
  if (mime.startsWith("image/")) return true;
  return false;
}

function isVideoAttachment(attachment: DmMessageAttachment): boolean {
  if (attachment.attachment_type === "video") return true;
  const mime =
    typeof attachment.payload?.mime_type === "string" ? attachment.payload.mime_type : "";
  return mime.startsWith("video/");
}

function isAudioAttachment(attachment: DmMessageAttachment): boolean {
  if (attachment.attachment_type === "audio") return true;
  const mime =
    typeof attachment.payload?.mime_type === "string" ? attachment.payload.mime_type : "";
  return mime.startsWith("audio/");
}

function isImageUrl(text: string): boolean {
  return /^https?:\/\/.+\.(jpe?g|png|webp|gif|heic|heif|svg)(\?.*)?$/i.test(text.trim());
}

function AttachmentIcon({ type, className }: { type: string; className?: string }) {
  switch (type.toLowerCase()) {
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Film className={className} />;
    case "audio":
      return <Music className={className} />;
    case "file":
    case "doc":
    case "pdf":
      return <FileText className={className} />;
    default:
      return <Paperclip className={className} />;
  }
}

export function DmMessageBubble({ message }: { message: DmMessage }) {
  const inbound = message.direction === "inbound";
  const privacyBlocked = isDeliveryBlockedByPrivacy(message);
  const failed = isDeliveryFailed(message);

  const attachments = message.dm_message_attachments ?? [];
  const hasImageAttachment = attachments.some(isImageAttachment);
  const hasNonImageAttachment = attachments.some(
    (a) => !isImageAttachment(a) && (isVideoAttachment(a) || isAudioAttachment(a) || a.attachment_type === "file")
  );
  const bodyText = message.body?.trim() || "";
  const isImageBody = isImageUrl(bodyText);
  // Covers both the old fixed placeholders and the generalized
  // `[image]`/`[video]`/`[audio]`/`[file]` fallback body set when an
  // attachment is sent without a caption.
  const isPlaceholderBody = /^\[(image|photo|video|audio|file|attachment|message)\]$/i.test(bodyText);

  return (
    <div
      className={cn(
        "max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 text-sm",
        inbound ? "mr-auto bg-muted text-foreground" : "ml-auto bg-primary text-primary-foreground",
        failed && "border-2 border-destructive/70 bg-destructive/10 text-foreground"
      )}
    >
      {message.message_type !== "text" && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {message.message_type.replace("_", " ")}
        </p>
      )}

      {/* Main text or image text representation */}
      {bodyText && !isPlaceholderBody && !isImageBody && (
        <p className="whitespace-pre-wrap">{bodyText}</p>
      )}

      {/* When body is a bracketed image placeholder or there's an image
          attachment, show a clear text badge. Video/audio/file attachments
          get their own inline player/chip below instead — no badge needed. */}
      {(hasImageAttachment || isImageBody || (isPlaceholderBody && !hasNonImageAttachment)) && (
        <div className="flex items-center gap-1.5 font-medium text-xs my-0.5 opacity-90">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          <span>[รูปภาพ / Image]</span>
        </div>
      )}

      {/* If body itself is an image URL */}
      {isImageBody && (
        <div className="mt-1.5 overflow-hidden rounded-md border border-current/20 bg-background/20">
          <a
            href={bodyText}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bodyText}
              alt="Image attachment"
              loading="lazy"
              className="max-h-60 w-full max-w-sm rounded object-contain bg-black/10 dark:bg-black/30"
            />
          </a>
          <div className="flex items-center justify-between gap-2 p-1.5 text-xs">
            <span className="flex items-center gap-1 font-mono text-[11px] truncate opacity-80">
              <ImageIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{bodyText}</span>
            </span>
            <a
              href={bodyText}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 shrink-0 text-[11px] underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              เปิดรูป <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Privacy block banner */}
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

      {/* Delivery failed banner */}
      {!privacyBlocked && failed && (
        <div className="mt-2 rounded border border-destructive/40 bg-destructive/15 p-2 text-xs text-destructive">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>ส่งไม่สำเร็จ (Delivery Failed)</span>
          </div>
        </div>
      )}

      {/* Attachments rendering */}
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {attachments
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((attachment) => {
              const isImg = isImageAttachment(attachment);
              const titleText =
                attachment.title ||
                (isImg ? "รูปภาพ / Image" : attachment.attachment_type || "Attachment");

              if (isImg && attachment.source_url) {
                return (
                  <div
                    key={attachment.id}
                    className="overflow-hidden rounded-md border border-current/20 bg-background/20"
                  >
                    <a
                      href={attachment.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden transition-opacity hover:opacity-90"
                      title={titleText}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.source_url}
                        alt={titleText}
                        loading="lazy"
                        className="max-h-60 w-full max-w-sm rounded-t-md object-contain bg-black/10 dark:bg-black/30"
                      />
                    </a>
                    <div className="flex items-center justify-between gap-2 p-1.5 text-xs">
                      <span className="flex items-center gap-1 font-medium truncate">
                        <ImageIcon className="h-3 w-3 shrink-0 opacity-70" />
                        <span className="truncate">{titleText}</span>
                      </span>
                      <a
                        href={attachment.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 shrink-0 text-[11px] underline underline-offset-2 opacity-80 hover:opacity-100"
                      >
                        ดูรูปเต็ม <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                );
              }

              if (isVideoAttachment(attachment) && attachment.source_url) {
                return (
                  <div
                    key={attachment.id}
                    className="overflow-hidden rounded-md border border-current/20 bg-background/20"
                  >
                    <video
                      src={attachment.source_url}
                      controls
                      className="max-h-60 w-full max-w-sm rounded-t-md bg-black/40"
                    />
                    <div className="flex items-center gap-1.5 p-1.5 text-xs font-medium">
                      <Film className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate">{titleText}</span>
                    </div>
                  </div>
                );
              }

              if (isAudioAttachment(attachment) && attachment.source_url) {
                return (
                  <div
                    key={attachment.id}
                    className="rounded-md border border-current/20 bg-background/20 p-1.5"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                      <Music className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate">{titleText}</span>
                    </div>
                    <audio src={attachment.source_url} controls className="h-8 w-full max-w-sm" />
                  </div>
                );
              }

              return (
                <div
                  key={attachment.id}
                  className="rounded border border-current/20 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <AttachmentIcon
                      type={attachment.attachment_type}
                      className="h-3.5 w-3.5 shrink-0 opacity-70"
                    />
                    <span className="truncate">{titleText}</span>
                  </div>
                  {attachment.source_url && (
                    <a
                      href={attachment.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100"
                    >
                      Open attachment <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Reactions */}
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
        <DeliveryTicks message={message} />
      </p>
    </div>
  );
}


