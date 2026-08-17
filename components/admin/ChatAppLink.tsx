"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatDeepLink, type ChatLinkSource } from "@/lib/dm-leads/chat-link";

/**
 * Opens the thread in Instagram (or Messenger) itself.
 *
 * Renders nothing without a usable handle — see `chatDeepLink` for why a
 * fallback link would be worse than no button.
 */
export function ChatAppLink({
  conversation,
  className,
  showLabel = true,
}: {
  conversation: ChatLinkSource;
  className?: string;
  showLabel?: boolean;
}) {
  const href = chatDeepLink(conversation);
  if (!href) return null;

  const label = conversation.platform === "facebook" ? "เปิดใน Messenger" : "เปิดใน IG";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label} (ตอบมือได้แม้เกิน 7 วัน)`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <MessageCircle className="h-3 w-3" />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </a>
  );
}
