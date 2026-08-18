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

const STARTUP_JOURNEY: JourneyDay[] = [
  {
    day: 1,
    stops: [
      {
        id: "su-1",
        title: "ล่าปัญหา & Spot the Problem",
        sprite_url: "/islands/launchpad/day1.png",
        difficulty: 1,
        node_type: "learning",
      },
    ],
  },
  {
    day: 2,
    stops: [
      {
        id: "su-2",
        title: "ค้นหาลูกค้า & Customer Discovery",
        sprite_url: "/islands/launchpad/day2.png",
        difficulty: 1,
        node_type: "learning",
      },
    ],
  },
  {
    day: 3,
    stops: [
      {
        id: "su-3",
        title: "Lean Canvas & Napkin Economics",
        sprite_url: "/islands/launchpad/day3.png",
        difficulty: 2,
        node_type: "learning",
      },
    ],
  },
  {
    day: 4,
    stops: [
      {
        id: "su-4",
        title: "สร้าง MVP & Rapid Prototype",
        sprite_url: "/islands/launchpad/day4.png",
        difficulty: 2,
        node_type: "learning",
      },
    ],
  },
  {
    day: 5,
    stops: [
      {
        id: "su-5",
        title: "First 50 Users & Traction",
        sprite_url: "/islands/launchpad/day5.png",
        difficulty: 3,
        node_type: "learning",
      },
    ],
  },
  {
    day: 6,
    stops: [
      {
        id: "su-6",
        title: "Pitch Day & Launch",
        sprite_url: "/islands/launchpad/day6.png",
        difficulty: 3,
        node_type: "end",
      },
    ],
  },
];

const BY_ID: Record<string, JourneyDay[]> = {
  // Web Dev demo map
  "00000000-0000-0000-0000-000000000010": WEB_DEV_JOURNEY,
  // Startup PathLab demo map
  "00000000-0000-0000-0000-000000000020": STARTUP_JOURNEY,
};

const BY_TITLE: Record<string, JourneyDay[]> = {
  "Expert PathLabs": STARTUP_JOURNEY,
  "Startup PathLab": STARTUP_JOURNEY,
  "LaunchPad": STARTUP_JOURNEY,
  "Web Developer PathLab": WEB_DEV_JOURNEY,
};

export function getLobbyJourneyOverride(
  mapId: string,
  mapTitle?: string | null
): JourneyDay[] | null {
  if (BY_ID[mapId]) return BY_ID[mapId];
  if (!mapTitle) return STARTUP_JOURNEY;
  if (BY_TITLE[mapTitle]) return BY_TITLE[mapTitle];
  if (/startup|ธุรกิจ|launchpad/i.test(mapTitle)) return STARTUP_JOURNEY;
  if (/web|frontend|coding|code/i.test(mapTitle)) return WEB_DEV_JOURNEY;
  return STARTUP_JOURNEY;
}
