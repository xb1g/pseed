/**
 * DevTools panel for the DM Copilot.
 *
 * The tray lives inside Instagram's DOM, where a failure is invisible: no
 * username parsed, no compose box, a rejected bearer, all look identical from
 * the page. This panel reads the background ring buffer so every step of the
 * pipeline is on screen, and can force a rescan of the inspected tab.
 */

interface DebugEntry {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  detail: unknown;
  url?: string;
  tabId?: number;
}

interface ConfigResponse {
  ok: boolean;
  apiBase: string;
  hasToken: boolean;
  tokenLength: number;
}

const logBody = document.getElementById("log") as HTMLTableSectionElement;
const statusGrid = document.getElementById("status") as HTMLDivElement;
const emptyEl = document.getElementById("empty") as HTMLDivElement;
const autoEl = document.getElementById("auto") as HTMLInputElement;

const tabId = chrome.devtools.inspectedWindow.tabId;

/**
 * Last transport-level failure, rendered in the status grid.
 *
 * A DevTools panel keeps running against the extension it was loaded from, so
 * reloading the extension makes every `sendMessage` throw
 * "Extension context invalidated" synchronously. That must show up as a
 * message telling the operator to reopen DevTools, not as an uncaught error
 * that kills the panel.
 */
let transportError: string | null = null;

function send<T>(message: unknown): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response: T) => {
        // Reading lastError suppresses the "unchecked runtime.lastError" noise
        // when the worker is asleep; a missing response is handled by callers.
        const runtimeError = chrome.runtime.lastError;
        transportError = runtimeError ? runtimeError.message ?? "runtime error" : null;
        resolve(response);
      });
    } catch (error) {
      transportError = error instanceof Error ? error.message : String(error);
      resolve(undefined);
    }
  });
}

function cell(key: string, value: string, cls = ""): string {
  return `<div class="cell"><div class="k">${key}</div><div class="v ${cls}">${value}</div></div>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Latest value of each interesting event, so the header shows current state. */
function summarize(log: DebugEntry[]): Record<string, DebugEntry | undefined> {
  const last: Record<string, DebugEntry | undefined> = {};
  for (const entry of log) last[entry.event] = entry;
  return last;
}

async function renderStatus(log: DebugEntry[]): Promise<void> {
  const config = await send<ConfigResponse>({ type: "copilot.config" });
  const last = summarize(log);
  const snap = last.snapshot?.detail as
    | { username?: string; messages?: number; hasCompose?: boolean; pathname?: string }
    | undefined;
  const advise = last.advise_ok?.detail as { bucket?: string; conversationId?: string } | undefined;
  const rejected = last.advise_rejected?.detail as { status?: number; reason?: string } | undefined;

  const banner = transportError
    ? cell(
        "extension link",
        escapeHtml(
          /invalidated/i.test(transportError)
            ? "extension reloaded — ปิดแล้วเปิด DevTools ใหม่"
            : transportError
        ),
        "lvl-error"
      )
    : "";

  statusGrid.innerHTML = [
    banner,
    cell("API base", escapeHtml(config?.apiBase ?? "?")),
    cell(
      "token",
      config?.hasToken ? `ok (${config.tokenLength} chars)` : "missing",
      config?.hasToken ? "lvl-info" : "lvl-error"
    ),
    cell(
      "content scripts",
      last.instagram_content_script_loaded ? (last.tray_content_script_loaded ? "both loaded" : "tray missing") : "not loaded",
      last.instagram_content_script_loaded && last.tray_content_script_loaded ? "lvl-info" : "lvl-error"
    ),
    cell("path", escapeHtml(snap?.pathname ?? "—")),
    cell("username", escapeHtml(snap?.username ?? "—"), snap?.username ? "lvl-info" : "lvl-warn"),
    cell("messages", String(snap?.messages ?? 0)),
    cell("compose box", snap?.hasCompose ? "found" : "not found", snap?.hasCompose ? "lvl-info" : "lvl-warn"),
    cell(
      "last advise",
      advise ? escapeHtml(advise.bucket ?? "ok") : rejected ? `${rejected.status}: ${escapeHtml(rejected.reason ?? "")}` : "—",
      advise ? "lvl-info" : rejected ? "lvl-error" : ""
    ),
  ].join("");
}

function renderLog(log: DebugEntry[]): void {
  emptyEl.hidden = log.length > 0;
  logBody.innerHTML = log
    .slice()
    .reverse()
    .map((entry) => {
      const time = entry.at.slice(11, 19);
      const detail = entry.detail === null ? "" : JSON.stringify(entry.detail);
      return `<tr>
        <td>${time}</td>
        <td class="lvl-${entry.level}">${escapeHtml(entry.event)}</td>
        <td class="detail">${escapeHtml(detail)}</td>
      </tr>`;
    })
    .join("");
}

async function refresh(): Promise<void> {
  const response = await send<{ ok: boolean; log: DebugEntry[] }>({ type: "copilot.debugRead" });
  // Only this tab's events; a second IG tab would otherwise interleave.
  const log = (response?.log ?? []).filter((e) => e.tabId === undefined || e.tabId === tabId);
  renderLog(log);
  await renderStatus(log);
}

/**
 * Chrome injects content scripts only on navigation, so a tab that was open
 * before the extension was installed or reloaded has none. Rather than making
 * the operator guess, inject them on demand. Both scripts are idempotent.
 */
document.getElementById("inject")!.addEventListener("click", async () => {
  try {
    transportError = null;
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content/style.css"] });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/instagram.js", "content/copilot.js"],
    });
  } catch (error) {
    await send({
      type: "copilot.debug",
      entry: {
        at: new Date().toISOString(),
        level: "error",
        event: "inject_failed",
        detail: { message: error instanceof Error ? error.message : String(error) },
        tabId,
      },
    });
  }
  window.setTimeout(refresh, 300);
});

document.getElementById("rescan")!.addEventListener("click", () => {
  try {
    chrome.tabs.sendMessage(tabId, { type: "copilot.rescan" }, () => {
      // No receiver means the content scripts are not in this tab yet — the
      // status grid already says so, and "Inject scripts" is the fix.
      const runtimeError = chrome.runtime.lastError;
      transportError = runtimeError ? runtimeError.message ?? "runtime error" : null;
      window.setTimeout(refresh, 250);
    });
  } catch (error) {
    transportError = error instanceof Error ? error.message : String(error);
    void refresh();
  }
});

document.getElementById("ping")!.addEventListener("click", async () => {
  const result = await send<{ ok: boolean; status: number; data: unknown; error?: string }>({
    type: "copilot.ping",
  });
  await send({
    type: "copilot.debug",
    entry: {
      at: new Date().toISOString(),
      level: result?.ok ? "info" : "error",
      event: result?.ok ? "ping_ok" : "ping_failed",
      detail: result?.ok ? result.data : { status: result?.status ?? 0, error: result?.error, data: result?.data },
      tabId,
    },
  });
  await refresh();
});

/**
 * Scrolls the thread back until IG stops rendering older messages, so the
 * drafting model sees the conversation rather than the last screenful.
 */
document.getElementById("history")!.addEventListener("click", () => {
  const button = document.getElementById("history") as HTMLButtonElement;
  button.disabled = true;
  button.textContent = "loading…";
  try {
    chrome.tabs.sendMessage(tabId, { type: "copilot.loadHistory" }, () => {
      const runtimeError = chrome.runtime.lastError;
      transportError = runtimeError ? runtimeError.message ?? "runtime error" : null;
      button.disabled = false;
      button.textContent = "Load full history";
      void refresh();
    });
  } catch (error) {
    transportError = error instanceof Error ? error.message : String(error);
    button.disabled = false;
    button.textContent = "Load full history";
    void refresh();
  }
});

document.getElementById("clear")!.addEventListener("click", async () => {
  await send({ type: "copilot.debugClear" });
  await refresh();
});

window.setInterval(() => {
  if (autoEl.checked) void refresh().catch(() => { /* rendered via transportError */ });
}, 1500);

void refresh().catch(() => { /* rendered via transportError */ });
