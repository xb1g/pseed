"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Controls,
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  CoordinateExtent,
  OnSelectionChangeParams,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { NodeViewPanel } from "@/components/map/NodeViewPanel";
import { FullLearningMap } from "@/lib/supabase/maps";
import {
  getStudentProgress,
  loadAllProgress as loadMapProgress,
  type StudentProgress,
} from "@/lib/supabase/progresses";
import { MapNode } from "@/types/map";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TextNode } from "@/components/map/MapEditor/components/TextNode";
import { CommentNode } from "@/components/map/CommentNode";
import { SubmissionList } from "./SubmissionList";
import { InlineGradingForm } from "./InlineGradingForm";
import { getSubmissionsForMap } from "@/lib/supabase/grading";
import {
  getTeamMapClassroomInfo,
  getUserClassroomRoleClient,
  getUserTeamForMap,
} from "@/lib/supabase/maps";
import { getTeamProgressForInstructor } from "@/lib/supabase/team-progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Lock,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
} from "lucide-react";
import FloatingEdge from "@/components/map/FloatingEdge";
import { getNodeDepthMap } from "@/components/map/v2/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { SeedCompletionModal } from "@/components/seeds/SeedCompletionModal";
import { SeedLeaderboard } from "@/components/seeds/SeedLeaderboard";
import {
  markSeedRoomCompleted,
  checkSeedRoomCompletion,
  isEndNode,
} from "@/lib/supabase/seed-completion";
import { isEditable } from "@/lib/dom/is-editable";

interface MapViewerProps {
  map: FullLearningMap;
  seedRoomId?: string;
  seedTitle?: string;
  seedId?: string;
  roomSettingsComponent?: React.ReactNode;
  // When true, NodeViewPanel always renders the plain student view
  // (no "Student View | Grading" tab bar), used by the editor preview.
  forceStudentView?: boolean;
  // Prototype "trail" mode (Duolingo-style bottom-to-top path): derives node
  // positions from the node_paths graph, opens centered on the current node,
  // and uses a mobile bottom sheet instead of the resizable side panel.
  trailMode?: boolean;
}

// ---- Trail mode layout (prototype) ----
// Vertical distance between depth levels and horizontal zigzag amplitude.
const TRAIL_LEVEL_GAP = 190;
const TRAIL_ZIGZAG_AMPLITUDE = 140;
// Estimated rendered size of a trail node (island sprite + label). React Flow
// positions anchor a node's TOP-LEFT corner, so clamp/centering math must add
// the node width — otherwise right-zigzag nodes overflow narrow screens.
// (Measured: the island node box renders ~150 flow units wide/tall.)
const TRAIL_NODE_W = 150;
const TRAIL_NODE_H = 200;
// Zigzag sequence around the center column: center → right → left → center …
// The amplitude is responsive: narrow viewports get a tighter wiggle.
const trailZigzag = (amplitude: number) => [0, amplitude, -amplitude];
// Opening/auto-advance zoom level and pan clamp padding for the trail view.
const TRAIL_ZOOM = 1.1;
const TRAIL_X_PAD_MAX = 240; // max horizontal padding around the trail column
const TRAIL_Y_PAD = 350; // vertical padding above the top / below the bottom

interface TrailLayout {
  positions: Map<string, { x: number; y: number }>;
  // Trail node ids ordered bottom-to-top (depth ascending, then zigzag order).
  orderedIds: string[];
}

// Only learning/end nodes join the trail; text/comment nodes are annotations
// and keep their stored metadata.position.
function isTrailStepNode(node: MapNode): boolean {
  const nodeType = (node as any)?.node_type;
  return nodeType !== "text" && nodeType !== "comment";
}

function compareTrailNodes(a: MapNode, b: MapNode): number {
  return (
    (a.difficulty ?? 0) - (b.difficulty ?? 0) ||
    (a.title ?? "").localeCompare(b.title ?? "")
  );
}

function computeTrailLayout(
  map: FullLearningMap,
  amplitude: number = TRAIL_ZIGZAG_AMPLITUDE,
): TrailLayout {
  const trailNodes = map.map_nodes.filter(isTrailStepNode);
  const positions = new Map<string, { x: number; y: number }>();
  const orderedIds: string[] = [];
  if (trailNodes.length === 0) return { positions, orderedIds };

  const zigzag = trailZigzag(amplitude);

  const edges = trailNodes.flatMap((node) =>
    (node.node_paths_source ?? [])
      .filter((path) => path.destination_node_id)
      .map((path) => ({
        source: path.source_node_id,
        target: path.destination_node_id!,
      })),
  );

  let depth: Map<string, number>;
  if (edges.length === 0) {
    // No prerequisite graph at all (e.g. single-path or single-node maps):
    // fall back to a straight trail ordered by difficulty, then title.
    const sorted = [...trailNodes].sort(compareTrailNodes);
    depth = new Map(sorted.map((node, index) => [node.id, index]));
  } else {
    depth = getNodeDepthMap(
      trailNodes.map((node) => ({ id: node.id, data: node })),
      edges,
    );
  }

  // Group nodes by depth level.
  const levels = new Map<number, MapNode[]>();
  for (const node of trailNodes) {
    const d = depth.get(node.id) ?? 0;
    if (!levels.has(d)) levels.set(d, []);
    levels.get(d)!.push(node);
  }

  // Depth 0 (start nodes) sits at the BOTTOM; increasing depth goes UP by
  // inverting the y axis. Nodes consume one shared zigzag sequence so a
  // single-path map winds around the center column and nodes sharing a depth
  // spread along that same sequence.
  let step = 0;
  const sortedDepths = [...levels.keys()].sort((a, b) => a - b);
  for (const d of sortedDepths) {
    const levelNodes = levels.get(d)!.sort(compareTrailNodes);
    for (const node of levelNodes) {
      positions.set(node.id, {
        x: zigzag[step % zigzag.length],
        y: -d * TRAIL_LEVEL_GAP,
      });
      orderedIds.push(node.id);
      step++;
    }
  }

  return { positions, orderedIds };
}

const edgeTypes = {
  floating: FloatingEdge,
};

const miniMapConfig = {
  position: "bottom-right" as const,
  nodeBorderRadius: 8,
  nodeStrokeWidth: 2,
  nodeColor: (node: any) => {
    const progress = node.data?.progress;
    if (!progress) return "#94a3b8"; // Default slate-400

    switch (progress.status) {
      case "passed":
        return "#22c55e"; // Green-500
      case "failed":
        return "#ef4444"; // Red-500
      case "submitted":
        return "#3b82f6"; // Blue-500
      case "in_progress":
        return "#f59e0b"; // Amber-500
      default:
        return "#94a3b8"; // Slate-400
    }
  },
  style: {
    transform: "scale(0.8)",
    transformOrigin: "bottom right",
  },
  nodeStrokeColor: "#ffffff",
  bgColor: "rgba(15, 23, 42, 0.8)", // slate-900 with opacity
  maskColor: "rgba(255, 255, 255, 0.1)",
  maskStrokeColor: "#ffffff",
  maskStrokeWidth: 1,
  pannable: true,
  zoomable: true,
  ariaLabel: "Learning map overview",
  offsetScale: 5,
};

export function MapViewer({
  map,
  seedRoomId,
  seedTitle,
  seedId,
  roomSettingsComponent,
  forceStudentView = false,
  trailMode = false,
}: MapViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Allow both individual (Record<string, StudentProgress>) and team summaries
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [showGradingOverview, setShowGradingOverview] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [classroomRole, setClassroomRole] = useState<string | null>(null);
  const [isTeamMap, setIsTeamMap] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  // Seed completion state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasCompletedSeed, setHasCompletedSeed] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [completionData, setCompletionData] = useState<{
    completionId: string;
    completionDate: string;
    nodeId: string;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Trail mode (prototype): layout derived from the node_paths graph,
  // viewport centered on the student's current node once progress settles.
  const isMobile = useIsMobile();

  // Measure the map container width so the zigzag and pan clamp can keep the
  // trail column filling (but never exceeding) the screen on any viewport.
  const [flowWidth, setFlowWidth] = useState(0);
  useEffect(() => {
    if (!trailMode || typeof window === "undefined") return;
    const update = () => {
      const el = document.querySelector(".react-flow");
      if (el) setFlowWidth(el.getBoundingClientRect().width);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [trailMode, isMounted, isMobile]);

  // Responsive zigzag: the whole node (anchor + width) must fit the viewport
  // at trail zoom, so narrow phones get a tighter wiggle.
  const trailAmplitude = useMemo(() => {
    if (flowWidth <= 0) return TRAIL_ZIGZAG_AMPLITUDE;
    const viewportFlowWidth = flowWidth / TRAIL_ZOOM;
    return Math.max(
      60,
      Math.min(TRAIL_ZIGZAG_AMPLITUDE, (viewportFlowWidth - TRAIL_NODE_W) / 2 - 16),
    );
  }, [flowWidth]);
  const trailLayout = useMemo(
    () => (trailMode ? computeTrailLayout(map, trailAmplitude) : null),
    [trailMode, map, trailAmplitude],
  );
  const [progressReady, setProgressReady] = useState(false);
  const trailCenteredRef = useRef(false);

  // Pan clamp for trail mode. d3-zoom (used by React Flow) centers the
  // viewport on the extent whenever the extent is narrower than the
  // viewport, so keeping the x extent ≤ the viewport width (in flow units)
  // locks horizontal panning entirely while vertically the user can only pan
  // TRAIL_Y_PAD past the top/bottom of the trail.
  const trailTranslateExtent = useMemo((): CoordinateExtent | undefined => {
    if (!trailMode || !trailLayout || trailLayout.orderedIds.length === 0) {
      return undefined;
    }
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const id of trailLayout.orderedIds) {
      const p = trailLayout.positions.get(id);
      if (!p) continue;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    if (!isFinite(minX)) return undefined;

    // Positions anchor the node's top-left corner; the visible node extends
    // TRAIL_NODE_W/H to the right/down, so the extent must cover that too.
    const spanX = maxX + TRAIL_NODE_W - minX;
    const viewportFlowWidth = flowWidth > 0 ? flowWidth / TRAIL_ZOOM : 0;
    // Keep the extent a few units NARROWER than the viewport (not exactly
    // equal) — exact equality leaves sub-pixel rounding slack that lets the
    // map wiggle left/right a little on touchscreens.
    const xPad =
      viewportFlowWidth > 0
        ? Math.max(
            0,
            Math.min(TRAIL_X_PAD_MAX, (viewportFlowWidth - spanX) / 2 - 4),
          )
        : TRAIL_X_PAD_MAX;

    return [
      [minX - xPad, minY - TRAIL_Y_PAD],
      [maxX + TRAIL_NODE_W + xPad, maxY + TRAIL_NODE_H + TRAIL_Y_PAD],
    ];
  }, [trailMode, trailLayout, flowWidth]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Role detection for instructor/TA functionality
  const { user: authUser, userRoles, isAuthenticated } = useAuth();

  // Use a strict union for roles to satisfy prop typing
  type UserRole = "instructor" | "TA" | "student" | "admin";
  const globalUserRole: UserRole = useMemo(() => {
    return userRoles?.includes("admin")
      ? "admin"
      : userRoles?.includes("instructor")
        ? "instructor"
        : userRoles?.includes("TA")
          ? "TA"
          : "student";
  }, [userRoles]);

  // Normalize classroom role into the union or ignore if unknown
  const roleFromClassroom = useMemo(() => {
    return classroomRole === "instructor" ||
      classroomRole === "TA" ||
      classroomRole === "student"
      ? (classroomRole as UserRole)
      : null;
  }, [classroomRole]);

  // Use classroom role if available, otherwise fall back to global role
  const userRole: UserRole = roleFromClassroom ?? globalUserRole;
  const isInstructorOrTA = useMemo(() => {
    return (
      userRole === "instructor" || userRole === "TA" || userRole === "admin"
    );
  }, [userRole]);

  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);

  // Toggle panel minimize/maximize
  const togglePanelSize = useCallback(() => {
    if (!rightPanelRef.current || !leftPanelRef.current) return;

    if (isPanelMinimized) {
      // Maximize: restore to appropriate size based on selection
      if (selectedNode) {
        rightPanelRef.current.resize(65);
        leftPanelRef.current.resize(35);
      } else {
        rightPanelRef.current.resize(30);
        leftPanelRef.current.resize(70);
      }
      setIsPanelMinimized(false);
    } else {
      // Minimize: shrink right panel to minimal size
      rightPanelRef.current.resize(5);
      leftPanelRef.current.resize(95);
      setIsPanelMinimized(true);
    }
  }, [isPanelMinimized, selectedNode]);

  // Close the node panel/sheet. Must also clear the React Flow selection —
  // otherwise the RF node stays `selected` and tapping the same node again
  // fires no selection change, so the panel never reopens.
  const closeNodePanel = useCallback(() => {
    setSelectedNode(null);
    setNodes((nds) =>
      nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
    );
  }, [setNodes]);

  // Keyboard navigation (scoped to non-editable contexts)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!reactFlowInstance) return;

      // Do not handle when user is typing or during IME composition
      if (event.isComposing) return;
      if (isEditable(event.target)) return;

      const key = event.key?.toLowerCase?.() ?? event.key;
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

      // Do not intercept plain character keys like "f" without a modifier
      if (key && key.length === 1 && !hasModifier) {
        return;
      }

      // Escape to clear selection
      if (key === "escape") {
        closeNodePanel();
        if (rightPanelRef.current && leftPanelRef.current) {
          leftPanelRef.current.resize(70);
          rightPanelRef.current.resize(30);
        }
        return;
      }

      // Only manage Tab-based map navigation outside of editable elements
      if (key === "tab" && !hasModifier) {
        event.preventDefault();
        navigateToAdjacentNode(event.shiftKey ? -1 : 1);
        return;
      }

      // Example global shortcut: toggle navigation guide with Cmd/Ctrl+K
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setIsNavigationExpanded((v) => !v);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlowInstance, selectedNode, closeNodePanel]);

  // Function to navigate to adjacent unlocked nodes
  const navigateToAdjacentNode = (direction: 1 | -1) => {
    // Only navigate through learning nodes, not text nodes
    const learningNodes = map.map_nodes.filter(
      (node) => (node as any)?.node_type !== "text",
    );
    const unlockedNodes = learningNodes.filter((node) =>
      isNodeUnlocked(node.id),
    );
    if (unlockedNodes.length === 0) return;

    const currentIndex = selectedNode
      ? unlockedNodes.findIndex((node) => node.id === selectedNode.id)
      : -1;

    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = direction === 1 ? 0 : unlockedNodes.length - 1;
    } else {
      nextIndex =
        (currentIndex + direction + unlockedNodes.length) %
        unlockedNodes.length;
    }

    const nextNode = unlockedNodes[nextIndex];
    if (nextNode && reactFlowInstance) {
      // Select the node
      reactFlowInstance.setCenter(
        (nextNode.metadata as any)?.position?.x || 0,
        (nextNode.metadata as any)?.position?.y || 0,
        { zoom: 1.2, duration: 600 },
      );

      // Update selection
      setSelectedNode({
        id: nextNode.id,
        data: nextNode,
        position: (nextNode.metadata as any)?.position || { x: 0, y: 0 },
      });
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      // Anonymous users never load progress, so trail mode can center immediately
      if (!user) setProgressReady(true);
    };
    getUser();
  }, []);

  // Check if user has already completed this seed
  useEffect(() => {
    const checkCompletion = async () => {
      if (seedRoomId && currentUser) {
        const { completed, completion } = await checkSeedRoomCompletion(
          seedRoomId,
          currentUser.id,
        );
        if (completed && completion) {
          setHasCompletedSeed(true);
          setShowCompletionBanner(true);
          setCompletionData({
            completionId: completion.id,
            completionDate: completion.completed_at,
            nodeId: completion.completed_node_id || "",
          });
        }
      }
    };
    checkCompletion();
  }, [seedRoomId, currentUser]);

  // Watch for end node completion when progressMap updates
  useEffect(() => {
    const checkEndNodeCompletion = async () => {
      // Only check for seed completion if this is a seed room
      if (seedRoomId && currentUser && selectedNode && !hasCompletedSeed) {
        const nodeData = selectedNode.data;

        // Check if the current node is an end node
        if (isEndNode(nodeData.node_type)) {
          // Check if the node has been passed (for nodes with assessments) or just visited
          const nodeProgress = progressMap[selectedNode.id];

          // Check for multiple possible completion statuses
          const isNodeCompleted =
            nodeProgress?.status === "passed" ||
            nodeProgress?.status === "submitted" ||
            nodeProgress?.status === "failed"; // Include failed to show completion modal even if they didn't pass

          if (isNodeCompleted) {
            // Mark the seed as completed
            const { data, error } = await markSeedRoomCompleted(
              seedRoomId,
              currentUser.id,
              selectedNode.id,
            );

            if (error) {
              console.error(
                "❌ [MapViewer] Error marking seed complete:",
                error,
              );
            } else if (data) {
              setHasCompletedSeed(true);
              setCompletionData({
                completionId: data.id,
                completionDate: data.completed_at,
                nodeId: data.completed_node_id || "",
              });
              setShowCompletionModal(true);
            }
          }
        }
      }
    };

    checkEndNodeCompletion();
  }, [progressMap, seedRoomId, currentUser, selectedNode, hasCompletedSeed]);

  const loadAllProgress = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log("🗺️ [MapViewer] Loading progress for map:", map.id);

      let progressData;

      // For instructors viewing team maps, load team progress instead of individual progress
      if (isTeamMap && isInstructorOrTA && teamId) {
        console.log("👥 [MapViewer] Loading TEAM progress for instructor");
        progressData = await getTeamProgressForInstructor(map.id, teamId);

        console.log(
          "✅ [MapViewer] Loaded team progress for",
          Object.keys(progressData).length,
          "nodes",
        );
      } else {
        // Use the standard individual progress loading
        progressData = await loadMapProgress(map.id);

        console.log(
          "✅ [MapViewer] Loaded individual progress for",
          Object.keys(progressData).length,
          "nodes",
        );
      }

      setProgressMap(progressData);
    } catch (error) {
      console.error("❌ [MapViewer] Error loading progress:", error);
      setProgressMap({}); // Fallback to empty progress
    } finally {
      setProgressReady(true);
    }
  }, [currentUser, map.id, isTeamMap, isInstructorOrTA, teamId]);

  const loadAllSubmissions = useCallback(async () => {
    if (!isInstructorOrTA) return;

    setIsLoadingSubmissions(true);
    try {
      const submissions = await getSubmissionsForMap(map.id);
      setAllSubmissions(submissions);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [isInstructorOrTA, map.id]);

  useEffect(() => {
    if (currentUser) {
      loadAllProgress();
      if (isInstructorOrTA) {
        loadAllSubmissions();

        // Set up periodic refresh for real-time updates (every 30 seconds)
        const interval = setInterval(() => {
          loadAllSubmissions();
        }, 30000);

        return () => clearInterval(interval);
      }
    }
  }, [currentUser, map, isInstructorOrTA]);

  // Check if map is a team map and get classroom role
  useEffect(() => {
    const checkTeamMapAndRole = async () => {
      if (!currentUser) return;

      try {
        // Check if this map is a team map
        const teamMapInfo = await getTeamMapClassroomInfo(map.id);
        setIsTeamMap(teamMapInfo.isTeamMap);
        setTeamId(teamMapInfo.teamId || null);

        if (teamMapInfo.isTeamMap && teamMapInfo.classroomId) {
          // Get user's role in the classroom
          const role = await getUserClassroomRoleClient(
            teamMapInfo.classroomId,
          );
          if (role) {
            setClassroomRole(role);
            console.log(
              "👥 [MapViewer] User role in classroom:",
              role,
              "for classroom:",
              teamMapInfo.classroomId,
            );
          }
        }
      } catch (error) {
        console.error(
          "❌ [MapViewer] Error checking team map or classroom role:",
          error,
        );
      }
    };

    checkTeamMapAndRole();
  }, [currentUser, map.id]);

  // OPTIMIZATION: Pre-calculate O(1) lookup maps to prevent O(N^2) render bottlenecks
  const nodesById = useMemo(() => {
    const nodeMap = new Map<string, MapNode>();
    map.map_nodes.forEach((node) => {
      nodeMap.set(node.id, node);
    });
    return nodeMap;
  }, [map.map_nodes]);

  const prerequisitesByNodeId = useMemo(() => {
    const prereqMap = new Map<string, MapNode[]>();

    // Initialize empty arrays for all nodes
    map.map_nodes.forEach((node) => {
      prereqMap.set(node.id, []);
    });

    // Populate prerequisites based on paths
    map.map_nodes.forEach((node) => {
      if (node.node_paths_source && node.node_paths_source.length > 0) {
        node.node_paths_source.forEach((path) => {
          if (path.destination_node_id) {
            const prereqs = prereqMap.get(path.destination_node_id) || [];
            prereqs.push(node);
            prereqMap.set(path.destination_node_id, prereqs);
          }
        });
      }
    });

    return prereqMap;
  }, [map.map_nodes]);

  // Check if node is unlocked based on prerequisites
  const isNodeUnlocked = useCallback((nodeId: string): boolean => {
    // Find the node data using O(1) lookup
    const nodeData = nodesById.get(nodeId);

    // Text nodes are always "unlocked" (visible) since they're just annotations
    if ((nodeData as any)?.node_type === "text") {
      return true;
    }

    // Instructors/TAs can see all nodes (both team and personal maps)
    if (isInstructorOrTA) {
      return true;
    }

    // Find all nodes that have paths leading to this node using O(1) lookup
    const prerequisites = prerequisitesByNodeId.get(nodeId) || [];

    // If no prerequisites, node is unlocked (starting node)
    if (prerequisites.length === 0) return true;

    // Check if ALL prerequisites are passed OR submitted (pending grade)
    return prerequisites.every((prereq) => {
      const progress = progressMap[prereq.id];
      return progress?.status === "passed" || progress?.status === "submitted";
    });
  }, [nodesById, prerequisitesByNodeId, isInstructorOrTA, progressMap]);

  // Get submission requirement for a node (single or all team members)
  const getSubmissionRequirement = useCallback((nodeId: string): "single" | "all" => {
    const nodeData = nodesById.get(nodeId);
    return nodeData?.metadata?.submission_requirement || "single";
  }, [nodesById]);

  // Check if node is completed based on submission requirements
  const isNodeCompleted = useCallback((nodeId: string, progress: any): boolean => {
    const requirement = getSubmissionRequirement(nodeId);

    if (requirement === "single") {
      // Single requirement: any team member completion counts
      return progress?.status === "passed" || progress?.status === "submitted";
    } else {
      // All requirement: check if all team members have submitted
      if (progress?.member_progress) {
        return progress.member_progress.every(
          (member: any) =>
            member.status === "passed" || member.status === "submitted",
        );
      }
      return progress?.status === "passed" || progress?.status === "submitted";
    }
  }, [getSubmissionRequirement]);

  // Calculate progress statistics by requirement type
  const getProgressStats = useCallback(() => {
    const stats = {
      singleRequirement: { completed: 0, total: 0 },
      allRequirement: { completed: 0, total: 0 },
      totalCompleted: 0,
      totalNodes: map.map_nodes.filter((n) => (n as any)?.node_type !== "text")
        .length,
    };

    map.map_nodes.forEach((node) => {
      // Skip text nodes
      if ((node as any)?.node_type === "text") return;

      const requirement = getSubmissionRequirement(node.id);
      const progress = progressMap[node.id];
      const completed = isNodeCompleted(node.id, progress);

      if (requirement === "single") {
        stats.singleRequirement.total++;
        if (completed) stats.singleRequirement.completed++;
      } else {
        stats.allRequirement.total++;
        if (completed) stats.allRequirement.completed++;
      }

      if (completed) stats.totalCompleted++;
    });

    return stats;
  }, [map.map_nodes, getSubmissionRequirement, progressMap, isNodeCompleted]);

  // Custom node component with sprite-based gamified design and floating animations
  const nodeTypes = useMemo(
    () => ({
      default: ({
        data,
        selected,
      }: {
        data: MapNode & { progress?: StudentProgress | any };
        selected?: boolean;
      }) => {
        const progress = data.progress;
        const isUnlocked = isNodeUnlocked(data.id);
        const spriteUrl = data.sprite_url || "/islands/crystal.png";

        // Determine node state and styling
        let statusIcon = null;
        let glowEffect = "";
        let brightness = "brightness(1)";
        let animationClass = "";

        // Base floating animation for all unlocked nodes
        if (isUnlocked) {
          animationClass = "animate-float";
        }

        if (!isUnlocked) {
          brightness = "brightness(0.3) grayscale(1)";
          statusIcon = null;
        } else if (progress) {
          // Handle both individual progress (StudentProgress) and team progress (any) structures
          const status = progress.status || (progress as any)?.status;
          const isCompleted = isNodeCompleted(data.id, progress);

          if (isCompleted) {
            // Node is completed based on submission requirements
            glowEffect = "drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]";
            statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
            animationClass = "animate-float-success";
          } else if (status === "failed") {
            // Submitted but failed (needs retry)
            glowEffect = "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]";
            statusIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
            animationClass = "animate-shake";
          } else if (status === "submitted") {
            // Submitted awaiting grade (if not marked as complete by isNodeCompleted)
            glowEffect = "drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]";
            statusIcon = <Clock className="h-4 w-4 text-blue-500" />;
            animationClass = "animate-float";
          } else if (status === "in_progress") {
            glowEffect = "drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]";
            statusIcon = <Play className="h-4 w-4 text-amber-500" />;
            animationClass = "animate-float";
          }
        }

        // If just unlocked but not started
        if (isUnlocked && (!progress || !progress.status)) {
          animationClass = "animate-float";
        }

        // Instructor/TA grading indicator
        let gradingIndicator = null;
        if (isInstructorOrTA) {
          const needsGrading =
            progress?.status === "submitted" &&
            !(progress as any)?.grade &&
            !(progress as any)?.is_graded;

          if (needsGrading) {
            gradingIndicator = (
              <div className="absolute -top-3 -right-3 z-30 animate-bounce">
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-red-400">
                  GRADE
                </div>
              </div>
            );
          }
        }

        // Team Progress Info (for instructors viewing team maps)
        let memberProgressInfo = null;
        if (
          isInstructorOrTA &&
          isTeamMap &&
          (progress as any)?.member_progress
        ) {
          const memberProgress = (progress as any).member_progress as any[];
          const totalMembers = memberProgress.length;
          const completedMembers = memberProgress.filter(
            (m) => m.status === "passed" || m.status === "submitted",
          ).length;

          const allCompleted = completedMembers === totalMembers;
          const anyCompleted = completedMembers > 0;

          // Show a small pill indicating how many completed
          const bgColor = allCompleted
            ? "bg-green-500"
            : anyCompleted
              ? "bg-amber-500"
              : "bg-slate-500";

          memberProgressInfo = (
            <div className="absolute -top-8 right-0 z-30 transform scale-90 origin-bottom-right">
              <div
                className={`${bgColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md border border-white/20 flex items-center gap-1`}
              >
                <span className="text-[9px]">👥</span>
                {completedMembers}/{totalMembers}
              </div>
            </div>
          );
        }

        // Submission requirement badge (Little icon near the node to show distinct requirements)
        let requirementBadge = null;
        if (isTeamMap) {
          const requirement = getSubmissionRequirement(data.id);
          if (requirement === "all") {
            requirementBadge = (
              <div
                className="absolute top-0 -left-2 z-20"
                title="All members must submit"
              >
                <div className="bg-purple-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow border border-purple-400 font-bold">
                  A
                </div>
              </div>
            );
          }
        }

        return (
          <div className={`relative group ${animationClass}`}>
            <Handle
              type="target"
              position={Position.Left}
              className="!w-3 !h-3 !bg-slate-400/50 !border-2 !border-slate-600 !-left-2 transition-colors hover:!bg-slate-300"
              style={{ opacity: 0 }} // Hide handles visually but keep functional
            />
            <Handle
              type="source"
              position={Position.Right}
              className="!w-3 !h-3 !bg-slate-400/50 !border-2 !border-slate-600 !-right-2 transition-colors hover:!bg-slate-300"
              style={{ opacity: 0 }}
            />

            {/* Core Node Visuals */}
            <div className="relative min-w-[64px] min-h-[64px] w-fit h-fit flex items-center justify-center">
              {/* Trail mode: soft static ring marking the student's current node */}
              {(data as any).isCurrent && (
                <div className="absolute -inset-4 rounded-full trail-current-ring pointer-events-none z-10" />
              )}

              {/* Trail mode (prototype): mock multiplayer presence — avatar
                  circles fanned out along the node's right-side arc; the
                  current user is bigger and sits highest. */}
              {Array.isArray((data as any).trailAvatars) &&
                (data as any).trailAvatars.length > 0 &&
                (() => {
                  const avatars = [...(data as any).trailAvatars].sort(
                    (a: any, b: any) => Number(a.isSelf) - Number(b.isSelf),
                  );
                  const radius = 85; // px from node center, hugging the island
                  return avatars.map((a: any) => {
                    const nonSelfIdx = avatars
                      .filter((x: any) => !x.isSelf)
                      .indexOf(a);
                    // Self tops the arc; friends spread down the right side
                    const angle = a.isSelf ? -50 : -5 + nonSelfIdx * 45;
                    return (
                      <div
                        key={a.id}
                        className="absolute left-1/2 top-1/2 z-30 pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`,
                        }}
                      >
                        <div
                          className={`rounded-full flex items-center justify-center font-bold text-white border-2 border-background ${
                            a.isSelf
                              ? "w-9 h-9 text-sm ring-2 ring-blue-400 shadow-lg"
                              : "w-6 h-6 text-[10px]"
                          }`}
                          style={{ backgroundColor: a.color }}
                        >
                          {a.label}
                        </div>
                      </div>
                    );
                  });
                })()}
              {/* Background Atmosphere/Glow */}
              {isUnlocked && (
                <div className="absolute inset-0 -z-10">
                  {/* Main shadow image */}
                  <img
                    src={spriteUrl}
                    alt=""
                    className="w-auto h-auto object-contain absolute opacity-60"
                    style={{
                      filter: "brightness(0) blur(4px)",
                      transform: "scale(1.3)",
                    }}
                  />
                  {/* Secondary softer shadow for depth */}
                  <img
                    src={spriteUrl}
                    alt=""
                    className="w-max h-max object-contain absolute opacity-30"
                    style={{
                      filter: "brightness(0) blur(8px)",
                      transform: "translateY(16px) scale(1.2)",
                    }}
                  />
                  {/* Ground shadow for flying island effect */}
                  <div
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-black/20 rounded-full blur-md"
                    style={{
                      animation: selected
                        ? "shadow-pulse 2s ease-in-out infinite"
                        : "none",
                    }}
                  />
                </div>
              )}

              {/* Progress Glow Effect */}
              {glowEffect && (
                <div
                  className={`absolute inset-0 ${glowEffect} rounded-full animate-pulse-slow`}
                />
              )}

              {/* Grading Indicator for Instructors/TAs */}
              {gradingIndicator}
              {memberProgressInfo}

              {/* Submission Requirement Badge */}
              {requirementBadge}

              {/* Sprite Image */}
              <img
                src={spriteUrl}
                alt={data.title}
                className={`w-auto h-auto object-contain z-20 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 ${glowEffect}`}
                style={{
                  filter: selected
                    ? `${brightness} brightness(1.15) saturate(1.3)`
                    : brightness,
                }}
              />

              {/* Floating Label with Enhanced Animation */}
              <div
                className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 ${selected ? "scale-105 -translate-y-1" : ""} transition-all duration-300 group/label z-30`}
              >
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px] max-w-[240px]">
                  <div className="text-xs font-bold text-card-foreground text-center break-words line-clamp-2 leading-snug">
                    {data.title}
                  </div>
                  <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 mt-0.5">
                    ⭐ {data.difficulty}
                    {statusIcon && <span className="ml-1">{statusIcon}</span>}
                  </div>
                </div>
                {/* Full title tooltip on hover - only if truncated */}
                {data.title && data.title.length > 20 && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/label:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                    <div className="bg-gray-900/95 dark:bg-gray-800/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-normal max-w-xs backdrop-blur-sm break-words">
                      {data.title}
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                    </div>
                  </div>
                )}
              </div>

              {/* Lock Overlay for locked nodes */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm animate-pulse">
                    <Lock className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                </div>
              )}

              {/* Hover Effect for Unlocked Nodes */}
              {isUnlocked && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-400/10 to-transparent rounded-full blur-sm" />
                </div>
              )}

              {/* Screen Reader Description */}
              <span className="sr-only">
                {data.title} node, difficulty {data.difficulty}, status:{" "}
                {progress?.status || "locked"}
              </span>
            </div>
          </div>
        );
      },
      text: ({
        data,
        selected,
      }: {
        data: MapNode & { node_type?: string };
        selected?: boolean;
      }) => {
        // Text nodes are read-only in the viewer, so no onDataChange
        return (
          <TextNode
            data={data}
            selected={selected}
            // Disable editing and double-click in viewer mode
            allowEdit={false}
            allowDoubleClick={false}
            showHint={false}
          />
        );
      },
      comment: ({
        data,
        selected,
      }: {
        data: MapNode & { node_type?: string };
        selected?: boolean;
      }) => {
        // Comment nodes can be edited by instructors/TAs
        return (
          <CommentNode
            data={data}
            selected={selected}
            userRole={userRole}
            // Allow editing for instructors/TAs, read-only for students
            allowEdit={isInstructorOrTA}
            allowDoubleClick={isInstructorOrTA}
            showHint={true}
            showEditButton={true}
            onDataChange={(updatedData) => {
              // Handle comment node updates
              if (isInstructorOrTA && updatedData) {
                // TODO: Persist comment changes to database
                console.log("Comment node updated:", updatedData);
              }
            }}
          />
        );
      },
    }),
    [progressMap, isInstructorOrTA, isTeamMap, isNodeUnlocked, isNodeCompleted, getSubmissionRequirement],
  );

  // Trail mode: the student's "current" node — first unlocked node that is
  // not passed/submitted, walking the trail bottom-to-top. Drives the pulsing
  // highlight ring so students can see where they are at a glance.
  const currentTrailNodeId = useMemo(() => {
    if (!trailMode || !trailLayout) return null;
    return (
      trailLayout.orderedIds.find((id) => {
        const status = progressMap[id]?.status;
        return (
          isNodeUnlocked(id) && status !== "passed" && status !== "submitted"
        );
      }) ?? null
    );
  }, [trailMode, trailLayout, progressMap, isNodeUnlocked]);

  useEffect(() => {
    // Trail mode (prototype): mock multiplayer presence — UI ONLY, no real
    // data. The current user stands (bigger) on their current node; a few
    // fake learners are scattered at fixed offsets along the trail.
    const trailPresence = new Map<
      string,
      { id: string; label: string; color: string; isSelf: boolean }[]
    >();
    if (trailMode && trailLayout && trailLayout.orderedIds.length > 0) {
      const currentIdx = currentTrailNodeId
        ? trailLayout.orderedIds.indexOf(currentTrailNodeId)
        : 0;
      const mockLearners = [
        { id: "mock-1", label: "M", color: "#f59e0b", offset: 0 },
        { id: "mock-2", label: "K", color: "#8b5cf6", offset: 1 },
        { id: "mock-3", label: "A", color: "#ec4899", offset: 3 },
      ];
      for (const m of mockLearners) {
        const idx = currentIdx + m.offset;
        if (idx < 0 || idx >= trailLayout.orderedIds.length) continue;
        const nodeId = trailLayout.orderedIds[idx];
        trailPresence.set(nodeId, [
          ...(trailPresence.get(nodeId) ?? []),
          { id: m.id, label: m.label, color: m.color, isSelf: false },
        ]);
      }
      if (currentTrailNodeId) {
        const selfName =
          currentUser?.user_metadata?.username ||
          currentUser?.user_metadata?.full_name ||
          currentUser?.email ||
          "You";
        trailPresence.set(currentTrailNodeId, [
          ...(trailPresence.get(currentTrailNodeId) ?? []),
          {
            id: "self",
            label: (selfName[0] || "Y").toUpperCase(),
            color: "#3b82f6",
            isSelf: true,
          },
        ]);
      }
    }

    const transformedNodes = map.map_nodes.map((node) => {
      // Determine node type - check for node_type property
      let nodeType = "default"; // learning node
      if ((node as any)?.node_type === "text") {
        nodeType = "text";
      } else if ((node as any)?.node_type === "comment") {
        nodeType = "comment";
      }

      return {
        id: node.id,
        type: nodeType,
        data: {
          ...node,
          progress: progressMap[node.id],
          isCurrent: trailMode && node.id === currentTrailNodeId,
          trailAvatars: trailMode ? trailPresence.get(node.id) : undefined,
        },
        position: (trailMode && trailLayout?.positions.get(node.id)) ||
          (node.metadata as any)?.position || {
            x: Math.random() * 400,
            y: Math.random() * 400,
          },
        draggable: false, // Disable dragging in viewer mode
        connectable: false,
        selectable: true,
        selected: selectedNode?.id === node.id,
        style: {
          backgroundColor: "#ffffff00",
          border: "2px solid #cccccc00",
          flexGrow: 1,
          aspectRatio: "1 / 1",
        },
      };
    });

    const transformedEdges: Edge[] = [];
    map.map_nodes.forEach((node) => {
      node.node_paths_source.forEach((path) => {
        // Add visual indicators for path states. Trail mode: only PASSED
        // sources get the active (green) path; in-progress/submitted stay
        // dim so completed progress reads at a glance.
        const sourceProgress = progressMap[path.source_node_id];
        const isPassed = sourceProgress?.status === "passed";
        const isPathActive = trailMode
          ? isPassed
          : isPassed ||
            sourceProgress?.status === "in_progress" ||
            sourceProgress?.status === "submitted";

        transformedEdges.push({
          id: path.id,
          type: "floating",
          source: path.source_node_id,
          target: path.destination_node_id,
          animated: isPathActive,
          // FloatingEdge draws its own rope-bridge colors; tell it when the
          // source node is passed so the bridge turns green (trail mode).
          data: { passed: trailMode && isPassed },
          style: {
            stroke: isPathActive
              ? trailMode
                ? "#D2691E" // passed = orange/wood in trail mode
                : "#10b981"
              : trailMode
                ? "#10b981" // upcoming = green in trail mode
                : "#6b7280",
            strokeWidth: isPathActive ? 3 : 2,
            opacity: isPathActive ? 1 : 0.6,
          },
        });
      });
    });

    setNodes(transformedNodes as any);
    setEdges(transformedEdges);
  }, [map, progressMap, setNodes, setEdges, trailMode, trailLayout, currentTrailNodeId, currentUser]);

  // Trail mode: pan the camera to a node, but clamp the destination to the
  // legal pan area (trailTranslateExtent) BEFORE animating. Raw setCenter can
  // aim past the border for nodes near the trail's top/bottom — d3 then snaps
  // the viewport back at the end of the animation, which reads as a glitch.
  const panToTrailNode = useCallback(
    (
      nodeId: string,
      position: { x: number; y: number },
      duration: number,
    ) => {
      const k = TRAIL_ZOOM;
      const el = document.querySelector(".react-flow");
      const vw = el?.clientWidth ?? window.innerWidth;
      const vh = el?.clientHeight ?? window.innerHeight;

      const internal = reactFlowInstance.getNode(nodeId);
      const w = internal?.measured?.width ?? TRAIL_NODE_W;
      const h = internal?.measured?.height ?? TRAIL_NODE_H;

      // Raw target: node centered in the viewport.
      let tx = vw / 2 - (position.x + w / 2) * k;
      let ty = vh / 2 - (position.y + h / 2) * k;

      if (trailTranslateExtent) {
        // Mirror d3-zoom's constrain(): allowed translate range per axis;
        // when the extent is narrower than the viewport, d3 centers it.
        const clampAxis = (t: number, e0: number, e1: number, v: number) => {
          const min = v - e1 * k;
          const max = -e0 * k;
          if (min > max) return (min + max) / 2;
          return Math.min(max, Math.max(min, t));
        };
        tx = clampAxis(tx, trailTranslateExtent[0][0], trailTranslateExtent[1][0], vw);
        ty = clampAxis(ty, trailTranslateExtent[0][1], trailTranslateExtent[1][1], vh);
      }

      reactFlowInstance.setViewport({ x: tx, y: ty, zoom: k }, { duration });
    },
    [reactFlowInstance, trailTranslateExtent],
  );

  // Trail mode: skip fitView and, once progress has settled, center the
  // viewport on the student's "current" node — the first unlocked node that
  // is not passed/submitted (walking the trail bottom-to-top). If everything
  // unlocked is done, use the deepest unlocked node; fall back to the
  // bottom-most trail node. Runs exactly once so it never fights the user.
  useEffect(() => {
    if (!trailMode || !progressReady || trailCenteredRef.current) return;
    if (!trailLayout || trailLayout.orderedIds.length === 0) return;

    const isNotDone = (id: string) => {
      const status = progressMap[id]?.status;
      return status !== "passed" && status !== "submitted";
    };

    const targetId =
      trailLayout.orderedIds.find((id) => isNodeUnlocked(id) && isNotDone(id)) ??
      [...trailLayout.orderedIds].reverse().find((id) => isNodeUnlocked(id)) ??
      trailLayout.orderedIds[0];

    const position = trailLayout.positions.get(targetId);
    if (!position) return;

    trailCenteredRef.current = true;
    panToTrailNode(targetId, position, 0);
  }, [
    trailMode,
    progressReady,
    trailLayout,
    progressMap,
    isNodeUnlocked,
    panToTrailNode,
  ]);

  // Trail mode: after a node is completed/submitted, advance Duolingo-style
  // toward the next node in trail order (orderedIds already excludes
  // text/comment nodes) — dismiss the panel first, then pan the camera to the
  // next node WITHOUT opening it; the user taps it manually.
  const handleTrailNodeCompleted = useCallback(() => {
    if (!trailMode || !trailLayout) return;
    const currentId = selectedNode?.id;
    if (!currentId) return;

    const currentIndex = trailLayout.orderedIds.indexOf(currentId);
    const nextId =
      currentIndex >= 0 ? trailLayout.orderedIds[currentIndex + 1] : undefined;
    if (!nextId) {
      // Last node completed — just close the panel.
      closeNodePanel();
      return;
    }

    // Only advance when the next node is actually unlocked. progressMap may
    // not have refreshed yet, so treat the just-completed node as passed.
    const prerequisites = prerequisitesByNodeId.get(nextId) || [];
    const nextUnlocked =
      isInstructorOrTA ||
      prerequisites.length === 0 ||
      prerequisites.every((prereq) => {
        if (prereq.id === currentId) return true;
        const status = progressMap[prereq.id]?.status;
        return status === "passed" || status === "submitted";
      });
    if (!nextUnlocked) return;

    const position = trailLayout.positions.get(nextId);
    if (!position) return;

    // 1. Slide the node panel/sheet away first…
    closeNodePanel();

    // 2. …then pan the camera to the next node (after the sheet animation),
    // clamped to the legal pan area so it never snaps back.
    window.setTimeout(() => {
      panToTrailNode(nextId, position, 600);
    }, 300);
  }, [
    trailMode,
    trailLayout,
    selectedNode,
    prerequisitesByNodeId,
    isInstructorOrTA,
    closeNodePanel,
    progressMap,
    panToTrailNode,
  ]);

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const selected = params.nodes[0];
      const newSelectedNode = selected || null;

      setSelectedNode(newSelectedNode);

      // Don't resize panels if currently minimized - let user control that
      if (isPanelMinimized) return;

      // Animate panel resize based on selection
      if (newSelectedNode && rightPanelRef.current && leftPanelRef.current) {
        // Only resize if panel is not minimized
        if (!isPanelMinimized) {
          // Node selected: expand right panel to 45%, shrink left to 55%
          rightPanelRef.current.resize(45);
          leftPanelRef.current.resize(55);
        }

        // Center the selected node accounting for the expanded panel
        setTimeout(() => {
          if (reactFlowInstance && newSelectedNode) {
            // Get the current viewport
            const viewport = reactFlowInstance.getViewport();

            // Calculate the center position accounting for the 55/45 panel split
            // We want to center in the left panel (55% of total width) but shift slightly left for visual balance
            const containerRect = document
              .querySelector(".react-flow")
              ?.getBoundingClientRect();
            if (containerRect) {
              const leftPanelWidth = containerRect.width * 0.55; // 55% for left panel after resize
              const targetX = leftPanelWidth * 0.5; // Center in the left panel
              const targetY = containerRect.height * 0.5; // Center vertically

              // Use fitView to center on the selected node with padding
              reactFlowInstance.fitView({
                nodes: [{ id: newSelectedNode.id }],
                duration: 600,
                padding: 0.15,
                // Custom center point accounting for panel layout
                minZoom: viewport.zoom * 0.9, // Slightly zoom out for better view
                maxZoom: viewport.zoom * 1.1, // Allow slight zoom in
              });
            }
          }
        }, 350); // Wait for panel animation to complete
      } else if (
        !newSelectedNode &&
        rightPanelRef.current &&
        leftPanelRef.current
      ) {
        // Node deselected: restore default sizes (70% left, 30% right)
        leftPanelRef.current.resize(70);
        rightPanelRef.current.resize(30);
      }
    },
    [reactFlowInstance, isPanelMinimized],
  );

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Trail mode on narrow screens swaps the 70/30 resizable split for a
  // full-width map plus a bottom sheet for the node panel.
  const useMobileBottomSheet = trailMode && isMobile;

  const mapCanvas = (
    <div className={trailMode ? "flex-1 trail-mode" : "flex-1"}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={!trailMode}
        translateExtent={trailMode ? trailTranslateExtent : undefined}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll
        panOnDrag={[0, 1, 2]}
        attributionPosition="bottom-left"
        aria-label="Interactive learning map"
      >
        <Background gap={20} size={1} color="#94a3b8" />
        {(!trailMode || !isMobile) && (
          <MiniMap
            {...miniMapConfig}
            style={{
              ...miniMapConfig.style,
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
        )}
      </ReactFlow>
    </div>
  );

  // Mobile bottom sheet (trail mode only): hidden until a node is tapped,
  // closes via backdrop tap or the X button.
  const bottomSheet = selectedNode ? (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={closeNodePanel}
        aria-hidden="true"
      />
      <div className="absolute inset-0 overflow-y-auto bg-background shadow-2xl animate-in slide-in-from-bottom duration-300">
        <button
          onClick={closeNodePanel}
          className="absolute top-2 right-2 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-2 shadow-lg hover:bg-muted/50 transition-colors"
          aria-label="Close node panel"
        >
          <X className="h-4 w-4" />
        </button>
        <NodeViewPanel
          key={selectedNode.id}
          selectedNode={selectedNode}
          mapId={map.id}
          onProgressUpdate={loadAllProgress}
          onNodeCompleted={trailMode ? handleTrailNodeCompleted : undefined}
          isNodeUnlocked={isNodeUnlocked(selectedNode.id)}
          userRole={userRole}
          isInstructorOrTA={isInstructorOrTA && !forceStudentView}
        />
      </div>
    </div>
  ) : null;

  const completionModal = showCompletionModal &&
    seedTitle &&
    seedRoomId &&
    completionData &&
    currentUser && (
      <SeedCompletionModal
        open={showCompletionModal}
        onOpenChange={(open) => {
          setShowCompletionModal(open);
          // Show banner when modal is closed
          if (!open && hasCompletedSeed) {
            setShowCompletionBanner(true);
          }
        }}
        seedTitle={seedTitle}
        seedId={seedId || ""}
        roomId={seedRoomId}
        completionId={completionData.completionId}
        userId={currentUser.id}
        userName={
          currentUser.user_metadata?.full_name ||
          currentUser.email ||
          "Student"
        }
        completionDate={completionData.completionDate}
      />
    );

  return (
    <div className="h-full flex flex-col">
      {/* Completion Banner */}
      {showCompletionBanner && hasCompletedSeed && seedTitle && (
        <div
          onClick={() => setShowCompletionModal(true)}
          className="mt-[64px] bg-gradient-to-r from-yellow-500/20 via-yellow-400/20 to-yellow-500/20 border-b-2 border-yellow-500/50 px-6 py-3 cursor-pointer hover:from-yellow-500/30 hover:via-yellow-400/30 hover:to-yellow-500/30 transition-colors z-50 flex-none"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-100 font-medium">
                🎉 Congratulations! You completed{" "}
                <span className="font-bold">{seedTitle}</span>
              </span>
            </div>
            <button className="text-yellow-300 hover:text-yellow-100 text-sm font-medium">
              View Certificate →
            </button>
          </div>
        </div>
      )}

      {useMobileBottomSheet ? (
        <div className="flex-1 relative flex flex-col min-h-0">
          {/* Instructor View Indicator */}
          {isInstructorOrTA && (
            <div className="absolute bottom-0 left-0 z-10 bg-gray-800 text-muted-foreground px-4 py-2 rounded-tr-lg shadow-lg flex items-center gap-2 ">
              <Info className="h-4 w-4" />
              <span className="text-xs font-medium">
                Instructor View - All Nodes Unlocked
              </span>
            </div>
          )}

          {/* Seed Leaderboard - Only show in seed rooms */}
          {seedRoomId && authUser?.id && (
            <SeedLeaderboard roomId={seedRoomId} userId={authUser.id} />
          )}

          {mapCanvas}

          {/* Room Settings Component - Rendered LAST to ensure z-index stacking above map */}
          {roomSettingsComponent}

          {bottomSheet}
          {completionModal}
        </div>
      ) : (
      <ResizablePanelGroup
        id="map-viewer-panels"
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel
          id="map-viewer-left-panel"
          ref={leftPanelRef}
          defaultSize={70}
          minSize={35}
          maxSize={85}
          className="transition-all duration-300 ease-in-out relative flex flex-col"
        >
          {/* Instructor View Indicator */}
          {isInstructorOrTA && (
            <div className="absolute bottom-0 left-0 z-10 bg-gray-800 text-muted-foreground px-4 py-2 rounded-tr-lg shadow-lg flex items-center gap-2 ">
              <Info className="h-4 w-4" />
              <span className="text-xs font-medium">
                Instructor View - All Nodes Unlocked
              </span>
            </div>
          )}

          {/* Seed Leaderboard - Only show in seed rooms */}
          {seedRoomId && authUser?.id && (
            <SeedLeaderboard roomId={seedRoomId} userId={authUser.id} />
          )}

          {/* Map Container - Takes up full space */}
          {mapCanvas}

          {/* Navigation Guide & Progress Stats - Bottom */}
          {isNavigationExpanded && (
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Navigation Guide & Progress
                </h3>
                <button
                  onClick={() => setIsNavigationExpanded(false)}
                  className="p-1 hover:bg-muted/50 rounded transition-colors"
                  aria-label="Hide navigation guide"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Statistics */}
              <div className="mb-4 bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {isTeamMap && isInstructorOrTA
                    ? "Team Progress Overview"
                    : "Progress Overview"}
                </div>

                {isTeamMap && (
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="text-blue-500">👤</span>
                        Single requirement
                      </span>
                      <span className="font-medium">
                        {getProgressStats().singleRequirement.completed}/
                        {getProgressStats().singleRequirement.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="text-purple-500">👥</span>
                        All requirement
                      </span>
                      <span className="font-medium">
                        {getProgressStats().allRequirement.completed}/
                        {getProgressStats().allRequirement.total}
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${(getProgressStats().totalCompleted / getProgressStats().totalNodes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{getProgressStats().totalCompleted} Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>
                      {
                        Object.values(progressMap).filter(
                          (p) =>
                            p.status === "submitted" ||
                            (p as any)?.status === "submitted",
                        ).length
                      }{" "}
                      Submitted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>
                      {
                        Object.values(progressMap).filter(
                          (p) =>
                            p.status === "in_progress" ||
                            (p as any)?.status === "in_progress",
                        ).length
                      }{" "}
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-muted-foreground">
                      {getProgressStats().totalNodes} Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Instructions */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Select Node</span>
                    <span className="text-muted-foreground">Click</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Node</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Tab
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Node</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Shift+Tab
                    </kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pan Map</span>
                    <span className="text-muted-foreground">Drag</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zoom</span>
                    <span className="text-muted-foreground">Mouse Wheel</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deselect</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Navigation Guide Button - Fixed Bottom Right */}
          <button
            onClick={() => setIsNavigationExpanded(!isNavigationExpanded)}
            className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-2 shadow-lg hover:bg-muted/50 transition-colors"
            aria-expanded={isNavigationExpanded}
            title={
              isNavigationExpanded
                ? "Hide navigation guide"
                : "Show navigation guide"
            }
          >
            {isNavigationExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </button>

          {/* Room Settings Component - Rendered LAST in panel to ensure z-index stacking above map */}
          {roomSettingsComponent}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          id="map-viewer-right-panel"
          ref={rightPanelRef}
          defaultSize={30}
          minSize={5}
          maxSize={65}
          className="transition-all duration-300 ease-in-out relative"
        >
          {/* Panel Minimize/Maximize Button */}
          <button
            onClick={togglePanelSize}
            className="absolute top-2 right-2 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-2 shadow-lg hover:bg-muted/50 transition-colors"
            title={isPanelMinimized ? "Maximize panel" : "Minimize panel"}
            aria-label={isPanelMinimized ? "Maximize panel" : "Minimize panel"}
          >
            {isPanelMinimized ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <div className="h-full flex flex-col overflow-hidden">
            {!isPanelMinimized && (
              <NodeViewPanel
                key={selectedNode?.id || "no-selection"} // Force remount on node change
                selectedNode={selectedNode}
                mapId={map.id}
                onProgressUpdate={loadAllProgress}
                onNodeCompleted={trailMode ? handleTrailNodeCompleted : undefined}
                isNodeUnlocked={
                  selectedNode ? isNodeUnlocked(selectedNode.id) : true
                }
                userRole={userRole}
                isInstructorOrTA={isInstructorOrTA && !forceStudentView}
              />
            )}
          </div>
        </ResizablePanel>

        {/* Seed Completion Modal */}
        {completionModal}
      </ResizablePanelGroup>
      )}
    </div>
  );
}

// Wrapper component that provides ReactFlow context
export function MapViewerWithProvider({
  map,
  seedRoomId,
  seedTitle,
  seedId,
  roomSettingsComponent,
  forceStudentView,
  trailMode,
}: MapViewerProps) {
  return (
    <ReactFlowProvider>
      <style jsx global>{`
        /* Trail mode: one-finger touch pan. The pane must own the touch
           gesture — without this, mobile browsers treat a one-finger drag as
           a page scroll and users need two fingers to move the map. */
        .trail-mode .react-flow__pane {
          touch-action: none;
        }

        /* Trail mode: soft static ring on the student's current node. */
        .trail-current-ring {
          box-shadow:
            0 0 0 2px rgba(96, 165, 250, 0.75),
            0 0 18px 4px rgba(59, 130, 246, 0.3);
        }

        /* ================================
     Tunables
     ================================ */
        :root {
          --island-ease: cubic-bezier(0.33, 1, 0.68, 1);
          --island-amp: 6px; /* vertical travel of islands */
          --island-amp-sm: 3px; /* for micro motions (rope/knot) */
          --island-rot: 0.6deg;

          --edge-active: #10b981; /* active path color */
          --edge-idle: #475569; /* idle path color (slate-600) */
          --edge-width: 2.25;
          --edge-width-active: 2.75;
          --edge-opacity: 0.55;
          --edge-opacity-active: 0.85;
        }

        /* ================================
     Islands — calmer motion
     ================================ */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(calc(-1 * var(--island-amp)))
              rotate(var(--island-rot));
          }
        }
        @keyframes float-success {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            filter: brightness(1) saturate(1.12);
          }
          50% {
            transform: translateY(calc(-1.2 * var(--island-amp)))
              rotate(calc(-1 * var(--island-rot)));
            filter: brightness(1.04) saturate(1.16);
          }
        }
        @keyframes float-failed {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            filter: brightness(0.98) saturate(1.05);
          }
          50% {
            transform: translateY(calc(-0.7 * var(--island-amp))) rotate(0.3deg);
            filter: brightness(0.99) saturate(1.08);
          }
        }
        @keyframes float-submitted {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            filter: brightness(1) saturate(1.08);
          }
          50% {
            transform: translateY(calc(-1 * var(--island-amp))) rotate(-0.3deg);
            filter: brightness(1.02) saturate(1.12);
          }
        }
        @keyframes float-progress {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
            filter: brightness(1) saturate(1.08);
          }
          50% {
            transform: translateY(calc(-0.8 * var(--island-amp))) rotate(0.3deg)
              scale(1.01);
            filter: brightness(1.01) saturate(1.12);
          }
        }

        .animate-float {
          animation: float 5s var(--island-ease) infinite;
        }
        .animate-float-success {
          animation: float-success 5.5s var(--island-ease) infinite;
        }
        .animate-float-failed {
          animation: float-failed 6s var(--island-ease) infinite;
        }
        .animate-float-submitted {
          animation: float-submitted 5.5s var(--island-ease) infinite;
        }
        .animate-float-progress {
          animation: float-progress 4.5s var(--island-ease) infinite;
        }

        /* Hover tempo: barely faster */
        .react-flow__node:hover .animate-float,
        .react-flow__node:hover .animate-float-success,
        .react-flow__node:hover .animate-float-progress {
          animation-duration: 80%;
        }

        /* ================================
     Bridge / Rope — subtle micro-motion
     ================================ */
        @keyframes float-bridge {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(calc(-1 * var(--island-amp-sm)));
          }
        }
        @keyframes rope-sway {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(1.2deg);
          }
        }
        @keyframes float-knot {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(calc(-0.5 * var(--island-amp-sm))) scale(1.03);
          }
        }
        .animate-float-bridge {
          animation: float-bridge 7s var(--island-ease) infinite;
        }
        .animate-float-rope {
          animation: rope-sway 6.5s var(--island-ease) infinite;
        }
        .animate-float-knot {
          animation: float-knot 6s var(--island-ease) infinite;
        }

        /* ================================
     Edges — no dashes, no dots
     ================================ */
        /* Kill the default dashed animation that looks like dots */
        .react-flow__edge-path.animated {
          stroke-dasharray: none !important;
          animation: none !important;
        }
        /* Smoother, consistent look */
        .react-flow__edge-path {
          stroke-linecap: round;
          transition:
            stroke 200ms ease,
            opacity 200ms ease,
            stroke-width 200ms ease;
        }
        /* Use className on edges to toggle these: edge--active / edge--idle */
        .edge--idle .react-flow__edge-path {
          stroke: var(--edge-idle);
          stroke-width: var(--edge-width);
          opacity: var(--edge-opacity);
        }
        .edge--active .react-flow__edge-path {
          stroke: var(--edge-active);
          stroke-width: var(--edge-width-active);
          opacity: var(--edge-opacity-active);
        }

        /* ================================
     Focus / Accessibility
     ================================ */
        .react-flow__node:focus {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }
        .react-flow__edge:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 1px;
        }

        @media (prefers-contrast: high) {
          .react-flow__edge {
            stroke-width: 4px !important;
          }
          .react-flow__node {
            border: 2px solid currentColor !important;
          }
        }

        @media (min-resolution: 2dppx) {
          /* High DPI adjustments could go here if needed */
        }

        /* Reduced motion: stop all animations */
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-success,
          .animate-float-failed,
          .animate-float-submitted,
          .animate-float-progress,
          .animate-float-bridge,
          .animate-float-rope,
          .animate-float-knot {
            animation: none !important;
          }
          .react-flow__edge-path {
            transition: none !important;
          }
        }
      `}</style>

      <MapViewer
        map={map}
        seedRoomId={seedRoomId}
        seedTitle={seedTitle}
        seedId={seedId}
        roomSettingsComponent={roomSettingsComponent}
        forceStudentView={forceStudentView}
        trailMode={trailMode}
      />
    </ReactFlowProvider>
  );
}
