"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PathAIChatStudent } from "./PathAIChatStudent";
import { NPCConversation } from "./NPCConversation";
import { aiChatObjective, normalizeContentBlock } from "@/lib/pathlab/content-block";

/** Fires while an activity is open so partial time survives an abandoned tab */
const HEARTBEAT_INTERVAL_MS = 60_000;

type ContentRow = {
  id: string;
  content_type: string;
  content_title: string | null;
  content_url: string | null;
  content_body: string | null;
  metadata?: Record<string, any> | null;
};

type QuizQuestionRow = {
  id: string;
  question_text: string;
  options: Array<{ option: string; text: string }> | null;
};

type AssessmentRow = {
  id: string;
  assessment_type: string;
  metadata?: Record<string, any> | null;
  path_quiz_questions?: QuizQuestionRow[] | null;
};

export type ActivityRow = {
  id: string;
  title: string;
  instructions: string | null;
  content: ContentRow[];
  assessment: AssessmentRow | null;
};

type ActivityViewPanelProps = {
  activity: ActivityRow;
  enrollmentId: string;
  progressId: string | null;
  isComplete: boolean;
  onProgressUpdate: () => void;
};

function ContentBlock({ block }: { block: ContentRow }) {
  // Authored bodies are sometimes JSON descriptors; never render them raw
  const normalized = normalizeContentBlock(block);
  const title = normalized.title;
  const prompts: string[] = Array.isArray(block.metadata?.prompts)
    ? block.metadata.prompts
    : [];

  const body = (() => {
    switch (block.content_type) {
      case "text":
      case "daily_prompt":
      case "reflection_card": {
        // A text row with only a link is a resource pointer, not prose
        if (!normalized.body && normalized.link) {
          return (
            <div className="space-y-1">
              {normalized.description && (
                <p className="text-sm text-neutral-300">
                  {normalized.description}
                </p>
              )}
              <a
                href={normalized.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                {normalized.link}
              </a>
            </div>
          );
        }

        if (!normalized.body && !normalized.description && !prompts.length) {
          return null;
        }

        return (
          <div className="space-y-2">
            {normalized.description && (
              <p className="text-sm text-neutral-400">
                {normalized.description}
              </p>
            )}
            {normalized.body && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                {normalized.body}
              </p>
            )}
            {prompts.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {prompts.map((prompt, index) => (
                  <li key={index} className="text-sm text-neutral-300">
                    {prompt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }

      case "video":
      case "short_video":
        return block.content_url ? (
          <video
            controls
            src={block.content_url}
            className="w-full rounded-lg border border-neutral-800"
          />
        ) : null;

      case "image":
        return block.content_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.content_url}
            alt={title || "Activity image"}
            className="max-w-full rounded-lg border border-neutral-800"
          />
        ) : null;

      case "pdf":
      case "canva_slide":
        return block.content_url ? (
          <iframe
            src={block.content_url}
            title={title || "Embedded content"}
            className="h-[60vh] w-full rounded-lg border border-neutral-800"
          />
        ) : null;

      case "resource_link":
        return normalized.link ? (
          <div className="space-y-1">
            {normalized.description && (
              <p className="text-sm text-neutral-400">
                {normalized.description}
              </p>
            )}
            <a
              href={normalized.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              {title || normalized.link}
            </a>
          </div>
        ) : null;

      default:
        return normalized.body || normalized.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
            {normalized.body || normalized.description}
          </p>
        ) : null;
    }
  })();

  if (!body) return null;

  return (
    <div className="space-y-2">
      {title && block.content_type !== "resource_link" && (
        <h4 className="text-sm font-semibold text-neutral-200">{title}</h4>
      )}
      {body}
    </div>
  );
}

export function ActivityViewPanel({
  activity,
  enrollmentId,
  progressId,
  isComplete,
  onProgressUpdate,
}: ActivityViewPanelProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Wall-clock accumulator, flushed on heartbeat / unmount / completion
  const openedAt = useRef<number>(Date.now());
  const flushedUpTo = useRef<number>(Date.now());

  const assessment = activity.assessment;
  const quizQuestions = useMemo(
    () => assessment?.path_quiz_questions || [],
    [assessment],
  );

  const conversationContent = activity.content.find(
    (block) => block.content_type === "npc_chat",
  );
  const aiChatContent = activity.content.find(
    (block) => block.content_type === "ai_chat",
  );

  async function postProgress(action: string, elapsedSeconds?: number) {
    try {
      const response = await fetch("/api/pathlab/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          activityId: activity.id,
          action,
          elapsedSeconds,
        }),
      });

      return response.ok ? await response.json() : null;
    } catch {
      // Time tracking must never block the student
      return null;
    }
  }

  function elapsedSinceFlush() {
    const now = Date.now();
    const seconds = Math.round((now - flushedUpTo.current) / 1000);
    flushedUpTo.current = now;
    return seconds;
  }

  // Register the open, then bank time periodically and on the way out
  useEffect(() => {
    openedAt.current = Date.now();
    flushedUpTo.current = Date.now();

    // The row may not have existed when the server rendered this page. Refresh
    // the parent's map once it does, otherwise chat activities mount with a
    // null progressId and every subsequent write fails.
    postProgress("start").then((payload) => {
      if (payload?.progress?.id && payload.progress.id !== progressId) {
        onProgressUpdate();
      }
    });

    const interval = setInterval(() => {
      const seconds = elapsedSinceFlush();
      if (seconds > 0) postProgress("heartbeat", seconds);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      const seconds = elapsedSinceFlush();
      if (seconds > 0) {
        // keepalive so the final flush survives navigation
        navigator.sendBeacon?.(
          "/api/pathlab/progress",
          new Blob(
            [
              JSON.stringify({
                enrollmentId,
                activityId: activity.id,
                action: "heartbeat",
                elapsedSeconds: seconds,
              }),
            ],
            { type: "application/json" },
          ),
        );
      }
    };
    // Re-register whenever the student switches activity
  }, [activity.id, enrollmentId]);

  async function handleComplete() {
    setSubmitting(true);

    try {
      if (assessment) {
        const payload: Record<string, unknown> = {
          progress_id: progressId,
          assessment_id: assessment.id,
        };

        if (assessment.assessment_type === "quiz") {
          payload.quiz_answers = quizAnswers;
        } else if (assessment.assessment_type === "checklist") {
          payload.metadata = { checked };
        } else {
          payload.text_answer = textAnswer;
        }

        const response = await fetch("/api/pathlab/assessments/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || "Could not save your answer");
        }
      }

      await postProgress("complete", elapsedSinceFlush());
      toast.success("Activity complete");
      onProgressUpdate();
    } catch (error: any) {
      toast.error(error?.message || "Could not complete this activity");
    } finally {
      setSubmitting(false);
    }
  }

  // Conversation activities own their own completion lifecycle
  if (conversationContent && progressId) {
    return (
      <div className="p-4">
        <NPCConversation
          conversationId={conversationContent.metadata?.conversation_id}
          progressId={progressId}
          onComplete={onProgressUpdate}
        />
      </div>
    );
  }

  if (aiChatContent && progressId) {
    return (
      <div className="p-4">
        <PathAIChatStudent
          activityId={activity.id}
          progressId={progressId}
          objective={aiChatObjective(aiChatContent, activity.instructions)}
          onComplete={onProgressUpdate}
        />
      </div>
    );
  }

  const checklistItems: string[] = assessment?.metadata?.items || [];

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">{activity.title}</h3>
        {activity.instructions && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
            {activity.instructions}
          </p>
        )}
      </div>

      {activity.content.length > 0 && (
        <div className="space-y-6">
          {activity.content.map((block) => (
            <ContentBlock key={block.id} block={block} />
          ))}
        </div>
      )}

      {assessment && (
        <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/70 p-4">
          {assessment.assessment_type === "quiz" && (
            <div className="space-y-5">
              {quizQuestions.map((question) => (
                <fieldset key={question.id} className="space-y-2">
                  <legend className="text-sm font-medium text-neutral-200">
                    {question.question_text}
                  </legend>
                  <div className="space-y-1.5">
                    {(question.options || []).map((option) => (
                      <label
                        key={option.option}
                        className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.option}
                          checked={quizAnswers[question.id] === option.option}
                          onChange={() =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [question.id]: option.option,
                            }))
                          }
                          disabled={isComplete}
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {assessment.assessment_type === "checklist" && (
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item]}
                    onChange={(event) =>
                      setChecked((prev) => ({
                        ...prev,
                        [item]: event.target.checked,
                      }))
                    }
                    disabled={isComplete}
                  />
                  {item}
                </label>
              ))}
            </div>
          )}

          {["text_answer", "daily_reflection", "journal_prompt"].includes(
            assessment.assessment_type,
          ) && (
            <Textarea
              value={textAnswer}
              onChange={(event) => setTextAnswer(event.target.value)}
              placeholder="Write your response…"
              rows={6}
              disabled={isComplete}
              className="border-neutral-800 bg-neutral-950 text-neutral-100"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {isComplete ? "Completed" : "Mark complete when you have finished."}
        </p>
        <Button
          onClick={handleComplete}
          disabled={submitting || isComplete}
          className="bg-white text-black hover:bg-neutral-200"
        >
          {isComplete ? "Completed" : submitting ? "Saving…" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}
