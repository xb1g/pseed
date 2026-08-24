"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  RefreshCw,
  MessageSquare,
  Users2,
  Send,
  MessageCircle,
} from "lucide-react";
import {
  getSubmissionsForMap,
  SubmissionWithDetails,
  gradeSubmission,
} from "@/lib/supabase/grading";
import { isAbortError } from "@/lib/supabase/errors";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { FileSubmissionViewer } from "./FileSubmissionViewer";
import { LoadingShell } from "./LoadingShell";

interface InstructorGradingPanelProps {
  mapId: string;
  selectedNode?: any;
  userId: string;
  onGradingComplete?: () => void;
  /** IDs of translation nodes linked to the selected primary node.
   *  Submissions against these nodes are merged into the grading queue. */
  translationNodeIds?: string[];
}

export function InstructorGradingPanel({
  mapId,
  selectedNode,
  userId,
  onGradingComplete,
  translationNodeIds = [],
}: InstructorGradingPanelProps) {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  // Per-card comment text. Keyed by submission id so typing a comment for
  // student A no longer wipes the text the instructor started for student B.
  const [comments, setComments] = useState<Record<string, string>>({});
  // Per-card in-flight flags so two simultaneous saves don't clobber each
  // other and the spinner only appears next to the row being acted on.
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter submissions by selected node (including translation nodes) and team filter
  const filteredSubmissions = submissions.filter((sub) => {
    const submissionNodeId = sub.node_assessments?.map_nodes?.id;
    const matchesNode =
      !selectedNode ||
      submissionNodeId === selectedNode.id ||
      translationNodeIds.includes(submissionNodeId);
    const isTeamSubmission = sub.metadata?.team_id !== undefined;

    const matchesTeam =
      teamFilter === "all" ||
      (teamFilter === "team" && isTeamSubmission) ||
      (teamFilter === "individual" && !isTeamSubmission);

    return matchesNode && matchesTeam;
  });

  // Group submissions by status
  const pendingSubmissions = filteredSubmissions.filter(
    (sub) => sub.submission_grades.length === 0
  );
  const gradedSubmissions = filteredSubmissions.filter(
    (sub) => sub.submission_grades.length > 0
  );

  // Single-flight flag so a slow fetch doesn't pile up overlapping polls.
  const inFlightRef = useRef(false);

  useEffect(() => {
    // Wraps loadSubmissions in a single-flight guard: if a poll is already
    // in flight (e.g. previous request still pending under a slow network,
    // or a re-render mid-fetch), skip this tick instead of stacking requests.
    const runPoll = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await loadSubmissions();
      } finally {
        inFlightRef.current = false;
      }
    };

    // Periodic refresh, paused when the tab is hidden. Backgrounded tabs
    // should not be burning mobile data every 30 seconds — a user on a
    // flaky 3G link notices, and the polling call still re-fires when the
    // tab is hidden on most browsers anyway.
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(runPoll, 30000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        runPoll();
        start();
      }
    };
    runPoll();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // loadSubmissions is recreated on every render, so exclude it to keep
    // the interval stable for the lifetime of this mapId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await getSubmissionsForMap(mapId);
      setSubmissions(data);
    } catch (error) {
      // Aborts come from the next poll cancelling the previous one.
      // They are expected; suppress the user-facing toast for them.
      if (isAbortError(error)) return;
      console.error("Error loading submissions:", error);
      toast({
        title: "Error loading submissions",
        description: "Could not load student submissions for this map.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (
    submission: SubmissionWithDetails,
    grade: "pass" | "fail",
    explicitComments?: string,
    rating?: number,
    pointsAwarded?: number
  ) => {
    // The caller may pass an explicit comment (typical for bulk / scripted
    // flows), but in the UI the per-card textarea is the source of truth.
    // Empty comment → require the instructor to write something. A grade
    // with no comment is silently useless for the student.
    const commentText = (explicitComments ?? comments[submission.id] ?? "").trim();
    if (!commentText) {
      toast({
        title: "Add a comment first",
        description:
          "Students see what you wrote, not just pass/fail. Write a sentence before grading.",
        variant: "destructive",
      });
      return;
    }

    setSavingFor(submission.id);
    try {
      await gradeSubmission(
        submission.id,
        grade,
        commentText,
        rating ?? null,
        userId,
        submission.student_node_progress.id,
        pointsAwarded ?? null
      );

      toast({
        title: "Submission graded",
        description: `Marked as ${grade.toUpperCase()} for ${submission.student_node_progress.profiles.username}`,
      });

      // Clear the per-card comment once the grade is saved, then refresh.
      setComments((prev) => {
        const next = { ...prev };
        delete next[submission.id];
        return next;
      });
      await loadSubmissions();
      onGradingComplete?.();
    } catch (error) {
      console.error("Error grading submission:", error);
      toast({
        title: "Grading failed",
        description: "Could not save the grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingFor(null);
    }
  };

  const handleAddCommentToSubmission = async (
    submission: SubmissionWithDetails
  ) => {
    const text = (comments[submission.id] ?? "").trim();
    if (!text) return;

    setSavingFor(submission.id);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Add comment as a new grade entry (update existing or create new).
      // Preserve the existing grade value so a comment-only save does not
      // silently flip a graded submission back to pending.
      const existingGrade = submission.submission_grades?.[0]?.grade || "pending";
      const gradeData = {
        submission_id: submission.id,
        grade: existingGrade,
        feedback: text,
        comments: text,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("submission_grades")
        .upsert(gradeData, { onConflict: "submission_id" });

      if (error) {
        throw error;
      }

      setComments((prev) => {
        const next = { ...prev };
        delete next[submission.id];
        return next;
      });
      await loadSubmissions();
      onGradingComplete?.();

      toast({
        title: "Comment added",
        description: `Comment added to ${submission.student_node_progress.profiles.username}'s submission`,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Comment failed",
        description: "Could not add comment to submission",
        variant: "destructive",
      });
    } finally {
      setSavingFor(null);
    }
  };

  const getStatusBadge = (submission: SubmissionWithDetails) => {
    if (submission.submission_grades.length === 0) {
      return (
        <Badge variant="outline" className="text-amber-300/80 border-amber-300/30 bg-amber-300/5">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    const grade = submission.submission_grades[0];
    if (grade.grade === "pass") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/20 text-red-300 border border-red-400/30">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const SubmissionCard = ({
    submission,
    commentValue,
    onCommentChange,
    onCommentSubmit,
    onGrade,
    isSaving,
  }: {
    submission: SubmissionWithDetails;
    commentValue: string;
    onCommentChange: (value: string) => void;
    onCommentSubmit: () => void;
    onGrade: (grade: "pass" | "fail") => void;
    isSaving: boolean;
  }) => {
    const grade = submission.submission_grades[0];

    const isTeamSubmission = submission.metadata?.team_id !== undefined;
    const teamName = submission.metadata?.team_name || "Team Submission";

    const hasText = Boolean(submission.text_answer?.trim());
    const hasFiles = Boolean(submission.file_urls && submission.file_urls.length > 0);
    const hasQuiz = submission.node_assessments?.assessment_type === "quiz"
      && (submission.quiz_answers || submission.node_assessments?.quiz_questions?.length);

    return (
      <div className="ei-card mb-4 p-0 overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 ring-1 ring-white/10">
                <AvatarImage src={""} />
                <AvatarFallback className="bg-white/5 text-amber-200/80">
                  {submission.student_node_progress.profiles.username
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-amber-50 flex items-center gap-2">
                  {submission.student_node_progress.profiles.username}
                  {isTeamSubmission && (
                    <Users className="h-4 w-4 text-blue-400" />
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {submission.node_assessments?.map_nodes?.title ||
                    "Unknown Node"}{" "}
                  • {new Date(submission.submitted_at).toLocaleDateString()}
                  {isTeamSubmission && (
                    <span className="flex items-center gap-1 mt-0.5 text-blue-400/80">
                      <Users2 className="h-3 w-3" />
                      <span className="text-xs">{teamName}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge(submission)}
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
            {/* Assessment Type */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize border-amber-300/20 bg-amber-300/5 text-amber-200/70">
                {submission.node_assessments.assessment_type.replace("_", " ")}
              </Badge>
              {submission.node_assessments?.quiz_questions?.length ? (
                <span className="text-xs text-muted-foreground">
                  {submission.node_assessments.quiz_questions.length} questions
                </span>
              ) : null}
            </div>

            {/* === Student work, shown inline. No "View Details" click
                 required: instructors need to see everything to grade. === */}
            {hasText && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Written answer
                </div>
                <TextAnswer text={submission.text_answer!} />
              </div>
            )}

            {hasFiles && (
              <FileSubmissionViewer fileUrls={submission.file_urls!} />
            )}

            {hasQuiz && (
              <QuizAnswersView
                answers={submission.quiz_answers || {}}
                questions={submission.node_assessments?.quiz_questions || []}
              />
            )}

            {!hasText && !hasFiles && !hasQuiz && (
              <p className="text-sm text-muted-foreground italic">
                This submission has no content yet.
              </p>
            )}

            {/* === Previous grade, if any === */}
            {grade && (
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <strong className="text-amber-100">Previous Grade:</strong>{" "}
                    {grade.grade.toUpperCase()}
                    {grade.rating && <span> ({grade.rating}/5 stars)</span>}
                    {grade.points_awarded && (
                      <span> - {grade.points_awarded} points</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(grade.graded_at).toLocaleDateString()}
                  </div>
                </div>
                {grade.comments && (
                  <div className="mt-2 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                    <MessageSquare className="h-4 w-4 inline mr-1 align-text-bottom text-amber-300/60" />
                    {grade.comments}
                  </div>
                )}
              </div>
            )}

            {/* === Comment + grading controls === */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-amber-300/60" />
                <label className="text-sm font-medium text-amber-50">
                  Comment for {submission.student_node_progress.profiles.username}
                </label>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="What did the student do well? What needs work?"
                  value={commentValue}
                  onChange={(e) => onCommentChange(e.target.value)}
                  rows={3}
                  className="text-sm flex-1 bg-white/5 border-white/10 text-amber-50 placeholder:text-muted-foreground/50 focus:border-amber-300/30"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCommentSubmit}
                  disabled={!commentValue.trim() || isSaving}
                  title="Save comment without grading"
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-amber-100"
                >
                  {isSaving ? (
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60">
                Pass and Fail both save this comment with the grade. Write
                it once, then click the grade.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onGrade("pass")}
                disabled={isSaving}
                className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 hover:text-emerald-200"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Pass
              </Button>
              <Button
                size="sm"
                onClick={() => onGrade("fail")}
                disabled={isSaving}
                className="bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30 hover:text-red-200"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Fail
              </Button>
            </div>
          </div>
        </div>
    );
  };

  // Initial load (no data yet): take the whole panel with a skeleton so the
  // layout doesn't bounce in and out. Subsequent refreshes (we already have
  // submissions) keep the cards visible and overlay a thin progress bar at
  // the top — same idea as Gmail/Linear: never erase context you already
  // have.
  const isInitialLoad = isLoading && submissions.length === 0;

  if (isInitialLoad) {
    return (
      <div className="h-full flex flex-col dawn-panel">
        <div className="flex-shrink-0 dawn-panel__header p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-300/80" />
              <h3 className="font-semibold text-amber-50">
                {selectedNode
                  ? `Grading: ${selectedNode.data.title}`
                  : "Map Grading"}
              </h3>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <LoadingShell isLoading onRetry={loadSubmissions} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col dawn-panel">
      {/* Subsequent refresh: a single hairline progress bar at the top of the
          panel. The cards below stay mounted so the instructor keeps their
          scroll position and can keep grading. The bar uses `transform:
          scaleX` only — no layout-triggering property, so it costs nothing
          during the in-flight fetch. */}
      {isLoading && (
        <div
          className="grading-refresh-bar"
          role="progressbar"
          aria-label="Refreshing submissions"
          aria-busy="true"
        />
      )}
      {/* Header */}
      <div className="flex-shrink-0 dawn-panel__header p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-300/80" />
            <h3 className="font-semibold text-amber-50">
              {selectedNode
                ? `Grading: ${selectedNode.data.title}`
                : "Map Grading"}
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadSubmissions}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-amber-100"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-amber-400/70" />
            <span>{pendingSubmissions.length} Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-emerald-400/70" />
            <span>
              {
                gradedSubmissions.filter(
                  (s) => s.submission_grades[0]?.grade === "pass"
                ).length
              }{" "}
              Passed
            </span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-400/70" />
            <span>
              {
                gradedSubmissions.filter(
                  (s) => s.submission_grades[0]?.grade === "fail"
                ).length
              }{" "}
              Failed
            </span>
          </div>
        </div>

        {/* Team Filter */}
        <div className="flex gap-2 mt-3">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-32">
              <Users className="h-4 w-4 mr-1" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="team">Team Only</SelectItem>
              <SelectItem value="individual">Individual Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="pending" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="pending">
              Pending ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Graded ({gradedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="pending"
            className="flex-1 overflow-y-auto p-4 mt-0"
          >
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All submissions have been graded!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    commentValue={comments[submission.id] || ""}
                    onCommentChange={(value) =>
                      setComments((prev) => ({
                        ...prev,
                        [submission.id]: value,
                      }))
                    }
                    onCommentSubmit={() =>
                      handleAddCommentToSubmission(submission)
                    }
                    onGrade={(g) => handleGradeSubmission(submission, g)}
                    isSaving={savingFor === submission.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="graded"
            className="flex-1 overflow-y-auto p-4 mt-0"
          >
            {gradedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>No graded submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gradedSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    commentValue={comments[submission.id] || ""}
                    onCommentChange={(value) =>
                      setComments((prev) => ({
                        ...prev,
                        [submission.id]: value,
                      }))
                    }
                    onCommentSubmit={() =>
                      handleAddCommentToSubmission(submission)
                    }
                    onGrade={(g) => handleGradeSubmission(submission, g)}
                    isSaving={savingFor === submission.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Renders a student's text answer with light markdown-style preservation.
 * Unlike the student-facing SubmissionList, we keep paragraph breaks and
 * basic inline emphasis so the instructor can read what was actually
 * written. HTML is escaped first to prevent stored XSS via pasted markup.
 */
function TextAnswer({ text }: { text: string }) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Preserve paragraphs (blank-line splits), then convert **bold** and
  // *italic* inside each paragraph. Newlines within a paragraph become
  // <br> so a single-paragraph essay with hard wraps still reads cleanly.
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) =>
      p
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
        .replace(/\n/g, "<br />")
    );
  return (
    <div className="grading-text-answer text-sm leading-relaxed text-foreground/90">
      {paragraphs.map((html, i) => (
        <p
          key={i}
          className={i > 0 ? "mt-3" : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  );
}

/**
 * Renders a student's quiz responses alongside the question text and a
 * correctness indicator when the correct option is known.
 *
 * Two shapes are supported for `quiz_answers`:
 *   - keyed by question id (newer schema) — preferred, exact match.
 *   - keyed by 1-based index string — fallback for older submissions.
 *
 * If questions are not loaded (relation absent or empty), we still render
 * the raw answer map so the instructor sees what was submitted rather than
 * a useless count.
 */
function QuizAnswersView({
  answers,
  questions,
}: {
  answers: Record<string, string>;
  questions: {
    id: string;
    question_text: string;
    options: unknown | null;
    correct_option: string | null;
  }[];
}) {
  if (questions.length === 0) {
    // Fallback: questions not loaded. Show the answer map as raw key/value
    // pairs so the instructor still gets something to grade against.
    const entries = Object.entries(answers);
    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No quiz answers recorded.
        </p>
      );
    }
    return (
      <ul className="space-y-2 text-sm">
        {entries.map(([key, value]) => (
          <li key={key} className="border-l-2 border-border pl-3">
            <div className="text-xs text-muted-foreground">Question {key}</div>
            <div>{value}</div>
          </li>
        ))}
      </ul>
    );
  }

  // Some older submissions key `quiz_answers` by numeric index instead of
  // question id. Detect which one we're dealing with: if any question id
  // appears in the answers keys, prefer id-based lookup.
  const usesIndexKeys = questions.every((q) => !(q.id in answers));
  const lookup = (questionId: string, index: number): string | undefined => {
    if (usesIndexKeys) return answers[String(index + 1)];
    return answers[questionId];
  };

  return (
    <ol className="space-y-3">
      {questions.map((q, i) => {
        const studentAnswer = lookup(q.id, i);
        const correct = q.correct_option;
        const optionsList = Array.isArray(q.options)
          ? (q.options as Array<{ option?: string; text?: string; value?: string }>)
          : [];
        const normalisedStudent = studentAnswer?.trim().toLowerCase();
        const isCorrect =
          correct !== null &&
          correct !== undefined &&
          normalisedStudent !== undefined &&
          correct.toLowerCase() === normalisedStudent;

        return (
          <li
            key={q.id}
            className="border rounded-md p-3 bg-muted/30"
          >
            <div className="text-sm font-medium mb-2">
              <span className="text-muted-foreground mr-2">Q{i + 1}.</span>
              {q.question_text}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Answer: </span>
              <span
                className={
                  correct
                    ? isCorrect
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                    : ""
                }
              >
                {studentAnswer ?? <em className="text-muted-foreground">no answer</em>}
              </span>
              {correct && (
                <span className="text-xs text-muted-foreground ml-2">
                  (correct: {correct})
                </span>
              )}
            </div>
            {optionsList.length > 0 && (
              <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                {optionsList.map((opt, oi) => {
                  const optKey = opt.option ?? opt.value ?? String(oi);
                  const optText = opt.text ?? opt.option ?? String(opt);
                  const isStudentChoice = normalisedStudent === String(optKey).toLowerCase();
                  return (
                    <li
                      key={oi}
                      className={
                        isStudentChoice
                          ? "text-foreground"
                          : ""
                      }
                    >
                      {isStudentChoice ? "› " : "  "}
                      {optKey}. {optText}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
