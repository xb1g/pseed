import { FIELDS } from "@/lib/content/pathlab-page";
import { PathlabFieldsClient } from "./PathlabFieldsClient";

/**
 * "สายที่เปิดในตอนนี้" — the paths currently open.
 *
 * The copy stays server-side and is handed to the client component, which
 * owns only the open/closed state. The artwork is pre-cut to a shared
 * 876x1171 frame, so the cards need no fit correction; they simply fill.
 */
export function PathlabFields() {
  return <PathlabFieldsClient fields={FIELDS} />;
}
