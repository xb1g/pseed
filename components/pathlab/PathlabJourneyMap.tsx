"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  FIELDS,
  JOURNEY_MAP,
  type FieldDetail,
} from "@/lib/content/pathlab-page";

/**
 * Interactive "Learning journey เป็นยังไง": the real five days of each open
 * path rendered as floating islands the visitor can pan, zoom, and tap.
 *
 * Data comes straight from FIELDS (the same source the field cards read), so
 * the preview always matches what a path promises. Selection starts on day 1
 * — the first island — and a row of day chips mirrors island taps so the
 * detail card stays reachable even when the canvas is zoomed out on a phone.
 *
 * Loaded via next/dynamic (ssr: false) from PathlabJourney: React Flow is
 * heavy and this section is below the fold, so it stays out of the landing
 * bundle and the static screenshot shows while the chunk loads.
 */

/** Island artwork cycles so no two neighbouring days share a landscape. */
const SPRITES = [
  "/islands/crystal.webp",
  "/islands/desert.webp",
  "/islands/winter.webp",
] as const;

const SPRITE_SIZE = 96;
/** Horizontal pitch between days, and the drop that makes the path wander. */
const GAP_X = 210;
const STEP_Y = 130;

interface IslandData extends Record<string, unknown> {
  dayIndex: number;
  title: string;
  sprite: string;
  selected: boolean;
}

type IslandNode = Node<IslandData>;

function JourneyIslandNode({ data }: NodeProps<IslandNode>) {
  return (
    <div className={`journey-island${data.selected ? " is-selected" : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="journey-island__handle"
      />
      <span
        className="journey-island__sprite"
        /* Prime-ish stagger keeps the float from syncing across islands. */
        style={{ animationDelay: `${data.dayIndex * 0.83}s` }}
      >
        <Image
          src={data.sprite}
          alt=""
          width={SPRITE_SIZE}
          height={SPRITE_SIZE}
        />
      </span>
      {/* Labels hang below the node box so edges anchor at the sprite's
          centre, not somewhere through the text. */}
      <span className="journey-island__labels">
        <span className="journey-island__day">
          {JOURNEY_MAP.dayPrefix} {data.dayIndex + 1}
        </span>
        <span className="journey-island__title">{data.title}</span>
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="journey-island__handle"
      />
    </div>
  );
}

/* Defined once at module scope: a new object per render would remount every
   node on each selection change. */
const nodeTypes = { journeyIsland: JourneyIslandNode };

function buildNodes(detail: FieldDetail, selected: number): IslandNode[] {
  return detail.days.map((day, i) => ({
    id: `day-${i}`,
    type: "journeyIsland",
    position: { x: i * GAP_X, y: i % 2 === 0 ? 0 : STEP_Y },
    draggable: false,
    data: {
      dayIndex: i,
      title: day.title,
      sprite: SPRITES[i % SPRITES.length],
      selected: i === selected,
    },
  }));
}

function buildEdges(detail: FieldDetail): Edge[] {
  return detail.days.slice(0, -1).map((_, i) => ({
    id: `path-${i}`,
    source: `day-${i}`,
    target: `day-${i + 1}`,
    style: {
      stroke: "rgba(196, 62, 29, 0.4)",
      strokeWidth: 2,
      strokeDasharray: "7 7",
    },
  }));
}

/** Paths with written five-day copy — the ones a visitor can actually join. */
const OPEN_FIELDS = FIELDS.filter((field) => field.detail);

export default function PathlabJourneyMap() {
  const [fieldIndex, setFieldIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);

  const field = OPEN_FIELDS[fieldIndex];
  const detail = field.detail as FieldDetail;

  const nodes = useMemo(() => buildNodes(detail, dayIndex), [detail, dayIndex]);
  const edges = useMemo(() => buildEdges(detail), [detail]);

  const day = detail.days[dayIndex];

  return (
    <div className="pathlab-journey-map">
      <div
        className="pathlab-journey-map__fields"
        aria-label={JOURNEY_MAP.fieldsLabel}
      >
        {OPEN_FIELDS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={i === fieldIndex}
            className={`pathlab-journey-map__field${
              i === fieldIndex ? " is-active" : ""
            }`}
            /* A new path always opens on its first island. */
            onClick={() => {
              setFieldIndex(i);
              setDayIndex(0);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pathlab-journey-map__canvas">
        <ReactFlowProvider>
          {/* Remount per field so fitView reframes the new chain. */}
          <ReactFlow
            key={field.label}
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
            onNodeClick={(_, node) =>
              setDayIndex(Number(node.id.replace("day-", "")))
            }
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
        <div
          className="pathlab-journey-map__days"
          aria-label={JOURNEY_MAP.daysLabel}
        >
          {detail.days.map((d, i) => (
            <button
              key={`${field.label}-${d.title}`}
              type="button"
              aria-pressed={i === dayIndex}
              className={`pathlab-journey-map__day${
                i === dayIndex ? " is-active" : ""
              }`}
              onClick={() => setDayIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="pathlab-journey-map__detail-heading">
          {JOURNEY_MAP.dayPrefix} {dayIndex + 1}: {day.title}
        </p>
        <p className="pathlab-journey-map__detail-doing">{day.doing}</p>
        <span className="pathlab-note pathlab-note--tilt-r pathlab-journey-map__detail-gets">
          {JOURNEY_MAP.getsLabel}: {day.gets}
        </span>
      </div>
    </div>
  );
}
