"use client";

import { useEffect, useState } from "react";
import { Bot, MessageSquareText, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { updateAssessmentMetadata } from "@/lib/supabase/assessment";
import type { AIChatAssessmentMetadata, NodeAssessment } from "@/types/map";

const DEFAULT_PROMPT =
  "You are a supportive learning mentor. Ask one focused question at a time. Help the student think and explain their reasoning without giving the final answer immediately.";
const DEFAULT_FEEDBACK_INSTRUCTIONS =
  "Name one strength, one area to improve, and one practical next step. Keep the feedback supportive and specific.";

interface AIChatEditorProps {
  assessment: NodeAssessment;
  onAssessmentChange: (assessment: NodeAssessment, action: "update") => void;
}

export function AIChatEditor({
  assessment,
  onAssessmentChange,
}: AIChatEditorProps) {
  const { toast } = useToast();
  const current = (assessment.metadata || {}) as AIChatAssessmentMetadata;
  const [systemPrompt, setSystemPrompt] = useState(current.system_prompt || DEFAULT_PROMPT);
  const [openingMessage, setOpeningMessage] = useState(
    current.opening_message || "Hi! I’ll help you work through this assessment. What are your first thoughts?",
  );
  const [objective, setObjective] = useState(current.objective || "");
  const [completionCriteria, setCompletionCriteria] = useState(
    current.completion_criteria || "",
  );
  const [maxTurns, setMaxTurns] = useState(current.max_turns || 12);
  const [autoPass, setAutoPass] = useState(current.auto_pass || false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(
    current.feedback_enabled || false,
  );
  const [feedbackInstructions, setFeedbackInstructions] = useState(
    current.feedback_instructions || DEFAULT_FEEDBACK_INSTRUCTIONS,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const metadata = (assessment.metadata || {}) as AIChatAssessmentMetadata;
    setSystemPrompt(metadata.system_prompt || DEFAULT_PROMPT);
    setOpeningMessage(
      metadata.opening_message ||
        "Hi! I’ll help you work through this assessment. What are your first thoughts?",
    );
    setObjective(metadata.objective || "");
    setCompletionCriteria(metadata.completion_criteria || "");
    setMaxTurns(metadata.max_turns || 12);
    setAutoPass(metadata.auto_pass || false);
    setFeedbackEnabled(metadata.feedback_enabled || false);
    setFeedbackInstructions(
      metadata.feedback_instructions || DEFAULT_FEEDBACK_INSTRUCTIONS,
    );
  }, [assessment.id, assessment.metadata]);

  const handleSave = async () => {
    if (!systemPrompt.trim() || !objective.trim() || !completionCriteria.trim()) {
      toast({
        title: "Complete the AI Chat settings",
        description: "AI instructions, objective, and completion criteria are required.",
        variant: "destructive",
      });
      return;
    }

    if (feedbackEnabled && !feedbackInstructions.trim()) {
      toast({
        title: "Add feedback instructions",
        description: "Tell Kimi what kind of final feedback students should receive.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const metadata: AIChatAssessmentMetadata = {
        ...(assessment.metadata || {}),
        system_prompt: systemPrompt.trim(),
        opening_message: openingMessage.trim(),
        objective: objective.trim(),
        completion_criteria: completionCriteria.trim(),
        model: "kimi-for-coding",
        max_turns: Math.min(30, Math.max(3, maxTurns)),
        auto_pass: autoPass,
        feedback_enabled: feedbackEnabled,
        feedback_instructions: feedbackInstructions.trim(),
      };
      const updated = await updateAssessmentMetadata(assessment.id, metadata);
      onAssessmentChange(updated, "update");
      toast({ title: "AI Chat settings saved" });
    } catch (error) {
      toast({
        title: "Could not save AI Chat settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200/15 bg-amber-200/[0.04] p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-amber-300" aria-hidden="true" />
          <div>
            <p className="font-medium text-amber-50">Kimi AI mentor</p>
            <p className="mt-1 text-xs text-stone-400">
              The API key stays on the server. Students only receive the mentor response.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`ai-system-${assessment.id}`}>AI instructions</Label>
        <Textarea
          id={`ai-system-${assessment.id}`}
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          rows={6}
          placeholder="Describe how the mentor should guide the student."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`ai-opening-${assessment.id}`}>Opening message</Label>
        <Textarea
          id={`ai-opening-${assessment.id}`}
          value={openingMessage}
          onChange={(event) => setOpeningMessage(event.target.value)}
          rows={3}
          placeholder="The first message shown to the student."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`ai-objective-${assessment.id}`} className="flex items-center gap-2">
          <Target className="h-4 w-4" aria-hidden="true" />
          Learning objective
        </Label>
        <Textarea
          id={`ai-objective-${assessment.id}`}
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          rows={3}
          placeholder="What should the student understand or produce?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`ai-criteria-${assessment.id}`}>Completion criteria</Label>
        <Textarea
          id={`ai-criteria-${assessment.id}`}
          value={completionCriteria}
          onChange={(event) => setCompletionCriteria(event.target.value)}
          rows={4}
          placeholder="List the evidence required before the chat can be completed."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`ai-turns-${assessment.id}`}>Maximum student turns</Label>
          <Input
            id={`ai-turns-${assessment.id}`}
            type="number"
            min={3}
            max={30}
            value={maxTurns}
            onChange={(event) => setMaxTurns(Number(event.target.value) || 12)}
          />
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 p-3 text-sm">
          <Checkbox checked={autoPass} onCheckedChange={(checked) => setAutoPass(checked === true)} />
          Automatically pass when criteria are met
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.04] p-4">
        <label className="flex min-h-12 items-center gap-3 text-sm">
          <Checkbox
            checked={feedbackEnabled}
            onCheckedChange={(checked) => setFeedbackEnabled(checked === true)}
          />
          <span>
            <span className="flex items-center gap-2 font-medium text-stone-100">
              <MessageSquareText className="h-4 w-4 text-amber-300" aria-hidden="true" />
              Give feedback after the chat
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-400">
              Kimi uses the full conversation to write one final response for the student.
            </span>
          </span>
        </label>

        {feedbackEnabled && (
          <div className="space-y-2">
            <Label htmlFor={`ai-feedback-${assessment.id}`}>Feedback instructions</Label>
            <Textarea
              id={`ai-feedback-${assessment.id}`}
              value={feedbackInstructions}
              onChange={(event) => setFeedbackInstructions(event.target.value.slice(0, 1500))}
              rows={4}
              maxLength={1500}
              placeholder="Describe the feedback structure, tone, and details students should receive."
            />
            <p className="text-xs text-stone-400">
              Generated once when the criteria are met or the turn limit is reached.
            </p>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSaving ? "Saving..." : "Save AI Chat settings"}
      </Button>
    </div>
  );
}
