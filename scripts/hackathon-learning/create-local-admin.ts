/** Create a local-only admin user so the dashboard is viewable on local Supabase. */
import { createClient } from "@supabase/supabase-js";

const URL = "http://127.0.0.1:54321";
const KEY = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const EMAIL = process.env.ADMIN_EMAIL ?? "seedpassion@gmail.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "localdev123456";

async function main() {
  const supa = createClient(URL, KEY, { auth: { persistSession: false } });
  let userId: string | undefined;
  const created = await supa.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true });
  if (created.error) {
    if (!/already/i.test(created.error.message)) throw created.error;
    const { data } = await supa.auth.admin.listUsers();
    userId = data.users.find((u) => u.email === EMAIL)?.id;
  } else {
    userId = created.data.user?.id;
  }
  if (!userId) throw new Error("could not resolve user id");
  // ensure profile + admin role (best-effort; tables may vary)
  await supa.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  console.log(`✅ local admin ready: ${EMAIL} / ${PASSWORD}  (id ${userId})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
