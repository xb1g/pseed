import {
  toFlowEdges,
  toFlowNodes,
  type JourneyPreview,
} from "@/components/pathlab/journey-map-utils";

const preview: JourneyPreview = {
  map: { id: "map-1", title: "Map", description: null },
  nodes: [
    {
      id: "a",
      title: "Alpha",
      nodeType: "learning",
      spriteUrl: "/sprites/a.png",
      position: { x: 10, y: 20 },
      snippet: "first",
    },
    {
      id: "b",
      title: "Beta",
      nodeType: "end",
      spriteUrl: null,
      position: null,
      snippet: null,
    },
    {
      id: "c",
      title: "Gamma",
      nodeType: "learning",
      spriteUrl: null,
      position: null,
      snippet: null,
    },
  ],
  edges: [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
  ],
};

it("keeps stored positions and falls back to a wandering trail", () => {
  const nodes = toFlowNodes(preview, null);
  expect(nodes[0].position).toEqual({ x: 10, y: 20 });
  // Index 1: right lane; index 2: left lane, one step lower.
  expect(nodes[1].position).toEqual({ x: 180, y: 140 });
  expect(nodes[2].position).toEqual({ x: 0, y: 280 });
  expect(nodes.every((n) => n.draggable === false)).toBe(true);
});

it("marks only the selected node and shapes data for GameNode", () => {
  const nodes = toFlowNodes(preview, "b");
  expect(nodes.map((n) => n.data.selected)).toEqual([false, true, false]);
  expect(nodes[0].data).toMatchObject({
    id: "a",
    title: "Alpha",
    node_type: "learning",
    sprite_url: "/sprites/a.png",
    snippet: "first",
  });
});

it("maps edges with the dashed journey style", () => {
  const edges = toFlowEdges(preview);
  expect(edges).toHaveLength(2);
  expect(edges[0]).toMatchObject({ id: "e1", source: "a", target: "b" });
  expect(edges[0].style).toMatchObject({ strokeDasharray: "7 7" });
});
