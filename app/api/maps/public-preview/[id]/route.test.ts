/** @jest-environment node */

import { GET } from "@/app/api/maps/public-preview/[id]/route";
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));

const mockedCreateClient = jest.mocked(createClient);

const DEMO_ID = "00000000-0000-0000-0000-000000000020";

function supabaseReturning(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  mockedCreateClient.mockReturnValue({ from } as never);
  return { from, select, eq, single };
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

const dbMap = {
  id: DEMO_ID,
  title: "Startup Founder PathLab",
  description: "ลองเป็นผู้ก่อตั้งสตาร์ทอัพ 5 วัน",
  map_nodes: [
    {
      id: "node-1",
      title: "หาปัญหา",
      sprite_url: "/sprites/island.png",
      node_type: "learning",
      metadata: { position: { x: 0, y: 0 } },
      node_paths_source: [{ id: "path-1", destination_node_id: "node-2" }],
      node_content: [
        { content_type: "text", content_body: "  <p>สัมภาษณ์</p>\n<strong>คนจริง 3 คน</strong>  " },
      ],
    },
    {
      id: "node-2",
      title: "สรุปอินไซต์",
      sprite_url: null,
      node_type: "end",
      metadata: null,
      node_paths_source: [],
      node_content: [],
    },
  ],
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  jest.clearAllMocks();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

it("404s for a non-allowlisted map id without touching Supabase", async () => {
  supabaseReturning({ data: dbMap, error: null });
  const res = await GET(new Request("http://localhost"), paramsFor("not-allowed"));
  expect(res.status).toBe(404);
  expect(mockedCreateClient).not.toHaveBeenCalled();
});

it("500s gracefully when Supabase env vars are missing", async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await GET(new Request("http://localhost"), paramsFor(DEMO_ID));
  expect(res.status).toBe(500);
  expect(mockedCreateClient).not.toHaveBeenCalled();
});

it("returns flattened nodes and edges for the allowlisted map", async () => {
  supabaseReturning({ data: dbMap, error: null });
  const res = await GET(new Request("http://localhost"), paramsFor(DEMO_ID));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.map).toEqual({
    id: DEMO_ID,
    title: "Startup Founder PathLab",
    description: "ลองเป็นผู้ก่อตั้งสตาร์ทอัพ 5 วัน",
  });
  expect(body.nodes).toEqual([
    {
      id: "node-1",
      title: "หาปัญหา",
      nodeType: "learning",
      spriteUrl: "/sprites/island.png",
      position: { x: 0, y: 0 },
      snippet: "สัมภาษณ์ คนจริง 3 คน",
    },
    {
      id: "node-2",
      title: "สรุปอินไซต์",
      nodeType: "end",
      spriteUrl: null,
      position: null,
      snippet: null,
    },
  ]);
  expect(body.edges).toEqual([
    { id: "path-1", source: "node-1", target: "node-2" },
  ]);
});

it("404s when the map does not exist", async () => {
  supabaseReturning({ data: null, error: { code: "PGRST116" } });
  const res = await GET(new Request("http://localhost"), paramsFor(DEMO_ID));
  expect(res.status).toBe(404);
});
