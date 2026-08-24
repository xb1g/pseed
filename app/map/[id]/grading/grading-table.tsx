"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Users,
} from "lucide-react";
import { ViewAndGradeDialog } from "./view-and-grade-dialog";
import { ViewSubmissionDialog } from "./view-submission-dialog";
import { GradeSubmissionForm } from "./grade-submission-form";
import { SubmissionWithDetails } from "@/lib/supabase/grading";
import { User, Bot } from "lucide-react";

interface GradingTableProps {
  submissions: SubmissionWithDetails[];
  userId: string;
  mapId?: string;
  assignmentId?: string;
  /** user_id -> lobby (room) name, for grouping and sorting by room. */
  roomByUserId?: Record<string, string>;
  /** Maps translation node ID -> primary (English) node title.
   *  Used to normalize Thai node titles in the table and filter dropdown. */
  translationTitleMap?: Record<string, string>;
}

type SortKey = "student" | "room" | "node" | "submitted" | "status";
type SortDir = "asc" | "desc";

/** Lower rank = needs the grader's attention sooner. */
const statusRank = (s: SubmissionWithDetails): number => {
  if (s.submission_grades.length === 0) return 0; // pending
  return s.submission_grades[0]?.grade === "fail" ? 1 : 2;
};

export function GradingTable({
  submissions,
  userId,
  mapId,
  assignmentId,
  roomByUserId = {},
  translationTitleMap = {},
}: GradingTableProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nodeFilter, setNodeFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  // Default: pending first, newest inside each status group.
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const roomOf = (submission: SubmissionWithDetails): string | null =>
    roomByUserId[submission.student_node_progress.profiles.id] ?? null;

  // Normalize a node title: if the submission is against a translation node,
  // show the primary (English) title so the teacher sees one consistent label.
  const nodeTitleOf = (submission: SubmissionWithDetails): string => {
    const nodeId = submission.node_assessments?.map_nodes?.id;
    const rawTitle = submission.node_assessments?.map_nodes?.title ?? "";
    return translationTitleMap[nodeId ?? ""] ?? rawTitle;
  };

  // Filter out submissions that do not belong to the current map
  const validSubmissions = submissions.filter(
    (s) =>
      s &&
      s.node_assessments &&
      s.node_assessments.map_nodes &&
      s.node_assessments.map_nodes.title &&
      (!mapId || s.node_assessments.map_nodes.map_id === mapId)
  );

  // Get unique nodes for filtering (normalized so Thai nodes merge with English)
  const uniqueNodes = Array.from(
    new Set(validSubmissions.map((s) => nodeTitleOf(s)))
  );

  // Rooms present among these submissions, with pending counts for the chips.
  const roomSummaries = useMemo(() => {
    const byRoom = new Map<string, { total: number; pending: number }>();
    let noRoom = 0;
    let noRoomPending = 0;
    for (const s of validSubmissions) {
      const room = roomOf(s);
      const pending = s.submission_grades.length === 0 ? 1 : 0;
      if (room) {
        const entry = byRoom.get(room) ?? { total: 0, pending: 0 };
        entry.total += 1;
        entry.pending += pending;
        byRoom.set(room, entry);
      } else {
        noRoom += 1;
        noRoomPending += pending;
      }
    }
    const rooms = Array.from(byRoom.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { rooms, noRoom, noRoomPending };
  }, [validSubmissions, roomByUserId]);

  // Filter submissions
  const filteredSubmissions = validSubmissions.filter((submission) => {
    const matchesSearch = submission.student_node_progress.profiles.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" &&
        submission.submission_grades.length === 0) ||
      (statusFilter === "graded" && submission.submission_grades.length > 0) ||
      (statusFilter === "passed" &&
        submission.submission_grades[0]?.grade === "pass") ||
      (statusFilter === "failed" &&
        submission.submission_grades[0]?.grade === "fail");

    const matchesNode =
      nodeFilter === "all" || nodeTitleOf(submission) === nodeFilter;

    const room = roomOf(submission);
    const matchesRoom =
      roomFilter === "all" ||
      (roomFilter === "__none__" ? room === null : room === roomFilter);

    return matchesSearch && matchesStatus && matchesNode && matchesRoom;
  });

  // Sort: chosen key, with a stable newest-first tiebreak so rows never jump.
  const sortedSubmissions = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const newestFirst = (a: SubmissionWithDetails, b: SubmissionWithDetails) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();

    return [...filteredSubmissions].sort((a, b) => {
      switch (sortKey) {
        case "student":
          return (
            dir *
              a.student_node_progress.profiles.username.localeCompare(
                b.student_node_progress.profiles.username
              ) || newestFirst(a, b)
          );
        case "room":
          return (
            dir * (roomOf(a) ?? "").localeCompare(roomOf(b) ?? "") ||
            statusRank(a) - statusRank(b) ||
            newestFirst(a, b)
          );
        case "node":
          return (
            dir *
              nodeTitleOf(a).localeCompare(nodeTitleOf(b)) ||
            newestFirst(a, b)
          );
        case "submitted":
          return dir * -newestFirst(a, b);
        case "status":
        default:
          return (
            dir * (statusRank(a) - statusRank(b)) || newestFirst(a, b)
          );
      }
    });
  }, [filteredSubmissions, sortKey, sortDir, roomByUserId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Newest-first is the natural first click for dates; others ascend.
      setSortDir(key === "submitted" ? "desc" : "asc");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
    } finally {
      // Reset after a short delay to show the refresh animation
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getStatusBadge = (submission: SubmissionWithDetails) => {
    if (submission.submission_grades.length === 0) {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    const grade = submission.submission_grades[0];
    if (grade.grade === "pass") {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const SortableHead = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(sortKeyName)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
      >
        {label}
        {sortKey === sortKeyName ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  const roomChipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active
        ? "border-amber-300 bg-amber-100 text-amber-900"
        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="space-y-4">
      {/* Assignment Filter Note */}
      {assignmentId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <GraduationCap className="h-4 w-4" />
            <span className="font-medium">Assignment Filter Active</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Showing submissions filtered for a specific classroom assignment.
          </p>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={nodeFilter} onValueChange={setNodeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Nodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nodes</SelectItem>
              {uniqueNodes.map((node) => (
                <SelectItem key={node} value={node}>
                  {node}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Room chips: click to filter, pending counts keep grading urgent. */}
      {(roomSummaries.rooms.length > 0 || roomSummaries.noRoom > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <button
            type="button"
            onClick={() => setRoomFilter("all")}
            className={roomChipClass(roomFilter === "all")}
          >
            All rooms
          </button>
          {roomSummaries.rooms.map((room) => (
            <button
              key={room.name}
              type="button"
              onClick={() =>
                setRoomFilter(roomFilter === room.name ? "all" : room.name)
              }
              className={roomChipClass(roomFilter === room.name)}
            >
              {room.name}
              <span className="opacity-70">
                {room.pending > 0
                  ? `${room.pending} pending`
                  : `${room.total} done`}
              </span>
            </button>
          ))}
          {roomSummaries.noRoom > 0 && (
            <button
              type="button"
              onClick={() =>
                setRoomFilter(roomFilter === "__none__" ? "all" : "__none__")
              }
              className={roomChipClass(roomFilter === "__none__")}
            >
              No room
              <span className="opacity-70">
                {roomSummaries.noRoomPending > 0
                  ? `${roomSummaries.noRoomPending} pending`
                  : `${roomSummaries.noRoom} done`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSubmissions.length} of {validSubmissions.length} valid
        submissions
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Student" sortKeyName="student" />
              <SortableHead label="Room" sortKeyName="room" />
              <SortableHead label="Node" sortKeyName="node" />
              <TableHead>Assessment Type</TableHead>
              <SortableHead label="Submitted" sortKeyName="submitted" />
              <SortableHead label="Status" sortKeyName="status" />
              <TableHead>Graded By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubmissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  {submissions.length === 0
                    ? "No submissions found for this map."
                    : "No submissions match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              sortedSubmissions.map((submission) => {
                const grade = submission.submission_grades[0];
                const isAutoGraded = grade && grade.graded_by === null;
                const graderInfo = grade
                  ? isAutoGraded
                    ? {
                        name: "System",
                        icon: <Bot className="h-3 w-3 text-purple-600" />,
                      }
                    : {
                        name: "Instructor",
                        icon: <User className="h-3 w-3 text-blue-600" />,
                      }
                  : null;
                const profile = submission.student_node_progress.profiles;
                const room = roomOf(submission);

                return (
                  <TableRow
                    key={submission.id}
                    className={
                      submission.submission_grades.length === 0
                        ? "bg-orange-50/40"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {profile.avatar_url && (
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={profile.username}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {profile.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {profile.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      {room ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-800 bg-amber-50 font-normal"
                        >
                          {room}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {nodeTitleOf(submission) || "Unknown Node"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {submission.node_assessments.assessment_type.replace(
                          "_",
                          " "
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(submission)}
                        {grade?.points_awarded != null && (
                          <span className="text-xs text-muted-foreground">
                            {grade.points_awarded} pts
                          </span>
                        )}
                        {isAutoGraded && (
                          <Badge variant="secondary" className="text-xs">
                            🤖 Auto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {graderInfo ? (
                        <div className="flex items-center gap-2">
                          {graderInfo.icon}
                          <span className="text-sm">{graderInfo.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ViewSubmissionDialog submission={submission} />
                        {/* Only show grade button for non-auto-graded submissions */}
                        {(submission.submission_grades.length === 0 ||
                          submission.submission_grades[0].graded_by !==
                            null) && (
                          <GradeSubmissionForm
                            submission={submission}
                            userId={userId}
                          />
                        )}
                        {/* Show "Auto-Graded" indicator for system grades */}
                        {submission.submission_grades.length > 0 &&
                          submission.submission_grades[0].graded_by ===
                            null && (
                            <Badge variant="outline" className="text-xs">
                              Auto-Graded
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
