"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { replyPublicly, replyPrivately } from "@/app/admin/ig-comments/actions";

export function IgCommentReplyRow({ commentId }: { commentId: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const send = (mode: "public" | "private") => {
    setError(null);
    startTransition(async () => {
      const result = mode === "public"
        ? await replyPublicly(commentId, message)
        : await replyPrivately(commentId, message);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("");
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Reply…"
          disabled={isPending}
        />
        <Button size="sm" variant="outline" disabled={isPending || !message.trim()} onClick={() => send("public")}>
          Public reply
        </Button>
        <Button size="sm" disabled={isPending || !message.trim()} onClick={() => send("private")}>
          DM (private reply)
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
