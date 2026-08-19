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

type ApiPath = "/api/copilot/advise" | "/api/copilot/log";

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
    typeof stored[STORAGE_KEY_API] === "string" && stored[STORAGE_KEY_API].startsWith("https://")
      ? stored[STORAGE_KEY_API]
      : DEFAULT_API_BASE;
  return { token, apiBase };
}

export async function apiCall<T>(path: ApiPath, body: unknown): Promise<ApiResult<T>> {
  const { token, apiBase } = await getConfig();
  if (!token) {
    return { ok: false, status: 401, data: null, error: "missing_token" };
  }
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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
  if (msg.type === "copilot.tokenStatus") {
    chrome.storage.local.get([STORAGE_KEY_TOKEN]).then((stored) => {
      const token = typeof stored[STORAGE_KEY_TOKEN] === "string" ? stored[STORAGE_KEY_TOKEN] : "";
      sendResponse({ ok: true, hasToken: token.startsWith("psdmlp_") });
    });
    return true;
  }
  return false;
});
