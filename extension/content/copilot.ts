/**
 * Chip tray above Instagram's compose box.
 *
 * Subscribes to the snapshot bus from instagram.ts, calls /api/copilot/advise,
 * and renders the returned chips. A click pastes the body into IG's compose
 * box via the helper from instagram.ts. After the operator hits send in IG,
 * we POST to /api/copilot/log so the playbook log stays in sync.
 */

import { getBus, debugLog, isContextAlive, type ThreadSnapshot as Snapshot } from "./bus";

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
// Deliberately not hidden here: a second injection would otherwise hide the
// tray the first injection is still driving, and never show it again.
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

/**
 * Instagram re-renders its whole pane often enough to detach anything we
 * appended, so every paint re-checks that the tray is still in the document.
 */
function showTray(): void {
  if (!tray.isConnected) document.body.appendChild(tray);
  tray.style.display = "block";
}

function renderEmpty(reason: string): void {
  tray.innerHTML = `<div class="psdmlp-empty">${escapeHtml(reason)}</div>`;
  showTray();
}

function renderAdvise(data: AdviseResponse): void {
  showTray();
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
  if (!isContextAlive()) {
    renderEmpty("extension ถูก reload — refresh หน้า IG หนึ่งครั้ง");
    return;
  }
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
      if (chrome.runtime.lastError) return;
      if (!response?.ok) {
        console.warn("[copilot] log failed", response?.messageId);
      }
    }
  );
}

type AdviseEnvelope = { ok?: boolean; status?: number; error?: string; data?: unknown };

async function sendAdvise(snapshot: Snapshot, includeDrafts: boolean): Promise<AdviseEnvelope | null> {
  const response = (await chrome.runtime.sendMessage({
    type: "copilot.advise",
    body: { ...snapshot, includeDrafts },
  })) as AdviseEnvelope | undefined;
  return response ?? null;
}

/**
 * Two phases, because the LLM drafter takes ten-plus seconds and the
 * deterministic chips take under one. Phase one renders the playbook; phase
 * two folds in the free-form drafts when they land. Both are discarded if the
 * operator moved to another thread in the meantime.
 */
async function requestAdvise(snapshot: Snapshot): Promise<void> {
  if (!isContextAlive()) {
    renderEmpty("extension ถูก reload — refresh หน้า IG หนึ่งครั้ง");
    return;
  }
  if (loadingAdvise) {
    // Drop the signature so the state we are skipping gets picked up by the
    // next snapshot instead of being treated as already advised.
    advisedSignature = "";
    return;
  }
  loadingAdvise = true;
  const requestedPath = location.pathname;
  if (!latestAdvise) renderEmpty("กำลังอ่านแชท…");

  try {
    const response = await sendAdvise(snapshot, false);
    if (location.pathname !== requestedPath) return;
    if (!response || !response.ok) {
      // Surface the server's reason verbatim; "unknown" vs "expired" vs
      // "revoked" is the whole difference when a bearer stops working.
      const reason =
        (response?.data as { reason?: string } | null)?.reason ?? response?.error ?? "no_response";
      console.warn("[copilot] advise rejected", response?.status, reason);
      debugLog("error", "advise_rejected", { status: response?.status ?? 0, reason });
      renderEmpty(`advise ${response?.status ?? 0}: ${reason} — เช็ค token ใน popup`);
      latestAdvise = null;
      advisedSignature = "";
      return;
    }

    const advise = response.data as AdviseResponse;
    latestAdvise = advise;
    debugLog("info", "advise_ok", {
      bucket: advise.bucket,
      conversationId: advise.conversationId,
      chips: advise.quickReplies.length,
      scripts: advise.scripts.length,
    });
    renderAdvise(advise);
    void requestDrafts(snapshot, advise, requestedPath);
  } catch (error) {
    renderEmpty(error instanceof Error ? error.message : "advise_failed");
    latestAdvise = null;
    advisedSignature = "";
  } finally {
    loadingAdvise = false;
  }
}

/** Phase two: the model's drafts, folded into the tray already on screen. */
async function requestDrafts(
  snapshot: Snapshot,
  advise: AdviseResponse,
  requestedPath: string
): Promise<void> {
  try {
    const response = await sendAdvise(snapshot, true);
    if (!response?.ok) return;
    if (location.pathname !== requestedPath) return;
    // Another advise landed while we waited: its drafts are the current ones.
    if (latestAdvise !== advise) return;
    const drafts = (response.data as AdviseResponse).aiDrafts ?? [];
    if (drafts.length === 0) return;
    latestAdvise = { ...advise, aiDrafts: drafts };
    debugLog("info", "drafts_ok", { drafts: drafts.length });
    renderAdvise(latestAdvise);
  } catch {
    /* drafts are additive; the chips already rendered */
  }
}

/** Thread the last successful advise belongs to, so we know when to reset. */
let advisedPath = "";
/** What the thread looked like then, so IG's re-renders do not re-ask the LLM. */
let advisedSignature = "";

/**
 * Identifies a conversation state. Two snapshots with the same signature
 * deserve the same advice, so the second one is dropped.
 *
 * Deliberately ignores the message count: virtualisation adds and drops older
 * bubbles constantly, and re-asking the model because IG recycled a row three
 * screens up is pure noise. The newest message is what advice turns on.
 */
function signatureOf(snapshot: Snapshot): string {
  const last = snapshot.messages[snapshot.messages.length - 1];
  return `${last?.direction ?? ""}|${last?.body.slice(0, 120) ?? ""}`;
}

function handleSnapshot(snapshot: Snapshot): void {
  latestSnapshot = snapshot;
  // IG detaches whatever it does not own when it re-renders the pane. Re-attach
  // before deciding anything, or an early return leaves the tray orphaned and
  // the operator sees it flash once and disappear.
  if (latestAdvise && !tray.isConnected) showTray();
  const path = location.pathname;
  if (path !== advisedPath) {
    // Moved to another thread: whatever is on screen belongs to the old one.
    advisedPath = "";
    advisedSignature = "";
    latestAdvise = null;
  }

  if (!snapshot.messages.length) {
    debugLog("warn", "no_messages_parsed", { username: snapshot.username });
    // IG blanks the message list mid-render. Tearing down a good tray for one
    // empty frame is what made the chips flash and vanish, so hold what we
    // have and wait for the next snapshot.
    if (latestAdvise) return;
    renderEmpty("ยังอ่านข้อความในแชทไม่ได้ — เลื่อนแชทขึ้นลงสักครั้ง");
    return;
  }

  const signature = signatureOf(snapshot);
  if (latestAdvise && signature === advisedSignature) {
    showTray();
    return;
  }
  advisedPath = path;
  advisedSignature = signature;
  // A missing @handle is not fatal. The playbook runs off the messages; only
  // the stored lead context and the outbound log need a matched conversation.
  if (!snapshot.username) {
    debugLog("warn", "no_username_advising_anyway", { messages: snapshot.messages.length });
  }
  requestAdvise(snapshot);
}

if (!getBus().ready.tray && isContextAlive()) {
  getBus().ready.tray = true;

  // Watchdog: IG owns the DOM and will happily drop a node it did not create,
  // so re-attach on a timer instead of relying on a snapshot arriving.
  const watchdog = setInterval(() => {
    if (!isContextAlive()) {
      clearInterval(watchdog);
      return;
    }
    if (latestAdvise && !tray.isConnected) showTray();
  }, 2000);

  getBus().onSnapshot(handleSnapshot);
  debugLog("info", "tray_content_script_loaded");
  chrome.runtime.sendMessage(
    { type: "copilot.tokenStatus" },
    (status: { ok: boolean; hasToken: boolean } | undefined) => {
      if (chrome.runtime.lastError) return;
      if (!status?.hasToken) {
        renderEmpty("ใส่ token ใน extension popup ก่อนเริ่มใช้งาน");
      }
    }
  );
}
