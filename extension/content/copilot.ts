/**
 * Chip tray above Instagram's compose box.
 *
 * Subscribes to the snapshot bus from instagram.ts, calls /api/copilot/advise,
 * and renders the returned chips. A click pastes the body into IG's compose
 * box via the helper from instagram.ts. After the operator hits send in IG,
 * we POST to /api/copilot/log so the playbook log stays in sync.
 */

import { getBus, debugLog, type ThreadSnapshot as Snapshot } from "./bus";

interface AdviseResponse {
  ok: boolean;
  conversationId: string | null;
  username: string | null;
  bucket: string;
  bucketLabel: string;
  coverage: "covered" | "uncovered" | "unknown";
  coverageOffer: string;
  rung: 1 | 2 | 3 | 4;
  windowMode: "standard" | "human_agent" | "closed";
  windowOpen: boolean;
  lastInboundAt: string | null;
  hasInbound: boolean;
  scripts: { id: string; label: string; rung: number; body: string }[];
  aiDrafts: { id: string; label: string; body: string }[];
  quickReplies: { id: string; label: string; tone: string; body: string }[];
}

interface LogResponse {
  ok: boolean;
  messageId: string | null;
}

const TRAY_ID = "psdmlp-copilot-tray";
// Reuse an existing tray so a manual re-injection does not stack two of them.
const tray = document.getElementById(TRAY_ID) ?? document.createElement("div");
tray.id = TRAY_ID;
tray.style.display = "none";
if (!tray.isConnected) document.body.appendChild(tray);

let latestSnapshot: Snapshot | null = null;
let latestAdvise: AdviseResponse | null = null;
let loadingAdvise = false;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function windowLabel(mode: AdviseResponse["windowMode"]): { text: string; cls: string } {
  if (mode === "standard") return { text: "window · <24h", cls: "psdmlp-ok" };
  if (mode === "human_agent") return { text: "window · 24h-7d", cls: "psdmlp-warn" };
  return { text: "window · closed", cls: "psdmlp-bad" };
}

function renderEmpty(reason: string): void {
  tray.innerHTML = `<div class="psdmlp-empty">${escapeHtml(reason)}</div>`;
  tray.style.display = "block";
}

function renderAdvise(data: AdviseResponse): void {
  const win = windowLabel(data.windowMode);
  const chips = data.quickReplies
    .slice(0, 4)
    .map(
      (chip) =>
        `<button class="psdmlp-chip psdmlp-${chip.tone}" data-reply-id="${escapeHtml(chip.id)}">${escapeHtml(chip.label)}</button>`
    )
    .join("");
  tray.innerHTML = `
    <header class="psdmlp-head">
      <span class="psdmlp-bucket">${escapeHtml(data.bucketLabel)}</span>
      <span class="psdmlp-coverage">${escapeHtml(data.coverageOffer)}</span>
      <span class="psdmlp-window ${win.cls}">${escapeHtml(win.text)}</span>
    </header>
    <div class="psdmlp-chips">${chips}</div>
    ${
      data.aiDrafts?.length
        ? `<div class="psdmlp-ai">
            <div class="psdmlp-ai-title">🤖 ตอบตามบทสนทนา</div>
            ${data.aiDrafts
              .map(
                (d) =>
                  `<button class="psdmlp-ai-draft" data-ai-id="${escapeHtml(d.id)}" title="${escapeHtml(d.body)}">
                     <span class="psdmlp-ai-label">${escapeHtml(d.label)}</span>
                     <span class="psdmlp-ai-body">${escapeHtml(d.body)}</span>
                   </button>`
              )
              .join("")}
          </div>`
        : ""
    }
    <details class="psdmlp-scripts">
      <summary>rung ${data.rung} · ${data.scripts.length} scripts</summary>
      <ol>
        ${data.scripts
          .map(
            (s) =>
              `<li><button data-script-id="${escapeHtml(s.id)}"><span class="psdmlp-rung">r${s.rung}</span> ${escapeHtml(s.label)}</button></li>`
          )
          .join("")}
      </ol>
    </details>
  `;
  tray.style.display = "block";

  tray.querySelectorAll<HTMLButtonElement>(".psdmlp-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.replyId;
      const reply = data.quickReplies.find((c) => c.id === id);
      if (!reply) return;
      pasteAndMaybeLog(reply.body, data);
    });
  });
  tray.querySelectorAll<HTMLButtonElement>(".psdmlp-ai-draft").forEach((button) => {
    button.addEventListener("click", () => {
      const draft = data.aiDrafts.find((d) => d.id === button.dataset.aiId);
      if (!draft) return;
      pasteAndMaybeLog(draft.body, data);
    });
  });
  tray.querySelectorAll<HTMLButtonElement>(".psdmlp-scripts button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.scriptId;
      const script = data.scripts.find((s) => s.id === id);
      if (!script) return;
      pasteAndMaybeLog(script.body, data);
    });
  });
}

function pasteAndMaybeLog(body: string, advise: AdviseResponse): void {
  if (!getBus().pasteIntoCompose?.(body)) {
    renderEmpty("Compose box ไม่พร้อม — รอ IG โหลดแชทให้เสร็จก่อน");
    return;
  }
  if (!advise.conversationId) {
    // Unknown lead — paste works, but we can't log into the playbook.
    return;
  }
  chrome.runtime.sendMessage(
    { type: "copilot.log", body: { conversationId: advise.conversationId, body, sentAt: new Date().toISOString() } },
    (response: LogResponse | undefined) => {
      if (!response?.ok) {
        console.warn("[copilot] log failed", response?.messageId);
      }
    }
  );
}

async function requestAdvise(snapshot: Snapshot): Promise<void> {
  if (loadingAdvise) return;
  loadingAdvise = true;
  try {
    const response = await chrome.runtime.sendMessage(
      { type: "copilot.advise", body: snapshot },
      undefined
    );
    if (!response || !response.ok) {
      // Surface the server's reason verbatim; "unknown" vs "expired" vs
      // "revoked" is the whole difference when a bearer stops working.
      const reason =
        (response?.data as { reason?: string } | null)?.reason ?? response?.error ?? "no_response";
      console.warn("[copilot] advise rejected", response?.status, reason);
      debugLog("error", "advise_rejected", { status: response?.status ?? 0, reason });
      renderEmpty(`advise ${response?.status ?? 0}: ${reason} — เช็ค token ใน popup`);
      latestAdvise = null;
      return;
    }
    latestAdvise = response.data as AdviseResponse;
    debugLog("info", "advise_ok", {
      bucket: latestAdvise.bucket,
      conversationId: latestAdvise.conversationId,
      chips: latestAdvise.quickReplies.length,
      scripts: latestAdvise.scripts.length,
    });
    renderAdvise(latestAdvise);
  } catch (error) {
    renderEmpty(error instanceof Error ? error.message : "advise_failed");
    latestAdvise = null;
  } finally {
    loadingAdvise = false;
  }
}

function handleSnapshot(snapshot: Snapshot): void {
  latestSnapshot = snapshot;
  if (!snapshot.messages.length) {
    debugLog("warn", "no_messages_parsed", { username: snapshot.username });
    renderEmpty("ยังอ่านข้อความในแชทไม่ได้ — เลื่อนแชทขึ้นลงสักครั้ง");
    return;
  }
  // A missing @handle is not fatal. The playbook runs off the messages; only
  // the stored lead context and the outbound log need a matched conversation.
  if (!snapshot.username) {
    debugLog("warn", "no_username_advising_anyway", { messages: snapshot.messages.length });
  }
  requestAdvise(snapshot);
}

if (!getBus().ready.tray) {
  getBus().ready.tray = true;
  getBus().onSnapshot(handleSnapshot);
  debugLog("info", "tray_content_script_loaded");
  chrome.runtime.sendMessage(
    { type: "copilot.tokenStatus" },
    (status: { ok: boolean; hasToken: boolean } | undefined) => {
      if (!status?.hasToken) {
        renderEmpty("ใส่ token ใน extension popup ก่อนเริ่มใช้งาน");
      }
    }
  );
}
