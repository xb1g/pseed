/**
 * Background service worker.
 *
 * Holds the bearer token (chrome.storage.local), wraps fetch with the right
 * Authorization header, and persists last_used_at to /api/copilot/advise +
 * /api/copilot/log responses (the API touches the row server-side; this layer
 * exists so the UI never sees the token in a tab it can screenshot).
 *
 * MV3 service workers are event-driven and short-lived, so we keep no state
 * across events beyond storage. The token and API base URL live there.
 */

const STORAGE_KEY_TOKEN = "psdmlp.copilot.token";
const STORAGE_KEY_API = "psdmlp.copilot.apiBase";
const DEFAULT_API_BASE = "https://www.passionseed.org";

/**
 * The API base must be https in production. We also allow a loopback origin so
 * the extension can be pointed at `pnpm dev` before the routes ship.
 */
function isAllowedApiBase(value: string): boolean {
  if (value.startsWith("https://")) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(value.replace(/\/$/, ""));
}


type ApiPath = "/api/copilot/advise" | "/api/copilot/log" | "/api/copilot/ping";

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

async function getConfig(): Promise<{ token: string; apiBase: string }> {
  const stored = await chrome.storage.local.get([STORAGE_KEY_TOKEN, STORAGE_KEY_API]);
  const token = typeof stored[STORAGE_KEY_TOKEN] === "string" ? stored[STORAGE_KEY_TOKEN] : "";
  const apiBase =
    typeof stored[STORAGE_KEY_API] === "string" && isAllowedApiBase(stored[STORAGE_KEY_API])
      ? stored[STORAGE_KEY_API]
      : DEFAULT_API_BASE;
  return { token, apiBase };
}

export async function apiCall<T>(path: ApiPath, body: unknown): Promise<ApiResult<T>> {
  const { token, apiBase } = await getConfig();
  if (!token) {
    return { ok: false, status: 401, data: null, error: "missing_token" };
  }
  // `ping` is a GET probe; the other two post a payload.
  const isProbe = path === "/api/copilot/ping";
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method: isProbe ? "GET" : "POST",
      headers: isProbe
        ? { Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: isProbe ? undefined : JSON.stringify(body),
      credentials: "omit",
    });
    let payload: T | null = null;
    try {
      payload = (await res.json()) as T;
    } catch {
      payload = null;
    }
    return { ok: res.ok, status: res.status, data: payload, error: res.ok ? undefined : "request_failed" };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "network_error",
    };
  }
}

/**
 * Ring buffer of debug events for the DevTools panel.
 *
 * MV3 workers are killed between events, so the buffer lives in
 * `chrome.storage.session` — it survives worker restarts but dies with the
 * browser session, which is exactly right for debug output containing DM
 * metadata.
 */
const DEBUG_KEY = "psdmlp.copilot.debug";
const DEBUG_CAP = 300;

interface DebugEntry {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  detail: unknown;
  url?: string;
  tabId?: number;
}

async function pushDebug(entry: DebugEntry): Promise<void> {
  const stored = await chrome.storage.session.get([DEBUG_KEY]);
  const log: DebugEntry[] = Array.isArray(stored[DEBUG_KEY]) ? stored[DEBUG_KEY] : [];
  log.push(entry);
  await chrome.storage.session.set({ [DEBUG_KEY]: log.slice(-DEBUG_CAP) });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "copilot.debug" && msg.entry) {
    // A content script knows its tab from the sender; the DevTools panel has
    // to tell us, so only override when the sender actually is a tab.
    const entry = msg.entry as DebugEntry;
    pushDebug(sender.tab?.id === undefined ? entry : { ...entry, tabId: sender.tab.id }).then(() =>
      sendResponse({ ok: true })
    );
    return true;
  }
  if (msg?.type === "copilot.debugRead") {
    chrome.storage.session.get([DEBUG_KEY]).then((stored) => {
      sendResponse({ ok: true, log: Array.isArray(stored[DEBUG_KEY]) ? stored[DEBUG_KEY] : [] });
    });
    return true;
  }
  if (msg?.type === "copilot.debugClear") {
    chrome.storage.session.remove([DEBUG_KEY]).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === "copilot.config") {
    getConfig().then(({ token, apiBase }) =>
      sendResponse({ ok: true, apiBase, hasToken: token.startsWith("psdmlp_"), tokenLength: token.length })
    );
    return true;
  }
  return false;
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;
  if (msg.type === "copilot.advise") {
    apiCall("/api/copilot/advise", msg.body).then(sendResponse);
    return true;
  }
  if (msg.type === "copilot.log") {
    apiCall("/api/copilot/log", msg.body).then(sendResponse);
    return true;
  }
  if (msg.type === "copilot.ping") {
    apiCall("/api/copilot/ping", null).then(sendResponse);
    return true;
  }
  if (msg.type === "copilot.tokenStatus") {
    chrome.storage.local.get([STORAGE_KEY_TOKEN]).then((stored) => {
      const token = typeof stored[STORAGE_KEY_TOKEN] === "string" ? stored[STORAGE_KEY_TOKEN] : "";
      sendResponse({ ok: true, hasToken: token.startsWith("psdmlp_") });
    });
    return true;
  }
  return false;
});

const DM_TAB_PATTERN = "https://www.instagram.com/direct/*";

/**
 * Puts the content scripts into DM tabs that Chrome will not inject on its own.
 *
 * Two cases, both of which used to require the operator to reload something:
 * installing or updating the extension leaves already-open tabs scriptless,
 * and Instagram's client-side routing into /direct/ is not a navigation, so
 * the manifest match never fires. Both scripts are idempotent.
 */
async function injectInto(tabId: number): Promise<void> {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content/style.css"] });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/instagram.js", "content/copilot.js"],
    });
  } catch {
    /* tab closed, or a page we are not allowed on */
  }
}

async function injectIntoOpenThreads(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: DM_TAB_PATTERN });
  await Promise.all(tabs.map((tab) => (tab.id === undefined ? null : injectInto(tab.id))));
}

chrome.runtime.onInstalled.addListener(() => {
  void injectIntoOpenThreads();
});

chrome.runtime.onStartup.addListener(() => {
  void injectIntoOpenThreads();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url?.startsWith("https://www.instagram.com/direct/")) return;
  void injectInto(tabId);
});
