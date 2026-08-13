"use client";

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { replyToLead } from "@/app/admin/dm-leads/actions";

export function DmLeadReplyForm({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    setError(null);
    startTransition(async () => {
      const result = await replyToLead(conversationId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a reply…"
        rows={3}
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSend} disabled={isPending || !body.trim()}>
        {isPending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
