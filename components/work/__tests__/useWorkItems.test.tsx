import { act, renderHook, waitFor } from "@testing-library/react";

import type { WorkItem } from "@/lib/work/work-items";

import { useWorkItems } from "../useWorkItems";

const item: WorkItem = {
  id: "10000000-0000-4000-8000-000000000001",
  area: "marketing",
  kind: "content",
  title: "Portfolio Reel",
  description: "A specific hook",
  status: "idea",
  funnelStage: "tofu",
  channel: "instagram",
  offer: "both",
  ownerName: "Growth",
  dueOn: null,
  position: 10,
  details: { format: "Reel", cta: "Comment PORT" },
  createdBy: null,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

function response(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("useWorkItems", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("loads the shared rows and persists a status change", async () => {
    fetchMock
      .mockImplementationOnce(() => response({ items: [item] }))
      .mockImplementationOnce(() => response({ item: { ...item, status: "ready" } }));

    const { result } = renderHook(() => useWorkItems("marketing", []));
    await waitFor(() => expect(result.current.state).toBe("connected"));

    await act(async () => {
      await result.current.update({ id: item.id, status: "ready" });
    });

    expect(result.current.items[0].status).toBe("ready");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/work/items", expect.objectContaining({ method: "PATCH" }));
  });

  it("keeps seeded work visible but read-only until the migration is installed", async () => {
    fetchMock.mockImplementationOnce(() => response({ setupRequired: true }, 503));
    const { result } = renderHook(() => useWorkItems("marketing", [item]));

    await waitFor(() => expect(result.current.state).toBe("setup-required"));
    expect(result.current.items).toEqual([item]);
    expect(result.current.message).toMatch(/read-only/i);
  });

  it("restores the previous item when an optimistic update fails", async () => {
    fetchMock
      .mockImplementationOnce(() => response({ items: [item] }))
      .mockImplementationOnce(() => response({ error: "Save failed" }, 500));
    const { result } = renderHook(() => useWorkItems("marketing", []));
    await waitFor(() => expect(result.current.state).toBe("connected"));

    await expect(act(async () => {
      await result.current.update({ id: item.id, status: "ready" });
    })).rejects.toThrow("Save failed");
    expect(result.current.items[0].status).toBe("idea");
  });
});
