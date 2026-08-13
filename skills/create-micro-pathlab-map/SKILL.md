---
name: create-micro-pathlab-map
description: Create, validate, and persist a 5–45 minute Micro PathLab as a standalone PassionSeed learning map rendered directly by app/map/[id]/page.tsx and components/map/MapViewer.tsx. Use when converting a short career simulation, taste test, case exercise, or bilingual challenge into map nodes, content, assessments, and connections; when publishing through /api/maps/create-micro-pathlab; or when the user explicitly wants the result at /map/<id> rather than in the seed/day-based PathLab player.
---

# Create Micro PathLab Map

Build a standalone `learning_maps` experience that renders directly at
`/map/<mapId>`.

## Required context

Read:

1. [`references/map-contract.md`](references/map-contract.md) for the exact
   import and persistence contract.
2. Repository `docs/pathlab-design-doctrine.md`
   for the editorial standard.

Use this standalone contract even if `app/project/page.tsx` or an older PathLab
skill shows `seed`, `path`, or `days` fields.

## Surface boundary

Target this data flow:

```text
app/map/[id]/page.tsx
  -> getMapWithNodesServer(mapId)
  -> components/map/MapViewer.tsx
```

Create `learning_maps`, `map_nodes`, `node_content`, optional assessments and
quiz questions, and `node_paths`. Do not create `seeds`, `paths`, `path_days`,
or `path_activities`. Do not call `/api/pathlab/generate`; it creates a seed map
that `app/map/[id]` restricts to admins.

## Workflow

### 1. Design one honest career encounter

Design in this order:

1. Career truth to test.
2. Self-knowledge question the learner must answer.
3. Observable fit and misfit signals.
4. Real work that reveals those signals.
5. Minimum content needed to attempt the work.

For a 10–20 minute session, use 2–5 nodes: brief, real work, pressure, and a
fit decision. Merge stages for shorter sessions. Do not expand the experience
into a day-based course.

### 2. Author the standalone payload

Start from [`assets/micro-pathlab-map.template.json`](assets/micro-pathlab-map.template.json).
Use exactly `map`, `nodes`, and `connections` at the top level.

- Give each node a unique slug-like `key`.
- Reference keys from `connections[].from` and `connections[].to`.
- Keep the graph connected and acyclic; the first array node is the start.
- Store canvas coordinates in each node's `position`.
- Use singular `assessment`; omit it only for a presentation-only node.
- Use `node_type: "end"` for the final decision node.

Require at least one non-quiz learner output. The final node must explicitly
ask for `Continue / Pause / Quit` and one reason tied to the work. Treat every
choice as valid.

For high-stakes simulations, identify the experience as educational and avoid
presenting simplified answers as professional advice.

### 3. Validate

```bash
node --import tsx skills/create-micro-pathlab-map/scripts/validate-payload.ts <payload.json>
```

Fix every error before persistence.

### 4. Persist to the direct map surface

Send the validated JSON body through the user's authenticated app session:

```text
POST /api/maps/create-micro-pathlab
```

The current user becomes the map creator. The route creates a standalone public
or private map, inserts all dependent rows, verifies the node count, and returns
`mapId` and `mapPath`.

Open `mapPath` and verify the canvas, node content, assessments, locked-path
progression, and final decision. Do not claim creation until the endpoint
returns a `mapId` and `/map/<mapId>` loads. If authentication is unavailable,
return the validated payload and state that it is not persisted.

## Completion checklist

- Output uses the standalone `map + nodes + connections` contract.
- The student performs recognizable career work and makes an artifact.
- The experience can surface fit and misfit.
- The final node asks `Continue / Pause / Quit`.
- Validation passes.
- The created map is not `map_type: "seed"`.
- A claimed URL is backed by a returned `mapId` and loaded `/map/<mapId>`.
