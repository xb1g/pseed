// app/components/NodeViewPanel/SubmissionItem.tsx
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { AssessmentSubmission, SubmissionGrade } from "@/types/map";
import { markdownToSafeHtml } from "@/lib/security/sanitize-html";

interface SubmissionItemProps {
  submission: AssessmentSubmission;
  grade: SubmissionGrade | null;
  index: number; // Index in the submissions list
  totalSubmissions: number; // Total number of submissions
  progressStatus?:
    | "not_started"
    | "in_progress"
    | "submitted"
    | "passed"
    | "failed";
  assessment?: { points_possible?: number | null; is_graded?: boolean };
}

export function SubmissionItem({
  submission,
  grade,
  index,
  totalSubmissions,
  progressStatus,
  assessment,
}: SubmissionItemProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const isImageFile = (url: string): boolean => {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".heic",
      ".heif",
    ];
    const extension = url.toLowerCase().split(".").pop();
    return extension ? imageExtensions.includes(`.${extension}`) : false;
  };

  const getFileIcon = (url: string) => {
    if (isImageFile(url)) {
      return <ImageIcon className="h-4 w-4 text-amber-300" />;
    }
    return <FileText className="h-4 w-4 text-amber-300" />;
  };

  // Determine if this was auto-graded (system) or manually graded
  const isAutoGraded = grade && grade.graded_by === null;

  return (
    <>
      <div className={index === 0 ? "" : "opacity-90"}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-sm font-medium">
                Submission #{totalSubmissions - index}
              </span>
              {index === 0 && (
                <Badge variant="secondary" className="text-xs">
                  Latest
                </Badge>
              )}
            </div>
          </div>

          {submission.text_answer && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Your Answer:
              </p>
              <div
                className="learning-content-text"
                dangerouslySetInnerHTML={{
                  __html: markdownToSafeHtml(submission.text_answer),
                }}
              />
            </div>
          )}

          {submission.file_urls && submission.file_urls.length > 0 && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg border space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Your Files ({submission.file_urls.length}):
              </p>
              {submission.file_urls.map((url: string, fileIndex: number) => (
                <div key={fileIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getFileIcon(url)}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline text-sm transition-colors"
                    >
                      File {fileIndex + 1} - View
                    </a>
                  </div>

                  {/* Image thumbnail */}
                  {isImageFile(url) && (
                    <div className="ml-6">
                      <img
                        src={url}
                        alt={`File ${fileIndex + 1}`}
                        className="max-w-32 max-h-20 object-cover rounded border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setExpandedImage(url)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {grade ? (
            (() => {
              const passed = grade.grade === "pass";
              // Auto-graded quizzes: show just the score ("2/2"), pulled from
              // the system comment; fall back to points for manual grades.
              const scoreMatch = isAutoGraded
                ? grade.comments?.match(/(\d+)\s*\/\s*(\d+)\s*correct/)
                : null;
              const scoreText = scoreMatch
                ? `${scoreMatch[1]}/${scoreMatch[2]}`
                : grade.points_awarded != null && assessment?.points_possible
                  ? `${grade.points_awarded}/${assessment.points_possible}`
                  : grade.points_awarded != null
                    ? `${grade.points_awarded} pts`
                    : null;

              return (
                <div
                  className={`mt-3 p-3 rounded-lg border ${
                    passed
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        passed
                          ? "text-green-800 dark:text-green-200"
                          : "text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {passed ? "Passed" : "Not quite — try again"}
                    </span>
                    {scoreText && (
                      <span
                        className={`text-sm font-bold ${
                          passed
                            ? "text-green-700 dark:text-green-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {scoreText}
                      </span>
                    )}
                  </div>
                  {/* Human feedback is worth showing; system chatter is not */}
                  {!isAutoGraded && grade.comments && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      "{grade.comments}"
                    </p>
                  )}
                </div>
              );
            })()
          ) : progressStatus === "passed" ? (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Completed Successfully
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                You have successfully completed this checklist assessment.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Awaiting Review
                </span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Your submission is being reviewed by the instructor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Expansion Modal */}
      {expandedImage && (
        <Dialog
          open={!!expandedImage}
          onOpenChange={() => setExpandedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-background border">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative bg-black dark:bg-background rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 dark:bg-background/80 text-white dark:text-foreground hover:bg-black/70 dark:hover:bg-muted rounded-full"
                onClick={() => setExpandedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={expandedImage}
                alt="Expanded view"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
