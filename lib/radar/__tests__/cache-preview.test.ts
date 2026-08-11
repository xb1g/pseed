type UnstableCacheCall = [
  callback: (...args: never[]) => unknown,
  keyParts?: string[],
  options?: unknown,
];

async function captureRadarCacheKeys(preview: boolean): Promise<string[][]> {
  jest.resetModules();

  const unstableCache = jest.fn(
    (callback: (...args: never[]) => unknown) => callback
  );

  jest.doMock("server-only", () => ({}));
  jest.doMock("next/cache", () => ({ unstable_cache: unstableCache }));
  jest.doMock("@/lib/radar/preview", () => ({
    isRadarPreview: () => preview,
    radarReadClient: jest.fn(),
    wherePublished: <T>(query: T) => query,
  }));

  await import("../territory");
  await import("../server");

  return unstableCache.mock.calls.map(
    (call) => (call as UnstableCacheCall)[1] ?? []
  );
}

describe("Radar cache preview isolation", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("server-only");
    jest.dontMock("next/cache");
    jest.dontMock("@/lib/radar/preview");
  });

  it.each([false, true])(
    "includes preview=%s in every persisted cache key",
    async (preview) => {
      const keys = await captureRadarCacheKeys(preview);

      expect(keys).toEqual([
        ["radar-territory-v1", String(preview)],
        ["radar-skill-index-v1", String(preview)],
        ["published-radar-field-v6", String(preview)],
      ]);
    }
  );
});
