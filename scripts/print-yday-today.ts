/**
 * Reads the dump from dump-yday-today-dms.ts and prints each conversation's
 * thread in plain text for human review. No DB writes.
 */
import { readFileSync } from "fs";

const PATH = process.env.DUMP || "/tmp/dm-yday-today.json";
type Conv = any;
type Dump = { generated_at: string; window: { from: string; to: string }; conversations: Conv[] };

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // YYYY-MM-DD HH:MM UTC
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function printConvo(c: Conv) {
  console.log("=".repeat(78));
  console.log(
    `@${c.username ?? c.platform_user_id ?? c.id}  (${c.platform})  [stage=${c.stage ?? "?"}/status=${c.status ?? "?"}]`
  );
  console.log(
    `last_message_at=${fmtTime(c.last_message_at)} (${c.last_message_direction ?? "?"})  ` +
      `in=${c.inbound_count}  out=${c.outbound_count}  score=${c.lead_score ?? "?"}`
  );
  console.log(
    `wants_pathlab=${c.wants_pathlab}  wants_community=${c.wants_community}  ` +
      `wants_talent=${c.wants_talent}  pay_ready=${c.pathlab_pay_ready}`
  );
  console.log(`interests=${JSON.stringify(c.interests ?? null)}`);
  console.log(`classification=${JSON.stringify(c.classification ?? null)}`);
  if (c.admin_tags && c.admin_tags.length) console.log(`admin_tags=[${c.admin_tags.join(",")}]`);
  console.log(`created_at=${fmtTime(c.created_at)}`);
  console.log(`first_inbound=${fmtTime(c.first_inbound_at)}  last_inbound=${fmtTime(c.last_inbound_at)}  last_outbound=${fmtTime(c.last_outbound_at)}`);
  console.log("-".repeat(78));
  for (const m of c.messages) {
    const who = m.direction === "inbound" ? "LEAD " : "US   ";
    const status = m.send_status ? ` [${m.send_status}${m.delivered_at ? "/delivered" : ""}${m.read_at ? "/read" : ""}]` : "";
    const body = (m.body ?? "").replace(/\s+/g, " ").slice(0, 320);
    console.log(`${fmtTime(m.sent_at)}  ${who}${status}  ${body}`);
  }
  console.log();
}

function main() {
  const dump = JSON.parse(readFileSync(PATH, "utf8")) as Dump;
  console.log(`# generated_at=${dump.generated_at}`);
  console.log(`# window=${dump.window.from} -> ${dump.window.to}`);
  console.log(`# conversations=${dump.conversations.length}`);
  console.log();
  for (const c of dump.conversations) printConvo(c);
}

main();
