"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  Node,
  Edge,
  NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { FullLearningMap } from "@/lib/supabase/maps";
import { ProgressStatus } from "@/types/map";
import FloatingEdge from "@/components/map/FloatingEdge";
import { computeTopDownLayout } from "./layout";
import { cn } from "@/lib/utils";

interface MapCanvasProps {
  map: FullLearningMap;
  progressMap: Record<string, { status: ProgressStatus }>;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  isEditable?: boolean;
}

interface MapNodeData {
  title: string;
  difficulty: number;
  status: ProgressStatus;
  isLocked: boolean;
}

const statusClasses: Record<
  ProgressStatus,
  { border: string; text: string; glow?: string }
> = {
  not_started: { border: "!border-slate-600", text: "text-slate-300" },
  in_progress: {
    border: "!border-amber-500",
    text: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]",
  },
  submitted: { border: "!border-blue-500", text: "text-blue-400" },
  passed: { border: "!border-emerald-500", text: "text-emerald-400" },
  failed: { border: "!border-red-500", text: "text-red-400" },
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MapNodeComponent({ data, selected }: NodeProps) {
  const { title, difficulty, status, isLocked } = data as unknown as MapNodeData;
  const style = statusClasses[status];

  return (
    <div
      className={cn(
        "ei-card rounded-xl p-3 w-[200px] h-[120px] flex flex-col justify-between cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl",
        style.border,
        style.text,
        style.glow,
        selected && "ring-2 ring-blue-500",
        status === "passed" && !selected && "ring-2 ring-emerald-500",
        isLocked && "opacity-60"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight text-white line-clamp-2">
          {title}
        </span>
        {status === "passed" && (
          <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        {isLocked && status !== "passed" && (
          <LockIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Difficulty</span>
          <span>{difficulty}/10</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i < difficulty ? "bg-amber-400" : "bg-slate-700"
              )}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
          {status.replace("_", " ")}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </div>
  );
}

const nodeTypes = {
  mapNode: MapNodeComponent,
};

const edgeTypes = {
  floating: FloatingEdge,
};

export default function MapCanvas({
  map,
  progressMap,
  selectedNodeId,
  onNodeSelect,
}: MapCanvasProps) {
  const initialNodes = useMemo(
    () =>
      map.map_nodes.map((node) => ({
        id: node.id,
        type: "mapNode" as const,
        data: {
          title: node.title,
          difficulty: node.difficulty,
          status: "not_started" as ProgressStatus,
          isLocked: false,
        },
        position: { x: 0, y: 0 },
      })),
    [map]
  );

  const initialEdges = useMemo(
    () =>
      map.map_nodes.flatMap((node) =>
        (node.node_paths_source ?? []).map((path) => ({
          id: `${node.id}->${path.destination_node_id}`,
          source: node.id,
          target: path.destination_node_id,
          type: "floating" as const,
        }))
      ),
    [map]
  );

  const layouted = useMemo(
    () =>
      computeTopDownLayout(initialNodes, initialEdges, {
        nodeWidth: 200,
        nodeHeight: 120,
        horizontalGap: 80,
        verticalGap: 150,
      }),
    [initialNodes, initialEdges]
  );

  const parentMap = useMemo(() => {
    const map_ = new Map<string, string[]>();
    for (const node of map.map_nodes) {
      map_.set(
        node.id,
        (node.node_paths_destination ?? []).map((p) => p.source_node_id)
      );
    }
    return map_;
  }, [map]);

  const nodes: Node[] = useMemo(
    () =>
      layouted.map((n) => {
        const node = map.map_nodes.find((m) => m.id === n.id)!;
        const parents = parentMap.get(n.id) ?? [];
        const status = progressMap[n.id]?.status ?? "not_started";
        const isLocked =
          parents.length > 0 &&
          !parents.every((pid) => progressMap[pid]?.status === "passed");
        return {
          ...n,
          data: {
            title: node.title,
            difficulty: node.difficulty,
            status,
            isLocked,
          },
          selected: n.id === selectedNodeId,
        };
      }),
    [layouted, parentMap, progressMap, map.map_nodes, selectedNodeId]
  );

  const edges: Edge[] = useMemo(
    () =>
      initialEdges.map((edge) => {
        const passed = progressMap[edge.source]?.status === "passed";
        return {
          ...edge,
          style: { stroke: passed ? "#10b981" : "#64748b" },
        };
      }),
    [initialEdges, progressMap]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={24} size={1} />
        <Controls className="!bg-slate-800 !text-white !border-slate-700 !bottom-4 !left-4" />
      </ReactFlow>
    </div>
  );
}
