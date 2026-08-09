/**
 * @jest-environment node
 *
 * Lobby RLS — cross-lobby isolation.
 * =================================
 *
 * The load-bearing guarantee of the lobby feature: a student in lobby A must
 * never read the progress of a student in lobby B, even on the same map.
 *
 * These tests are the defense against a cross-lobby data leak, so unlike the
 * sibling RLS suite they FAIL rather than skip when the database is
 * unreachable — a silently-skipped security test is worse than no test.
 *
 * Requires a reachable Postgres via SUPABASE_DB_URL. All fixtures are created
 * and rolled back inside a transaction. Never point this at production.
 */

import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

let client: Client;
let connectError: string | null = null;

beforeAll(async () => {
  client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
  } catch (e) {
    connectError = (e as Error).message;
  }
});

afterAll(async () => {
  if (!connectError) await client.end();
});

/** Create an auth user + profile. profiles.username is NOT NULL and
 *  profiles.id has an FK to auth.users, so both rows are required. */
const createUser = async (email: string, fullName: string): Promise<string> => {
  const { rows } = await client.query(
    `INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, 'authenticated', 'authenticated', $2, 'x', now(), now())
     RETURNING id`,
    [NIL_UUID, email]
  );
  const id = rows[0].id as string;
  await client.query(
    `INSERT INTO profiles (id, username, full_name) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [id, email.split("@")[0], fullName]
  );
  return id;
};

/** Assume a user's identity for subsequent RLS checks in this transaction. */
const actAs = async (userId: string): Promise<void> => {
  await client.query(
    `SELECT set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)`,
    [userId]
  );
};

describe("lobby RLS", () => {
  test("database is reachable", () => {
    expect(connectError).toBeNull();
  });

  test("shares_lobby_with is SECURITY DEFINER with a pinned search_path", async () => {
    const { rows } = await client.query(`
      SELECT p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'shares_lobby_with'
    `);

    expect(rows).toHaveLength(1);
    // SECURITY DEFINER breaks the RLS recursion; the pinned search_path stops
    // that elevated context from being a privilege-escalation vector.
    expect(rows[0].prosecdef).toBe(true);
    expect(rows[0].proconfig).toContain("search_path=public");
  });

  test("the lobbymate progress policy is SELECT-only", async () => {
    const { rows } = await client.query(`
      SELECT polcmd FROM pg_policy
      WHERE polrelid = 'public.student_node_progress'::regclass
        AND polname = 'Lobbymates can view progress'
    `);

    expect(rows).toHaveLength(1);
    // 'r' = SELECT. Anything else would let a student write another's progress.
    expect(rows[0].polcmd).toBe("r");
  });

  test("a student cannot see the progress of someone in a different lobby", async () => {
    await client.query("BEGIN");
    try {
      const studentA = await createUser("rls_a@test.local", "Student A");
      const studentB = await createUser("rls_b@test.local", "Student B");

      const { rows: mapRows } = await client.query(
        "INSERT INTO learning_maps (title) VALUES ('RLS Cross Map') RETURNING id"
      );
      const mapId = mapRows[0].id;

      const { rows: nodeRows } = await client.query(
        "INSERT INTO map_nodes (map_id, title) VALUES ($1, 'Node 1') RETURNING id",
        [mapId]
      );
      const nodeId = nodeRows[0].id;

      const { rows: lobbyA } = await client.query(
        "INSERT INTO map_lobbies (map_id, name) VALUES ($1, 'Lobby A') RETURNING id",
        [mapId]
      );
      const { rows: lobbyB } = await client.query(
        "INSERT INTO map_lobbies (map_id, name) VALUES ($1, 'Lobby B') RETURNING id",
        [mapId]
      );

      await client.query(
        "INSERT INTO lobby_members (lobby_id, user_id) VALUES ($1, $2)",
        [lobbyA[0].id, studentA]
      );
      await client.query(
        "INSERT INTO lobby_members (lobby_id, user_id) VALUES ($1, $2)",
        [lobbyB[0].id, studentB]
      );
      await client.query(
        "INSERT INTO student_node_progress (user_id, node_id, status) VALUES ($1, $2, 'in_progress')",
        [studentB, nodeId]
      );

      await actAs(studentA);
      const { rows } = await client.query(
        "SELECT public.shares_lobby_with($1::uuid, $2::uuid) AS shares",
        [studentB, mapId]
      );

      expect(rows[0].shares).toBe(false);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("a student CAN see the progress of a lobbymate", async () => {
    await client.query("BEGIN");
    try {
      const studentA = await createUser("rls_c@test.local", "Student C");
      const studentB = await createUser("rls_d@test.local", "Student D");

      const { rows: mapRows } = await client.query(
        "INSERT INTO learning_maps (title) VALUES ('RLS Same Map') RETURNING id"
      );
      const mapId = mapRows[0].id;

      const { rows: lobby } = await client.query(
        "INSERT INTO map_lobbies (map_id, name) VALUES ($1, 'Shared Lobby') RETURNING id",
        [mapId]
      );

      await client.query(
        "INSERT INTO lobby_members (lobby_id, user_id) VALUES ($1, $2), ($1, $3)",
        [lobby[0].id, studentA, studentB]
      );

      await actAs(studentA);
      const { rows } = await client.query(
        "SELECT public.shares_lobby_with($1::uuid, $2::uuid) AS shares",
        [studentB, mapId]
      );

      expect(rows[0].shares).toBe(true);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("join_lobby_by_code reports closed and invalid codes identically", async () => {
    await client.query("BEGIN");
    try {
      const joiner = await createUser("rls_join@test.local", "Joiner");

      const { rows: mapRows } = await client.query(
        "INSERT INTO learning_maps (title) VALUES ('Closed Map') RETURNING id"
      );
      const { rows: lobby } = await client.query(
        "INSERT INTO map_lobbies (map_id, name, is_open) VALUES ($1, 'Closed', false) RETURNING join_code",
        [mapRows[0].id]
      );

      await actAs(joiner);

      // Each attempt runs inside its own savepoint: a raised exception aborts
      // the surrounding transaction, so without this the second probe would
      // report "current transaction is aborted" instead of the app's message.
      const attemptJoin = async (joinCode: string): Promise<string | null> => {
        await client.query("SAVEPOINT probe");
        try {
          await client.query("SELECT public.join_lobby_by_code($1)", [joinCode]);
          await client.query("RELEASE SAVEPOINT probe");
          return null;
        } catch (e) {
          await client.query("ROLLBACK TO SAVEPOINT probe");
          return (e as Error).message;
        }
      };

      const closedError = await attemptJoin(lobby[0].join_code);
      const invalidError = await attemptJoin("ZZZZZZ");

      expect(closedError).toBeTruthy();
      // Identical messages: the form must not become an oracle for guessing
      // which codes exist.
      expect(closedError).toBe(invalidError);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("joining creates membership and enrollment atomically", async () => {
    await client.query("BEGIN");
    try {
      const joiner = await createUser("rls_atomic@test.local", "Atomic Joiner");

      const { rows: mapRows } = await client.query(
        "INSERT INTO learning_maps (title) VALUES ('Open Map') RETURNING id"
      );
      const mapId = mapRows[0].id;
      const { rows: lobby } = await client.query(
        "INSERT INTO map_lobbies (map_id, name) VALUES ($1, 'Open Lobby') RETURNING id, join_code",
        [mapId]
      );

      await actAs(joiner);
      await client.query("SELECT public.join_lobby_by_code($1)", [
        lobby[0].join_code,
      ]);

      const { rows: membership } = await client.query(
        "SELECT count(*)::int AS n FROM lobby_members WHERE lobby_id = $1 AND user_id = $2",
        [lobby[0].id, joiner]
      );
      const { rows: enrollment } = await client.query(
        "SELECT count(*)::int AS n FROM user_map_enrollments WHERE user_id = $1 AND map_id = $2 AND lobby_id = $3",
        [joiner, mapId, lobby[0].id]
      );

      expect(membership[0].n).toBe(1);
      expect(enrollment[0].n).toBe(1);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("no enrollment is left without a lobby after the backfill", async () => {
    const { rows } = await client.query(
      "SELECT count(*)::int AS orphaned FROM user_map_enrollments WHERE lobby_id IS NULL"
    );

    // The invariant the whole RLS design rests on: every enrollment has exactly
    // one lobby, so the progress policy needs no null-lobby escape hatch.
    expect(rows[0].orphaned).toBe(0);
  });
});
