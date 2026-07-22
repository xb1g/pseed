import { act, render, waitFor } from "@testing-library/react";

import { RadarFieldPageClient } from "../RadarFieldPageClient";
import { getSavedRadarReflectionChapterKeys } from "@/lib/supabase/radar";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/radar/RadarCards", () => ({
  RadarCardView: () => <div>Radar card</div>,
  SourceRefs: () => null,
}));

jest.mock("@/components/radar/RadarPageClient", () => ({
  getCareerCardVisual: () => ({
    background: "#020617",
    dotStyle: {},
  }),
}));

jest.mock("@/components/radar/RadarSkillExperience", () => ({
  RadarSkillExperience: () => null,
}));

jest.mock("@/lib/supabase/radar", () => ({
  getSavedRadarReflectionChapterKeys: jest.fn(async () => new Set()),
  submitRadarReflection: jest.fn(),
  syncPendingRadarReflections: jest.fn(async () => ({ synced: 0, remaining: 0 })),
  recordRadarFieldView: jest.fn(),
  recordRadarMyPathIntent: jest.fn(),
  recordRadarPathIntent: jest.fn(),
  routeRadarCardIntent: jest.fn(),
  syncPendingRadarMyPathEvents: jest.fn(async () => ({ synced: 0, remaining: 0 })),
}));

jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "anonymous-user",
            is_anonymous: true,
            app_metadata: { provider: "anonymous" },
            identities: [],
          },
        },
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
});

test("does not reload saved reflections when unrelated renders keep the same cards", async () => {
  const field = {
    id: "field-1",
    slug: "ux-designer",
    color: "#3b82f6",
    emoji: "🎨",
    squad_url: null,
  };
  const cards = [
    {
      id: "card-1",
      kind: "hook",
      position: 1,
      content_th: { title: "งานออกแบบ" },
      content_en: null,
    },
  ];

  const view = render(
    <RadarFieldPageClient
      initialField={field as never}
      initialCards={cards as never}
    />
  );

  await waitFor(() =>
    expect(getSavedRadarReflectionChapterKeys).toHaveBeenCalledTimes(2)
  );

  view.rerender(
    <RadarFieldPageClient
      initialField={field as never}
      initialCards={cards as never}
    />
  );

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(getSavedRadarReflectionChapterKeys).toHaveBeenCalledTimes(2);
});
