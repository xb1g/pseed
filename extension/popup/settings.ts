/**
 * Settings popup script. Bundled separately so the popup can be loaded as a
 * plain HTML+TS bundle without a service worker round-trip.
 */

const STORAGE_KEY_TOKEN = "psdmlp.copilot.token";
const STORAGE_KEY_API = "psdmlp.copilot.apiBase";
const DEFAULT_API_BASE = "https://www.passionseed.org";


const tokenEl = document.getElementById("token") as HTMLInputElement;
const apiEl = document.getElementById("api") as HTMLSelectElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const testBtn = document.getElementById("test") as HTMLButtonElement;
const clearBtn = document.getElementById("clear") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

function setStatus(message: string, kind: "ok" | "bad"): void {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "bad");
  statusEl.classList.add(kind);
  statusEl.hidden = false;
}

async function loadFromStorage(): Promise<void> {
  const stored = await chrome.storage.local.get([STORAGE_KEY_TOKEN, STORAGE_KEY_API]);
  tokenEl.value = typeof stored[STORAGE_KEY_TOKEN] === "string" ? stored[STORAGE_KEY_TOKEN] : "";
  // An unrecognised stored value (an old hand-typed base) falls back to prod
  // rather than leaving the select showing something it cannot represent.
  const savedBase = stored[STORAGE_KEY_API];
  const known = Array.from(apiEl.options).some((option) => option.value === savedBase);
  apiEl.value = known ? (savedBase as string) : DEFAULT_API_BASE;
}

saveBtn.addEventListener("click", async () => {
  const token = tokenEl.value.trim();
  const apiBase = apiEl.value || DEFAULT_API_BASE;
  if (!token.startsWith("psdmlp_")) {
    setStatus("token ต้องขึ้นต้นด้วย psdmlp_", "bad");
    return;
  }
  await chrome.storage.local.set({
    [STORAGE_KEY_TOKEN]: token,
    [STORAGE_KEY_API]: apiBase,
  });
  setStatus("saved", "ok");
});

/**
 * Turns the API's machine reason into something the operator can act on.
 * These are the only four `verifyCopilotToken` can return.
 */
function explainReason(reason: string): string {
  if (reason === "unknown") return "token นี้ไม่มีในระบบ — copy ไม่ครบ? mint ใหม่ที่ /admin/dm-leads/copilot";
  if (reason === "expired") return "token หมดอายุแล้ว — mint ใหม่";
  if (reason === "revoked") return "token ถูก revoke ไปแล้ว — mint ใหม่";
  if (reason === "malformed" || reason === "missing_bearer") return "token ผิดรูปแบบ — ต้องขึ้นต้นด้วย psdmlp_";
  return reason;
}

/**
 * Probes /api/copilot/ping with whatever is typed in the fields right now, so
 * a bad paste can be caught before it is saved.
 */
testBtn.addEventListener("click", async () => {
  const token = tokenEl.value.trim();
  const apiBase = (apiEl.value || DEFAULT_API_BASE).replace(/\/$/, "");
  setStatus("testing…", "ok");
  try {
    const res = await fetch(`${apiBase}/api/copilot/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
    });
    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; reason?: string; name?: string; expiresAt?: string }
      | null;
    if (res.ok && payload?.ok) {
      const until = payload.expiresAt ? new Date(payload.expiresAt).toLocaleDateString() : "?";
      setStatus(`ok · ${payload.name ?? "token"} · หมดอายุ ${until}`, "ok");
      return;
    }
    setStatus(`${res.status}: ${explainReason(payload?.reason ?? "no_reason")}`, "bad");
  } catch (error) {
    // A network-layer throw here means the API base is wrong or the server is
    // down — it never means the token is bad.
    setStatus(
      `ต่อ ${apiBase} ไม่ได้: ${error instanceof Error ? error.message : "network error"}`,
      "bad"
    );
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove([STORAGE_KEY_TOKEN, STORAGE_KEY_API]);
  tokenEl.value = "";
  apiEl.value = DEFAULT_API_BASE;
  setStatus("cleared", "ok");
});

loadFromStorage().catch(() => setStatus("storage unavailable", "bad"));
