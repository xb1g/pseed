"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  WorkArea,
  WorkItem,
  WorkItemInput,
  WorkItemPatch,
  WorkPersistenceState,
} from "@/lib/work/work-items";

type ApiError = { error?: string; code?: string; setupRequired?: boolean };

async function readResponse(response: Response) {
  return response.json().catch(() => ({})) as Promise<ApiError & { item?: WorkItem; items?: WorkItem[] }>;
}

export function useWorkItems(area: WorkArea, fallbackItems: WorkItem[]) {
  const [items, setItems] = useState(fallbackItems);
  const [state, setState] = useState<WorkPersistenceState>("loading");
  const [message, setMessage] = useState("Connecting to the shared workspace…");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setMessage("Connecting to the shared workspace…");
    try {
      const response = await fetch(`/api/work/items?area=${area}`, { cache: "no-store" });
      const body = await readResponse(response);
      if (!response.ok) {
        if (body.setupRequired) {
          setState("setup-required");
          setMessage("The workspace migration has not been applied. Preview data is read-only.");
          return;
        }
        if (response.status === 401) {
          setState("error");
          setMessage("Your session expired. Sign in again to edit shared work.");
          return;
        }
        if (response.status === 403) {
          setState("error");
          setMessage("This account no longer has access to the Work workspace.");
          return;
        }
        throw new Error(body.error || "Could not load shared work.");
      }
      setItems(body.items ?? []);
      setState("connected");
      setMessage("Saved to the shared workspace");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not load shared work.");
    }
  }, [area]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (input: WorkItemInput) => {
    setSavingId("new");
    try {
      const response = await fetch("/api/work/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await readResponse(response);
      if (!response.ok || !body.item) throw new Error(body.error || "Could not create this item.");
      setItems((current) => [...current, body.item as WorkItem].sort((a, b) => a.position - b.position));
      return body.item;
    } finally {
      setSavingId(null);
    }
  }, []);

  const update = useCallback(async (patch: WorkItemPatch) => {
    const previous = items;
    setSavingId(patch.id);
    setItems((current) => current.map((item) => item.id === patch.id ? { ...item, ...patch } : item));
    try {
      const response = await fetch("/api/work/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await readResponse(response);
      if (!response.ok || !body.item) throw new Error(body.error || "Could not save this item.");
      setItems((current) => current.map((item) => item.id === patch.id ? body.item as WorkItem : item));
      return body.item;
    } catch (error) {
      setItems(previous);
      throw error;
    } finally {
      setSavingId(null);
    }
  }, [items]);

  return { items, state, message, savingId, create, update, reload: load };
}
