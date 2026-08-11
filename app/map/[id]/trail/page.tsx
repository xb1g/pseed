import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMapWithNodesServer } from "@/lib/supabase/maps-server";
import { MapViewerWithProvider as MapViewer } from "@/components/map/MapViewer";
import { ArrowLeft } from "lucide-react";
import type { LearningMap, MapNode } from "@/types/map";

// Prototype "trail" (Duolingo-style bottom-to-top) student map view.
// Minimal by design: no MapEnrollmentTracker (no auto-enroll/tour) and no
// seed-map admin restriction — this route is a preview only.

const DEMO_SPRITES = [
  "/islands/crystal.png",
  "/islands/desert.png",
  "/islands/winter.png",
];

// Fabricated multi-node map so the trail layout can be evaluated without
// needing a real map full of nodes: /map/<any-id>/trail?demo=1
function buildDemoMap(): LearningMap {
  const now = new Date().toISOString();
  const mapId = "00000000-0000-0000-0000-000000000099";
  const count = 10;

  const nodes: MapNode[] = Array.from({ length: count }, (_, i) => {
    const id = `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`;
    const isLast = i === count - 1;
    return {
      id,
      map_id: mapId,
      title: isLast ? "Final Challenge" : `Step ${i + 1}`,
      instructions: null,
      difficulty: (i % 3) + 1,
      sprite_url: DEMO_SPRITES[i % DEMO_SPRITES.length],
      metadata: null,
      node_type: isLast ? "end" : "learning",
      created_at: now,
      updated_at: now,
      node_content: [],
      node_assessments: [],
      // Chain: node i -> node i+1
      node_paths_source: isLast
        ? []
        : [
            {
              id: `10000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
              source_node_id: id,
              destination_node_id: `00000000-0000-0000-0000-${String(i + 2).padStart(12, "0")}`,
            },
          ],
      node_paths_destination: [],
    };
  });

  return {
    id: mapId,
    title: "Trail Demo",
    description: "Fabricated nodes for previewing the trail layout",
    creator_id: null,
    difficulty: 2,
    visibility: "public",
    metadata: {},
    map_type: "public",
    created_at: now,
    updated_at: now,
    map_nodes: nodes,
  } as LearningMap;
}

export default async function MapTrailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const isDemo = searchParams.demo === "1" || searchParams.demo === "true";

  const map = isDemo ? buildDemoMap() : await getMapWithNodesServer(params.id);

  if (!map) {
    notFound();
  }

  return (
    <div className="w-full relative" style={{ height: "calc(100vh - 65px)" }}>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/map/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pathlab
          </Link>
        </Button>
        {isDemo && (
          <span className="text-xs text-muted-foreground self-center bg-background/80 px-2 py-1 rounded">
            Demo data — not your real map
          </span>
        )}
      </div>
      <MapViewer map={map} trailMode forceStudentView />
    </div>
  );
}
