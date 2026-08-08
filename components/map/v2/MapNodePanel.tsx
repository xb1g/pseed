"use client";

import React, { useMemo, useState, useCallback } from "react";
import type {
  MapNode,
  NodeContent,
  NodeAssessment,
  QuizQuestion,
  ProgressStatus,
} from "@/types/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Play,
  Lock,
  AlertTriangle,
  X,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

interface MapNodePanelProps {
  node: MapNode & {
    node_content: NodeContent[];
    node_assessments: (NodeAssessment & { quiz_questions: QuizQuestion[] })[];
  };
  progress: { status: ProgressStatus } | null;
  onClose: () => void;
  onProgressUpdate: (nodeId: string, status: ProgressStatus) => void;
  className?: string;
}

const statusConfig: Record<ProgressStatus, { label: string; icon: React.ElementType; color: string }> = {
  not_started: { label: "Not Started", icon: Lock, color: "bg-slate-700 text-slate-200 border-slate-600" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-amber-600/30 text-amber-200 border-amber-500/40" },
  submitted: { label: "Submitted", icon: FileText, color: "bg-blue-600/30 text-blue-200 border-blue-500/40" },
  passed: { label: "Passed", icon: CheckCircle, color: "bg-emerald-600/30 text-emerald-200 border-emerald-500/40" },
  failed: { label: "Failed", icon: AlertTriangle, color: "bg-red-600/30 text-red-200 border-red-500/40" },
};

const toEmbed = (url: string | null): string => {
  if (!url) return "";
  try {
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  } catch {}
  return url;
};

const difficultyLabel = (d: number) => (d <= 3 ? "Beginner" : d <= 6 ? "Intermediate" : "Advanced");

export default function MapNodePanel({ node, progress, onClose, onProgressUpdate, className = "" }: MapNodePanelProps) {
  const status = progress?.status ?? "not_started";
  const { label, icon: StatusIcon, color } = statusConfig[status];
  const sortedContent = useMemo(
    () => [...node.node_content].sort((a, b) => a.display_order - b.display_order),
    [node.node_content]
  );

  const [quiz, setQuiz] = useState<Record<string, string>>({});
  const [text, setText] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const start = useCallback(() => onProgressUpdate(node.id, "in_progress"), [node.id, onProgressUpdate]);
  const submit = useCallback(() => onProgressUpdate(node.id, "submitted"), [node.id, onProgressUpdate]);

  const hasAssessment = node.node_assessments.length > 0;
  const canSubmit = status === "in_progress" && hasAssessment;

  const renderContent = (c: NodeContent) => {
    switch (c.content_type) {
      case "video":
      case "canva_slide":
        return (
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe src={toEmbed(c.content_url)} title={c.content_title || c.content_type} allowFullScreen className="h-full w-full" />
          </div>
        );
      case "text":
        return <div className="whitespace-pre-wrap text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: c.content_body || "" }} />;
      case "image":
        return <img src={c.content_url || ""} alt={c.content_title || "Node image"} className="max-h-80 rounded-lg object-contain" />;
      case "pdf":
      case "resource_link":
        return (
          <a href={c.content_url || ""} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
            {c.content_type === "pdf" ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            {c.content_title || (c.content_type === "pdf" ? "Open PDF" : "Open Link")}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-full w-full ${className}`}>
      <Card className="ei-card flex h-full w-full flex-col border-l border-white/10 bg-slate-900/95 text-white shadow-2xl">
        <CardHeader className="flex-shrink-0 space-y-4 border-b border-white/10 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl font-semibold leading-tight">{node.title}</CardTitle>
              {node.instructions && <p className="mt-1 text-sm text-slate-400">{node.instructions}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">{difficultyLabel(node.difficulty)}</Badge>
            <Badge variant="outline" className={color}><StatusIcon className="mr-1 h-4 w-4" />{label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-6 overflow-y-auto py-5 pr-2">
          {sortedContent.length === 0 && node.node_assessments.length === 0 && (
            <p className="text-sm text-slate-400">No content available for this node.</p>
          )}

          {sortedContent.map((c) => (
            <div key={c.id} className="space-y-2">
              {c.content_title && <h3 className="text-sm font-semibold text-slate-200">{c.content_title}</h3>}
              {renderContent(c)}
            </div>
          ))}

          {node.node_assessments.length > 0 && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Assessments</h3>
              {node.node_assessments.map((a) => (
                <div key={a.id} className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  {a.assessment_type === "quiz" && a.quiz_questions?.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-medium text-slate-200">{q.question_text}</p>
                      <div className="space-y-1">
                        {q.options?.map((o) => (
                          <label key={o.option} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm text-slate-300 hover:bg-white/5">
                            <input type="radio" name={q.id} value={o.option} checked={quiz[q.id] === o.option}
                              onChange={() => setQuiz((p) => ({ ...p, [q.id]: o.option }))} className="accent-orange-500" />
                            {o.text}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {a.assessment_type === "text_answer" && (
                    <textarea value={text[a.id] || ""} onChange={(e) => setText((p) => ({ ...p, [a.id]: e.target.value }))}
                      placeholder="Type your answer here..." rows={4}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none" />
                  )}

                  {(a.assessment_type === "file_upload" || a.assessment_type === "image_upload") && (
                    <label className="flex cursor-pointer flex-col gap-2">
                      <span className="text-sm text-slate-300">Upload {a.assessment_type === "image_upload" ? "an image" : "a file"}</span>
                      <input type="file" accept={a.assessment_type === "image_upload" ? "image/*" : undefined}
                        onChange={(e) => setFiles((p) => ({ ...p, [a.id]: e.target.files?.[0] || null }))}
                        className="text-sm text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-orange-500" />
                    </label>
                  )}

                  {a.assessment_type === "checklist" && Array.isArray(a.metadata?.items) && (
                    <div className="space-y-2">
                      {a.metadata.items.map((item: string, i: number) => (
                        <label key={i} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm text-slate-300 hover:bg-white/5">
                          <input type="checkbox" checked={!!checks[`${a.id}-${i}`]}
                            onChange={(e) => setChecks((p) => ({ ...p, [`${a.id}-${i}`]: e.target.checked }))} className="accent-orange-500" />
                          {item}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="flex-shrink-0 border-t border-white/10 p-5">
          {status === "not_started" && (
            <button onClick={start} className="ei-button-dusk w-full justify-center">
              <Play className="h-4 w-4" /> Start
            </button>
          )}
          {canSubmit && (
            <button onClick={submit} className="ei-button-dusk w-full justify-center">
              <FileText className="h-4 w-4" /> Submit
            </button>
          )}
          {status === "passed" && (
            <Badge variant="outline" className="w-full justify-center border-emerald-500/40 bg-emerald-600/20 py-2 text-emerald-200">
              <CheckCircle className="mr-1 h-4 w-4" /> Completed
            </Badge>
          )}
          {status === "submitted" && (
            <Badge variant="outline" className="w-full justify-center border-blue-500/40 bg-blue-600/20 py-2 text-blue-200">
              <Clock className="mr-1 h-4 w-4" /> Awaiting Review
            </Badge>
          )}
          {status === "failed" && (
            <button onClick={start} className="ei-button-dusk w-full justify-center">
              <Play className="h-4 w-4" /> Retry
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
