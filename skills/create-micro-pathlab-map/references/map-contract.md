# Standalone contract for `app/map/[id]`

## Sources of truth

- Schema: `lib/maps/micro-pathlab-import.ts`
- Persistence: `app/api/maps/create-micro-pathlab/route.ts`
- Read query: `lib/supabase/maps-server.ts#getMapWithNodesServer`
- Route: `app/map/[id]/page.tsx`
- Viewer: `components/map/MapViewer.tsx`

## Payload

```json
{
  "map": {
    "title": "string",
    "description": "string",
    "difficulty": 1,
    "estimatedMinutes": 10,
    "visibility": "public",
    "metadata": {
      "tags": ["law", "english"],
      "fit_signals": ["optional"],
      "misfit_signals": ["optional"]
    }
  },
  "nodes": [],
  "connections": []
}
```

`visibility` is `public` or `private`. Persistence maps it to a matching
standalone `map_type`, never `seed`.

## Node

```json
{
  "key": "choose_clause",
  "title": "Choose the clause",
  "instructions": "Compare the clauses and choose the stronger basis.",
  "node_type": "learning",
  "position": { "x": 100, "y": 100 },
  "difficulty": 1,
  "content": [
    {
      "content_type": "text",
      "content_title": "Contract extract",
      "content_body": "Clause text",
      "content_url": null
    }
  ],
  "assessment": {
    "type": "text_answer",
    "prompt": "Write one sentence.",
    "isGraded": false,
    "pointsPossible": 0
  }
}
```

Node types: `learning`, `text`, `comment`, `end`.

Content types: `text`, `video`, `canva_slide`, `image`, `pdf`,
`resource_link`. Each content item needs a body or valid URL.

Assessment types: `quiz`, `text_answer`, `file_upload`, `image_upload`,
`checklist`. Quizzes include `quiz_questions`. Checklists include
`checklist_items`, persisted to `metadata.checklist_items` for MapViewer.

## Connections

```json
{ "from": "choose_clause", "to": "write_advice" }
```

Connections persist to `node_paths`. Keep the graph connected and acyclic.

## Response

```json
{
  "success": true,
  "mapId": "uuid",
  "mapPath": "/map/uuid",
  "nodesCreated": 4,
  "assessmentsCreated": 4,
  "connectionsCreated": 3
}
```

The route requires an authenticated user, verifies the resulting node count,
and cleans up the map if a later insert fails.
