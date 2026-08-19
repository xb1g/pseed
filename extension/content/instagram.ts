/**
 * Scans an Instagram DM thread and reports:
 *   - the partner's @handle (best effort from the visible header or DOM),
 *   - the ordered list of message bubbles with direction + timestamp,
 *   - whether the lead-side compose box is reachable.
 *
 * This file is the only one that touches IG's DOM. The copilot tray (separate
 * content script) reads what this file posts via window messages, so we never
 * read IG's selectors from React/Vue land.
 */

interface ParsedMessage {
  direction: "inbound" | "outbound";
  body: string;
  sent_at: string;
}

interface ThreadSnapshot {
  /** Best-effort partner @handle, lowercased without the leading @. */
  username: string | null;
  /** Visible display name from the chat header, when we can resolve it. */
  displayName: string | null;
  /** Inbound + outbound messages, oldest first. */
  messages: ParsedMessage[];
  /** True if we can find an active compose box on the page. */
  hasCompose: boolean;
}

/** Instagram routes its DM inbox through `reactroot` and a handful of role labels. */
const DM_URL_PATTERN = /^\/direct\/t\/([0-9]+)\/?/;

function textOf(node: Element | null): string {
  if (!node) return "";
  return (node.textContent ?? "").trim();
}

function findComposeBox(doc: Document): HTMLElement | null {
  // Instagram's compose is a contenteditable div inside the active thread. The
  // aria-label drifts across builds; we look for any contenteditable with role
  // textbox or an empty state, then narrow.
  const candidates = doc.querySelectorAll<HTMLElement>(
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"][aria-label*="essage" i]'
  );
  for (const node of candidates) {
    if (node.offsetParent !== null) return node;
  }
  return null;
}

function findPartnerHandle(doc: Document): { username: string | null; displayName: string | null } {
  // The thread header is a single link to /<username>/. Most reliable on the
  // web client; if missing we fall back to text content.
  const headerAnchors = doc.querySelectorAll<HTMLAnchorElement>('header a[href^="/"]');
  for (const a of headerAnchors) {
    const href = a.getAttribute("href") ?? "";
    const match = href.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
    if (match && match[1] && !["direct", "explore", "reels", "stories"].includes(match[1])) {
      return { username: match[1].toLowerCase(), displayName: textOf(a) || null };
    }
  }
  return { username: null, displayName: null };
}

function findMessages(doc: Document): ParsedMessage[] {
  // Each message lives inside a div with one of these roles. The text container
  // exposes its direction via the surrounding data-testid attribute on newer
  // builds and via position on older ones.
  const bubbles = Array.from(
    doc.querySelectorAll<HTMLElement>(
      '[data-testid="message-bubble"], div[role="row"] div[dir="auto"]'
    )
  );
  const out: ParsedMessage[] = [];
  for (const bubble of bubbles) {
    const text = (bubble.textContent ?? "").trim();
    if (!text) continue;
    // Outbound messages appear right-aligned in a flex column; we read the
    // computed alignment to decide direction. Cheap and version-tolerant.
    const rect = bubble.getBoundingClientRect();
    const parent = bubble.parentElement;
    const parentWidth = parent?.getBoundingClientRect().width ?? window.innerWidth;
    const alignment = rect.left > parentWidth / 2 ? "outbound" : "inbound";
    out.push({
      direction: alignment,
      body: text.slice(0, 4000),
      sent_at: new Date().toISOString(),
    });
  }
  return out;
}

function parseFromUrl(url: string): { username: string | null } {
  const match = url.match(DM_URL_PATTERN);
  if (!match) return { username: null };
  // Thread id is the Graph API conversation id, not the username. We only use
  // it as a presence check; the lead is identified by the header link.
  return { username: null };
}

export function readThreadSnapshot(doc: Document = document, href: string = location.href): ThreadSnapshot {
  const urlMeta = parseFromUrl(href);
  const header = findPartnerHandle(doc);
  const messages = findMessages(doc);
  return {
    username: header.username ?? urlMeta.username,
    displayName: header.displayName,
    messages,
    hasCompose: Boolean(findComposeBox(doc)),
  };
}

// Expose the paste helper on window so the tray content script can call it
// without crossing script boundaries. Same realm, so this is a thin pointer.
declare global {
  interface Window {
    __psdmlpCopilot?: {
      pasteIntoCompose: (text: string) => boolean;
    };
  }
}
// The tray calls this with the body only; bind the live document here.
window.__psdmlpCopilot = { pasteIntoCompose: (text: string) => pasteIntoCompose(document, text) };

export function pasteIntoCompose(doc: Document, text: string): boolean {
  const compose = findComposeBox(doc);
  if (!compose) return false;
  compose.focus();
  // Selection API paste works for IG's contenteditable; insertText preserves
  // any emoji / Thai text that document.execCommand("insertText", …) used to.
  const sel = doc.getSelection();
  if (!sel || sel.rangeCount === 0) {
    compose.textContent = text;
  } else {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(doc.createTextNode(text));
    range.collapse(false);
  }
  compose.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
  return true;
}

let lastHref = "";

function tick() {
  const href = location.href;
  if (href === lastHref) return;
  lastHref = href;
  if (!DM_URL_PATTERN.test(href) && !/^\/direct\/inbox\//.test(href)) return;
  const snap = readThreadSnapshot(document, href);
  window.postMessage({ source: "psdmlp.copilot.instagram", type: "snapshot", snapshot: snap }, "*");
}

const observer = new MutationObserver(() => tick());
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener("popstate", tick);
window.addEventListener("hashchange", tick);
tick();
