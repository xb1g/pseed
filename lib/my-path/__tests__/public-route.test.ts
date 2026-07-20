import assert from "node:assert/strict";

import { isPublicRoute } from "../../../utils/supabase/public-routes";

test("My Path stays public while account-only routes remain protected", () => {
  assert.equal(isPublicRoute("/plan"), true);
  assert.equal(isPublicRoute("/plan?entry=tech-beyond-software"), true);
  assert.equal(isPublicRoute("/experimental-graphic"), true);
  assert.equal(isPublicRoute("/experimental-wall"), true);
  assert.equal(isPublicRoute("/classrooms"), false);
});

test("Parent payment surfaces stay public", () => {
  assert.equal(isPublicRoute("/pay/0123456789abcdef0123456789abcdef"), true);
  assert.equal(isPublicRoute("/api/trials/0123456789abcdef0123456789abcdef"), true);
  assert.equal(
    isPublicRoute("/api/trials/0123456789abcdef0123456789abcdef/slip"),
    true
  );
});
