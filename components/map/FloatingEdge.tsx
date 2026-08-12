import { useCallback } from "react";
import { useStore, getBezierPath, EdgeProps, Node } from "@xyflow/react";

import { getEdgeParams } from "./utils";

function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  data,
  edit,
  selected,
}: EdgeProps & { edit?: boolean }) {
  const sourceNode = useStore(
    useCallback((store) => store.nodeLookup.get(source), [source])
  );
  const targetNode = useStore(
    useCallback((store) => store.nodeLookup.get(target), [target])
  );

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  // Trail mode: passed sources show the wooden/orange bridge, upcoming stays
  // green (colors swapped per UX feedback).
  const isPassed = (data as any)?.passed === true;
  const bridgeMain = selected ? "#3b82f6" : isPassed ? "#D2691E" : "#10b981";
  const bridgePlanks = selected ? "#1e40af" : isPassed ? "#8B4513" : "#059669";

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  if (edit) {
    // Clean edit mode without visual clutter
    return (
      <g className="edge-edit-group">
        {/* Invisible thick path for easier selection */}
        <path
          className="react-flow__edge-path"
          d={edgePath}
          style={{
            stroke: "transparent",
            strokeWidth: 20,
            fill: "none",
            cursor: "pointer",
          }}
        />
        {/* Visible path */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: selected ? "#3b82f6" : "#8B4513",
            strokeWidth: selected ? 3 : 2,
            strokeDasharray: selected ? "8,4" : "5,5",
            transition: "all 200ms ease-in-out",
            filter: selected
              ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))"
              : "none",
            pointerEvents: "none", // Let the invisible path handle events
          }}
        />
      </g>
    );
  }

  return (
    <g
      className="sky-bridge-group"
      style={{ cursor: selected ? "pointer" : "default" }}
    >
      {/* Invisible thick path for easier selection */}
      <path
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: "transparent",
          strokeWidth: 20,
          fill: "none",
          cursor: "pointer",
        }}
      />
      {/* Soft shadow for depth */}
      <path
        d={edgePath}
        className="bridge-shadow"
        style={{
          stroke: selected ? "rgba(59, 130, 246, 0.25)" : "rgba(0,0,0,0.15)",
          strokeWidth: selected ? 10 : 8,
          fill: "none",
          transform: "translate(1px, 3px)",
          filter: "blur(2px)",
          transition: "all 300ms ease-in-out",
          pointerEvents: "none",
        }}
      />

      {/* Main bridge path */}
      <path
        id={id}
        className="sky-bridge-main"
        d={edgePath}
        style={{
          ...style,
          stroke: bridgeMain,
          strokeWidth: selected ? 6 : 5,
          fill: "none",
          strokeLinecap: "round",
          transition: "all 300ms ease-in-out",
          filter: selected
            ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))"
            : isPassed
              ? "drop-shadow(0 0 4px rgba(210, 105, 30, 0.4))"
              : "none",
          pointerEvents: "none",
        }}
      />

      {/* Plank ticks for texture, kept subtle */}
      <path
        d={edgePath}
        style={{
          stroke: bridgePlanks,
          strokeWidth: selected ? 2 : 1.5,
          fill: "none",
          strokeDasharray: "3,9",
          strokeLinecap: "round",
          opacity: selected ? 0.9 : 0.65,
          transition: "all 300ms ease-in-out",
          pointerEvents: "none",
        }}
      />
    </g>
  );
}

export default FloatingEdge;

export const FloatingEdgeEdit = (props: EdgeProps) => (
  <FloatingEdge {...props} edit={true} />
);
