import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  CheckSquare,
  Star,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { MapNode, StudentNodeProgress } from "@/types/map";
import { cn } from "@/lib/utils";

type NodeHeaderData = Pick<
  MapNode,
  "title" | "instructions" | "difficulty" | "sprite_url"
>;

interface NodeHeaderViewProps {
  nodeData: NodeHeaderData | undefined;
  progress: StudentNodeProgress | null;
  currentUser: any;
  hasStarted: boolean;
  isStarting: boolean;
  onStartNode: () => void;
  /** Compact EN/ไทย control, sits on the title row. */
  languageToggle?: ReactNode;
  /** Scroll-compressed: title + lang only. */
  compact?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "passed":
      return "default";
    case "failed":
      return "destructive";
    case "submitted":
      return "secondary";
    case "in_progress":
      return "outline";
    default:
      return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "passed":
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 mr-1" />;
    case "submitted":
      return <CheckSquare className="h-3 w-3 mr-1" />;
    case "in_progress":
      return <Clock className="h-3 w-3 mr-1 animate-pulse" />;
    default:
      return null;
  }
};

function statusTone(status: string) {
  switch (status) {
    case "passed":
      return "border-emerald-400/25 bg-emerald-400/15 text-emerald-200";
    case "failed":
      return "border-red-400/25 bg-red-400/15 text-red-200";
    case "submitted":
      return "border-amber-200/25 bg-amber-200/10 text-amber-200";
    case "in_progress":
      return "border-sky-400/25 bg-sky-400/10 text-sky-200";
    default:
      return "border-white/10 bg-white/5 text-stone-300";
  }
}

export function NodeHeaderView({
  nodeData,
  progress,
  languageToggle,
  compact = false,
}: NodeHeaderViewProps) {
  if (!nodeData) return null;

  return (
    <div
      className={cn(
        "node-panel-header pl-4 pr-12 transition-[padding] duration-200 ease-[cubic-bezier(0.05,0.7,0.35,0.99)] motion-reduce:transition-none",
        compact ? "py-2" : "pt-4 pb-3",
      )}
    >
      <div className={cn("flex gap-2.5", compact ? "items-center" : "items-start")}>
        {nodeData.sprite_url && !compact && (
          <img
            src={nodeData.sprite_url}
            alt=""
            className="mt-0.5 h-9 w-9 shrink-0 object-contain opacity-80"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className={cn("flex gap-2", compact ? "items-center" : "items-start")}>
            <h2
              className={cn(
                "min-w-0 flex-1 font-semibold text-foreground",
                compact
                  ? "truncate text-sm"
                  : "text-base leading-snug line-clamp-2",
              )}
            >
              {nodeData.title}
            </h2>
            {languageToggle}
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.05,0.7,0.35,0.99)] motion-reduce:transition-none",
              compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
            )}
            aria-hidden={compact}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 font-medium text-stone-300"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Level {nodeData.difficulty}
                </Badge>
                {nodeData.sprite_url && (
                  <Badge
                    variant="secondary"
                    className="border-amber-200/25 bg-amber-200/10 font-medium text-amber-200"
                  >
                    <Trophy className="mr-1 h-3 w-3" />
                    Boss Node
                  </Badge>
                )}
                {progress && (
                  <Badge
                    variant={getStatusBadgeVariant(progress.status)}
                    className={cn("font-medium", statusTone(progress.status))}
                  >
                    {getStatusIcon(progress.status)}
                    {progress.status.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </div>
              {nodeData.instructions && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {nodeData.instructions}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
