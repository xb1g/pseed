import {
  isWorkspaceTableMissing,
  workItemInputSchema,
  workItemPatchSchema,
} from "../work-items";

describe("work item validation", () => {
  it("accepts complete marketing content", () => {
    const result = workItemInputSchema.safeParse({
      area: "marketing",
      kind: "content",
      title: "Parent objection reel",
      description: "A concrete hook",
      status: "idea",
      funnelStage: "bofu",
      channel: "both",
      offer: "shift",
      ownerName: "Growth",
      dueOn: "2026-09-10",
      position: 10,
      details: { format: "Reel", cta: "Comment PORT" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects content that cannot be routed through the funnel", () => {
    const result = workItemInputSchema.safeParse({
      area: "marketing",
      kind: "content",
      title: "Unrouted idea",
      description: "No stage or channel",
      status: "idea",
      ownerName: "Growth",
      position: 10,
      details: {},
    });

    expect(result.success).toBe(false);
  });

  it("limits updates to editable fields", () => {
    const result = workItemPatchSchema.safeParse({
      id: "10000000-0000-4000-8000-000000000001",
      createdBy: "someone-else",
      status: "published",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({
      id: "10000000-0000-4000-8000-000000000001",
      status: "published",
    });
  });

  it("recognizes the missing-migration database response", () => {
    expect(isWorkspaceTableMissing({ code: "42P01", message: "relation does not exist" })).toBe(true);
    expect(isWorkspaceTableMissing({ code: "42501", message: "permission denied" })).toBe(false);
  });
});
