/**
 * Settings popup script. Bundled separately so the popup can be loaded as a
 * plain HTML+TS bundle without a service worker round-trip.
 */

const STORAGE_KEY_TOKEN = "psdmlp.copilot.token";
const STORAGE_KEY_API = "psdmlp.copilot.apiBase";
const DEFAULT_API_BASE = "https://www.passionseed.org";

const tokenEl = document.getElementById("token") as HTMLInputElement;
const apiEl = document.getElementById("api") as HTMLInputElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
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
  apiEl.value =
    typeof stored[STORAGE_KEY_API] === "string" && stored[STORAGE_KEY_API]
      ? stored[STORAGE_KEY_API]
      : DEFAULT_API_BASE;
}

saveBtn.addEventListener("click", async () => {
  const token = tokenEl.value.trim();
  const apiBase = apiEl.value.trim() || DEFAULT_API_BASE;
  if (!token.startsWith("psdmlp_")) {
    setStatus("token ต้องขึ้นต้นด้วย psdmlp_", "bad");
    return;
  }
  if (!apiBase.startsWith("https://")) {
    setStatus("API base ต้องเป็น https://", "bad");
    return;
  }
  await chrome.storage.local.set({
    [STORAGE_KEY_TOKEN]: token,
    [STORAGE_KEY_API]: apiBase,
  });
  setStatus("saved", "ok");
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove([STORAGE_KEY_TOKEN, STORAGE_KEY_API]);
  tokenEl.value = "";
  apiEl.value = DEFAULT_API_BASE;
  setStatus("cleared", "ok");
});

loadFromStorage().catch(() => setStatus("storage unavailable", "bad"));
