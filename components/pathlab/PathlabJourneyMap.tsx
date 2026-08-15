"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GameNode } from "@/components/map/MapViewer/components/GameNode";
import {
  JOURNEY,
  JOURNEY_MAP,
} from "@/lib/content/pathlab-page";
import {
  toFlowEdges,
  toFlowNodes,
  type JourneyPreview,
} from "@/components/pathlab/journey-map-utils";

/**
 * "Learning journey เป็นยังไง": a live, read-only preview of a real PathLab
 * map (the same GameNode the actual map viewer renders), fetched from
 * /api/maps/public-preview so it always matches the product.
 *
 * Loaded via next/dynamic (ssr: false) from PathlabJourney: React Flow is
 * heavy and this section is below the fold, so it stays out of the landing
 * bundle and the static screenshot shows while the chunk loads. The same
 * screenshot covers the in-component loading and error states.
 */

const DEMO_MAP_ID = "00000000-0000-0000-0000-000000000020";

function JourneyGameNode({ data }: NodeProps) {
  return (
    <div
      className={`pathlab-journey-map__game-node${
        data.selected ? " is-selected" : ""
      }`}
    >
      <GameNode
        data={data as never}
        selected={false}
        isUnlocked={true}
        isCompleted={false}
        /* GameNodeProps types this non-null; the badge it drives only renders
           when isTeamMap is true, so the value is never shown here. */
        requirement="single"
        isTeamMap={false}
        isInstructorOrTA={false}
        allSubmissions={[]}
      />
    </div>
  );
}

/* Defined once at module scope: a new object per render would remount every
   node on each selection change. */
const nodeTypes = { journeyGame: JourneyGameNode };

function ScreenshotFallback() {
  return (
    <Image
      src={JOURNEY.src}
      alt={JOURNEY.alt}
      width={1200}
      height={800}
      className="pathlab-journey-map__screenshot"
    />
  );
}

export default function PathlabJourneyMap() {
  const [preview, setPreview] = useState<JourneyPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/maps/public-preview/${DEMO_MAP_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error(`preview ${res.status}`);
        return res.json();
      })
      .then((data: JourneyPreview) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        console.error("journey preview failed:", err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const nodes = useMemo(
    () => (preview ? toFlowNodes(preview, selectedId) : []),
    [preview, selectedId]
  );
  const edges = useMemo(
    () => (preview ? toFlowEdges(preview) : []),
    [preview]
  );

  if (failed) {
    return (
      <div className="pathlab-journey-map">
        <div className="pathlab-journey-map__canvas is-fallback">
          <ScreenshotFallback />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="pathlab-journey-map" aria-busy="true">
        <div className="pathlab-journey-map__canvas is-fallback">
          <ScreenshotFallback />
        </div>
      </div>
    );
  }

  const selected = preview.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="pathlab-journey-map">
      <p className="pathlab-journey-map__map-title">
        <span className="pathlab-note">{JOURNEY_MAP.mapLabel}</span>{" "}
        {preview.map.title}
      </p>

      <div className="pathlab-journey-map__canvas">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.28, maxZoom: 1 }}
            minZoom={0.45}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            zoomOnPinch
            panOnDrag
            onNodeClick={(_, node) => setSelectedId(node.id)}
          >
            <Background gap={26} size={2} color="rgba(82, 71, 70, 0.14)" />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <p className="pathlab-journey-map__hint">
        <span className="pathlab-note">{JOURNEY_MAP.hint}</span>
      </p>

      <div className="pathlab-journey-map__detail" aria-live="polite">
        <p className="pathlab-journey-map__detail-heading">
          {selected ? selected.title : preview.map.title}
        </p>
        <p className="pathlab-journey-map__detail-doing">
          {selected
            ? (selected.snippet ?? preview.map.description ?? "")
            : (preview.map.description ?? "")}
        </p>
        <Link
          href={`/map/${preview.map.id}`}
          className="pathlab-journey-map__cta"
        >
          {JOURNEY_MAP.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
