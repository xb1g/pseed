import type { JourneyDay } from "@/lib/utils/map-journey";

/**
 * Hardcoded lobby-gate journeys (design preview).
 *
 * The gate at /map/[id] shows these instead of graph-derived data while the
 * real content pipeline is being authored. Match by map id; add an entry to
 * BY_TITLE for maps that should show the Web Dev arc regardless of id.
 *
 * TODO: remove once real map content is ready — the gate then derives the
 * journey from the map's own nodes via buildJourneyDays().
 */

const WEB_DEV_JOURNEY: JourneyDay[] = [
  {
    day: 1,
    stops: [
      {
        id: "wd-1",
        title: "How the web works & HTML structure",
        sprite_url: "/islands/crystal.png",
        difficulty: 1,
        node_type: "learning",
      },
    ],
  },
  {
    day: 2,
    stops: [
      {
        id: "wd-2",
        title: "Style it with CSS: layout, flexbox, grid",
        sprite_url: "/islands/desert.png",
        difficulty: 2,
        node_type: "learning",
      },
    ],
  },
  {
    day: 3,
    stops: [
      {
        id: "wd-3",
        title: "JavaScript: make the page alive",
        sprite_url: "/islands/winter.png",
        difficulty: 2,
        node_type: "learning",
      },
    ],
  },
  {
    day: 4,
    stops: [
      {
        id: "wd-4",
        title: "Fetch real data & handle forms",
        sprite_url: "/islands/crystal.png",
        difficulty: 3,
        node_type: "learning",
      },
    ],
  },
  {
    day: 5,
    stops: [
      {
        id: "wd-5",
        title: "Final project: ship your first website",
        sprite_url: "/islands/desert.png",
        difficulty: 3,
        node_type: "end",
      },
    ],
  },
];

const BY_ID: Record<string, JourneyDay[]> = {
  // Trail Demo seed map
  "00000000-0000-0000-0000-000000000010": WEB_DEV_JOURNEY,
};

const BY_TITLE: Record<string, JourneyDay[]> = {
  "Expert PathLabs": WEB_DEV_JOURNEY,
};

export function getLobbyJourneyOverride(
  mapId: string,
  mapTitle?: string | null
): JourneyDay[] | null {
  return BY_ID[mapId] ?? (mapTitle ? (BY_TITLE[mapTitle] ?? null) : null);
}
