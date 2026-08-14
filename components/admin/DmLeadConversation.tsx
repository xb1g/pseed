"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DmMessageBubble } from "@/components/admin/DmMessageBubble";
import { DmLeadReplyForm } from "@/components/admin/DmLeadReplyForm";
import { replyToLead } from "@/app/admin/dm-leads/actions";
import type { DmConversation, DmMessage } from "@/types/dm-leads";

export function DmLeadConversation({ conversation }: { conversation: DmConversation }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<DmMessage[]>(conversation.dm_messages ?? []);

  useEffect(() => {
    setMessages(conversation.dm_messages ?? []);
  }, [conversation.dm_messages]);

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, message: DmMessage) => [...state, message]
  );

  const handleSend = () => {
    const text = body.trim();
    if (!text) return;
    setError(null);

    const optimisticMessage: DmMessage = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      direction: "outbound",
      sender_type: "admin",
      body: text,
      platform_message_id: null,
      message_type: "text",
      metadata: {},
      send_status: "pending",
      delivered_at: null,
      read_at: null,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setBody("");
    startTransition(async () => {
      addOptimisticMessage(optimisticMessage);
      const result = await replyToLead(conversation.id, text);
      if (!result.ok) {
        setError(result.error);
        setBody(text);
      }
    });
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {optimisticMessages.map((message) => (
            <DmMessageBubble key={message.id} message={message} />
          ))}
        </CardContent>
      </Card>

      <DmLeadReplyForm
        conversation={conversation}
        body={body}
        onBodyChange={setBody}
        onSend={handleSend}
        isPending={isPending}
        error={error}
      />
    </>
  );
}
