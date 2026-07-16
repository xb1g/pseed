import assert from "node:assert/strict";
import test from "node:test";

import { isPublicRoute } from "../../../utils/supabase/public-routes";

test("My Path stays public while account-only routes remain protected", () => {
  assert.equal(isPublicRoute("/plan"), true);
  assert.equal(isPublicRoute("/plan?entry=tech-beyond-software"), true);
  assert.equal(isPublicRoute("/classrooms"), false);
});
