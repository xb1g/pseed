import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getMapWithNodesServer,
  getMapPreviewServer,
} from "@/lib/supabase/maps-server";
import { buildJourneyDays } from "@/lib/utils/map-journey";
import { getLobbyJourneyOverride } from "@/lib/lobby-journeys";
import { createClient } from "@/utils/supabase/server";
import { isInstructor } from "@/lib/supabase/roles";
import { MapViewerWithProvider as MapViewer } from "@/components/map/MapViewer";
import { MapEnrollmentTracker } from "@/components/map/MapEnrollmentTracker";
import { LobbyCodeGateWrapper } from "@/components/map/LobbyCodeGate";
import { getUserLobbyForMap, getLobbyPresence } from "@/lib/supabase/lobbies";
import { ArrowLeft, Pencil, ClipboardCheck } from "lucide-react";

export default async function MapViewerPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors get the public preview and nothing else. They cannot
  // run the node query at all: `anon` has SELECT on learning_maps but not on
  // map_nodes / node_content / node_paths / quiz_questions, so attempting it
  // fails the whole page with "permission denied for table map_nodes".
  if (!user) {
    const preview = await getMapPreviewServer(params.id);
    if (!preview) notFound();

    // No journey fetch here: `anon` has no SELECT on map_nodes or node_paths,
    // so any query would return empty regardless. The gate renders authored
    // curriculum content (hardcoded in lib/lobby-journeys.ts for now).
    const journeyDays =
      getLobbyJourneyOverride(params.id, preview.title) ?? [];
    return (
      <LobbyCodeGateWrapper
        map={{
          id: preview.id,
          title: preview.title,
          description: preview.description,
          cover_image_url: preview.cover_image_url ?? null,
          node_count: journeyDays.reduce((sum, d) => sum + d.stops.length, 0),
          avg_difficulty: preview.difficulty ?? 0,
          category: preview.category ?? null,
          journey: journeyDays,
        }}
      />
    );
  }

  const map = await getMapWithNodesServer(params.id);

  if (!map) {
    notFound();
  }

  // Check if user is admin
  const userIsAdmin = user
    ? await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single()
      .then(({ data }) => !!data)
    : false;

  // Restrict access to seed maps - only admins can access seed maps directly
  if (map.map_type === 'seed' && !userIsAdmin) {
    notFound();
  }

  // OPTIMIZATION: Only check instructor status if needed (user exists and isn't creator)
  const userIsInstructor = user && map.creator_id !== user.id
    ? await isInstructor(user.id)
    : false;

  // Check if user is the creator of this map
  const userIsCreator = user && map.creator_id === user.id;

  // Check if user is an editor of this map
  const userIsEditor = user
    ? await supabase
      .from("map_editors")
      .select("id")
      .eq("map_id", params.id)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => !!data)
    : false;

  // Simple inline permission check - user can edit if they're the creator OR editor OR instructor OR admin
  const userCanEdit = user && (userIsCreator || userIsEditor || userIsInstructor || userIsAdmin);

  // User can grade if they're creator OR editor OR instructor OR admin
  const userCanGrade = user && (userIsCreator || userIsEditor || userIsInstructor || userIsAdmin);

  // Lobby gate: check if user is in a lobby for this map
  const userLobby = user ? await getUserLobbyForMap(params.id) : null;
  const canBypassGate = userIsAdmin || userIsInstructor || map.creator_id === user?.id;

  // Lobbymates' starting positions. Empty for gate-bypassers with no lobby of
  // their own; the canvas then simply renders no avatars.
  const initialPresence = userLobby ? await getLobbyPresence(params.id) : [];

  if (!userLobby && !canBypassGate) {
    // Hardcoded journey takes priority (design preview); fall back to the
    // map's own path graph for maps without an override.
    const journeyDays =
      getLobbyJourneyOverride(map.id, map.title) ??
      buildJourneyDays(
        map.map_nodes ?? [],
        (map.map_nodes ?? []).flatMap((n) =>
          (n.node_paths_source ?? []).map((p) => ({
            source: p.source_node_id,
            destination: p.destination_node_id,
          }))
        )
      );

    return (
      <LobbyCodeGateWrapper
        map={{
          id: map.id,
          title: map.title,
          description: map.description,
          cover_image_url: map.cover_image_url ?? null,
          node_count: map.map_nodes?.length ?? 0,
          avg_difficulty: map.difficulty ?? 0,
          category: map.category ?? null,
          journey: journeyDays,
        }}
      />
    );
  }

  return (
    <MapEnrollmentTracker map={map}>
      <div className="w-full" style={{ height: "calc(100vh - 65px)" }}>
        <div className="absolute top-20 left-4 z-10 flex gap-2">
          <Button asChild variant="outline" size="sm">
            {map.map_type === 'seed' && map.parent_seed_id ? (
              <Link href={`/seeds/${map.parent_seed_id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Seed
              </Link>
            ) : (
              <Link href="/map">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pathlabs
              </Link>
            )}
          </Button>
          {userCanEdit && (
            <Button asChild variant="default" size="sm">
              <Link href={`/map/${params.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Map
              </Link>
            </Button>
          )}
          {userCanGrade && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/map/${params.id}/grading`}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Grade Submissions
              </Link>
            </Button>
          )}
        </div>
        <MapViewer map={map} trailMode initialPresence={initialPresence} />
      </div>
    </MapEnrollmentTracker>
  );
}
