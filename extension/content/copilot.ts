/**
 * Chip tray above Instagram's compose box.
 *
 * Listens to the snapshot stream from instagram.ts, calls /api/copilot/advise,
 * and renders the returned chips. A click pastes the body into IG's compose
 * box via the helper from instagram.ts. After the operator hits send in IG,
 * we POST to /api/copilot/log so the playbook log stays in sync.
 */

interface Snapshot {
  username: string | null;
  displayName: string | null;
  messages: { direction: "inbound" | "outbound"; body: string; sent_at: string }[];
  hasCompose: boolean;
}

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
  quickReplies: { id: string; label: string; tone: string; body: string }[];
}

interface LogResponse {
  ok: boolean;
  messageId: string | null;
}

declare global {
  interface Window {
    __psdmlpCopilot?: {
      pasteIntoCompose: (text: string) => boolean;
    };
  }
}

const tray = document.createElement("div");
tray.id = "psdmlp-copilot-tray";
tray.style.display = "none";
document.body.appendChild(tray);

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
  if (!window.__psdmlpCopilot?.pasteIntoCompose(body)) {
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
      renderEmpty("token หายหรือหมดอายุ — ไปที่ popup ของ extension แล้วใส่ใหม่");
      latestAdvise = null;
      return;
    }
    latestAdvise = response.data as AdviseResponse;
    renderAdvise(latestAdvise);
  } catch (error) {
    renderEmpty(error instanceof Error ? error.message : "advise_failed");
    latestAdvise = null;
  } finally {
    loadingAdvise = false;
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== "psdmlp.copilot.instagram") return;
  if (data.type === "snapshot") {
    latestSnapshot = data.snapshot as Snapshot;
    if (!latestSnapshot.username) {
      renderEmpty("ยังหา username ของน้องไม่เจอ — รอ IG โหลด header ให้เสร็จ");
      return;
    }
    if (!latestSnapshot.hasCompose) {
      renderEmpty("IG compose ยังโหลดไม่เสร็จ — รอสักครู่");
      return;
    }
    requestAdvise(latestSnapshot);
  }
});

chrome.runtime.sendMessage({ type: "copilot.tokenStatus" }, (status: { ok: boolean; hasToken: boolean } | undefined) => {
  if (!status?.hasToken) {
    renderEmpty("ใส่ token ใน extension popup ก่อนเริ่มใช้งาน");
  }
});
