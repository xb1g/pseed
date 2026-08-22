"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface AIChatAssessmentProps {
  assessmentId: string;
  onComplete?: () => void | Promise<void>;
}

export function AIChatAssessment({
  assessmentId,
  onComplete,
}: AIChatAssessmentProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [objective, setObjective] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState(12);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionReason, setCompletionReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/map/assessments/${assessmentId}/ai-chat`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load chat");
        if (cancelled) return;

        setObjective(data.objective || "");
        setMaxTurns(data.max_turns || 12);
        if (data.session) {
          setMessages(data.messages || []);
          setCompletionPercentage(data.session.completion_percentage || 0);
          setTurnCount(data.session.turn_count || 0);
          setIsCompleted(data.session.is_completed || false);
          setCompletionReason(data.session.completion_reason || null);
          setFeedback(data.session.final_feedback || null);
        } else {
          setMessages(
            data.opening_message
              ? [{ role: "assistant", content: data.opening_message }]
              : [],
          );
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Could not load AI Chat",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, toast]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, isSending]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending || isCompleted) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/map/assessments/${assessmentId}/ai-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send message");

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.message },
      ]);
      setCompletionPercentage(data.completion_percentage || 0);
      setTurnCount(data.turn_count || 0);
      setMaxTurns(data.max_turns || maxTurns);
      setIsCompleted(data.is_completed || false);
      setCompletionReason(data.completion_reason || null);
      setFeedback(data.feedback || null);

      if (data.is_completed) {
        toast({
          title:
            data.completion_reason === "criteria_met"
              ? "Conversation complete"
              : "Conversation submitted for review",
        });
        await onComplete?.();
      }
    } catch (error) {
      setMessages((current) => current.slice(0, -1));
      setInput(message);
      toast({
        title: "Message not sent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = async () => {
    if (isSending || isResetting || isCompleted) return;

    setIsResetting(true);
    try {
      const response = await fetch(
        `/api/map/assessments/${assessmentId}/ai-chat`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reset chat");

      setMessages(
        data.opening_message
          ? [{ role: "assistant", content: data.opening_message }]
          : [],
      );
      setInput("");
      setObjective(data.objective || objective);
      setMaxTurns(data.max_turns || maxTurns);
      setCompletionPercentage(0);
      setTurnCount(0);
      setIsCompleted(false);
      setCompletionReason(null);
      setFeedback(null);
      toast({ title: "Conversation reset" });
    } catch (error) {
      toast({
        title: "Could not reset conversation",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-xl border border-amber-200/15 bg-slate-950/40">
        <div className="flex items-center gap-3 text-sm text-stone-300">
          <Loader2 className="h-5 w-5 animate-spin text-amber-300" aria-hidden="true" />
          Loading your conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200/15 bg-slate-950/55 shadow-lg">
      <div className="border-b border-amber-200/10 bg-indigo-950/35 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10">
            <Bot className="h-5 w-5 text-amber-200" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-amber-50">AI mentor</h4>
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-label="Completed" />
                )}
              </div>
              {!isCompleted && turnCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSending || isResetting}
                      className="min-h-11 shrink-0 gap-2 text-stone-300 hover:bg-white/[0.07] hover:text-amber-100"
                    >
                      {isResetting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset this conversation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This clears your messages, turn count, and AI progress for this chat. Your other map work is not affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep conversation</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void resetConversation()}
                        className="bg-red-600 text-white hover:bg-red-500"
                      >
                        Reset conversation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-stone-300">{objective}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-400">
            <span>{turnCount} of {maxTurns} turns</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-1.5" />
        </div>
      </div>

      <div
        className="max-h-[28rem] min-h-72 space-y-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="AI assessment conversation"
      >
        {messages.map((message, index) => (
          <div
            key={message.id || `${message.role}-${index}`}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]",
                message.role === "user"
                  ? "rounded-br-sm bg-indigo-500 text-white"
                  : "rounded-bl-sm border border-white/10 bg-white/[0.07] text-stone-200",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-stone-400">
              <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
              Kimi is thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-amber-200/10 bg-slate-950/70 p-4">
        {isCompleted ? (
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.07] p-3 text-sm text-emerald-100">
            <p className="font-medium">
              {completionReason === "criteria_met"
                ? "You met the conversation objective."
                : "Your conversation was submitted for instructor review."}
            </p>
            {feedback && (
              <div className="mt-3 border-t border-emerald-200/15 pt-3">
                <p className="flex items-center gap-2 font-medium text-amber-100">
                  <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  Your feedback
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-emerald-100/80">
                  {feedback}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Write your response..."
              aria-label="Message to AI mentor"
              disabled={isSending}
              rows={2}
              className="min-h-12 resize-none border-white/10 bg-white/[0.05] text-stone-100"
            />
            <Button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isSending}
              className="h-12 min-w-12 gap-2"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
