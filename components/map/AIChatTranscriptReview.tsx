"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface AIChatTranscriptReviewProps {
  sessionId: string;
}

export function AIChatTranscriptReview({ sessionId }: AIChatTranscriptReviewProps) {
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const [{ data: sessionData, error: sessionError }, { data: messageData, error: messageError }] =
        await Promise.all([
          supabase.from("node_ai_chat_sessions").select("*").eq("id", sessionId).single(),
          supabase
            .from("node_ai_chat_messages")
            .select("id, role, content, created_at")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true }),
        ]);

      if (cancelled) return;
      if (sessionError || messageError) {
        setError(sessionError?.message || messageError?.message || "Could not load transcript");
      } else {
        setSession(sessionData);
        setMessages(messageData || []);
      }
      setIsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading AI Chat transcript...
      </div>
    );
  }

  if (error || !session) {
    return <p className="py-4 text-sm text-destructive">{error || "Transcript not found"}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{session.completion_percentage}% complete</Badge>
        <Badge variant={session.completion_reason === "criteria_met" ? "default" : "secondary"}>
          {session.completion_reason === "criteria_met" ? "Criteria met" : "Turn limit reached"}
        </Badge>
        <span className="text-xs text-muted-foreground">{session.turn_count} student turns</span>
      </div>

      {session.completion_evidence && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">Completion evidence</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {session.completion_evidence}
          </p>
        </div>
      )}

      <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                message.role === "user" ? "bg-indigo-500/15" : "bg-amber-400/15",
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              ) : (
                <Bot className="h-4 w-4 text-amber-500" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium capitalize text-muted-foreground">
                {message.role === "user" ? "Student" : "AI mentor"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
