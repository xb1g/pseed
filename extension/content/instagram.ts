/**
 * Scans an Instagram DM thread and reports:
 *   - the partner's @handle (best effort from the visible header or DOM),
 *   - the ordered list of message bubbles with direction + timestamp,
 *   - whether the lead-side compose box is reachable.
 *
 * This file is the only one that touches IG's DOM. The copilot tray (separate
 * content script) subscribes through the shared isolated-world bus, so IG's
 * own page scripts never see what we scrape.
 */

import { getBus, debugLog } from "./bus";

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
const DM_THREAD_PATH = /^\/direct\/t\/([0-9]+)\/?/;
const DM_INBOX_PATH = /^\/direct\/inbox\/?/;

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

/** Paths that look like a username but are Instagram's own routes. */
const RESERVED_HANDLES = new Set([
  "direct",
  "explore",
  "reels",
  "stories",
  "accounts",
  "p",
  "your_activity",
  "legal",
  "about",
  "emails",
]);

function handleFromPath(href: string): string | null {
  const match = href.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
  if (!match?.[1]) return null;
  const handle = match[1].toLowerCase();
  return RESERVED_HANDLES.has(handle) ? null : handle;
}

/**
 * Instagram's profile-picture alt text carries the handle in every locale we
 * have seen: "kit_okarun's profile picture", "รูปโปรไฟล์ของ kit_okarun".
 * The handle is the only token that can't contain a space.
 */
function handleFromAlt(alt: string): string | null {
  const possessive = alt.match(/^([A-Za-z0-9._]{1,30})'s\s/);
  if (possessive?.[1]) return possessive[1].toLowerCase();
  const trailing = alt.match(/([A-Za-z0-9._]{2,30})\s*$/);
  if (trailing?.[1] && /[a-z0-9._]/i.test(trailing[1]) && !trailing[1].includes(" ")) {
    return trailing[1].toLowerCase();
  }
  return null;
}

/**
 * Resolves the lead's @handle from the open thread.
 *
 * IG's markup drifts constantly and the thread header is not a <header>
 * element, so this tries several independent reads in order of reliability
 * rather than trusting one selector. When every strategy fails it dumps the
 * candidates it saw to the DevTools panel, which is the only way to fix a
 * selector against a DOM we cannot see.
 */
function findPartnerHandle(doc: Document): { username: string | null; displayName: string | null } {
  // 1. A profile link anywhere in the upper strip of the thread pane. The
  //    header link is the topmost one; message-body mentions sit far lower.
  const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'));
  const topAnchors = anchors
    .map((a) => ({ a, top: a.getBoundingClientRect().top }))
    .filter(({ a, top }) => top >= 0 && top < 140 && handleFromPath(a.getAttribute("href") ?? ""))
    .sort((x, y) => x.top - y.top);
  if (topAnchors.length > 0) {
    const winner = topAnchors[0].a;
    return {
      username: handleFromPath(winner.getAttribute("href") ?? ""),
      displayName: textOf(winner) || null,
    };
  }

  // 2. The profile picture's alt text, which survives layouts where the
  //    header is a button rather than a link.
  const images = Array.from(doc.querySelectorAll<HTMLImageElement>("img[alt]"));
  for (const img of images) {
    const alt = img.getAttribute("alt") ?? "";
    if (!/profile picture|รูปโปรไฟล์/i.test(alt)) continue;
    if (img.getBoundingClientRect().top > 140) continue;
    const handle = handleFromAlt(alt);
    if (handle) return { username: handle, displayName: null };
  }

  // 3. Any profile link at all, if there is exactly one distinct candidate.
  const distinct = new Set(
    anchors.map((a) => handleFromPath(a.getAttribute("href") ?? "")).filter((h): h is string => Boolean(h))
  );
  if (distinct.size === 1) {
    const only = [...distinct][0];
    return { username: only, displayName: null };
  }

  debugLog("warn", "username_lookup_failed", {
    topAnchorCount: topAnchors.length,
    distinctHandles: [...distinct].slice(0, 10),
    profileImgAlts: images
      .map((img) => img.getAttribute("alt") ?? "")
      .filter((alt) => alt.length > 0 && alt.length < 120)
      .slice(0, 10),
    topAnchorHrefs: anchors
      .filter((a) => a.getBoundingClientRect().top < 140)
      .map((a) => a.getAttribute("href") ?? "")
      .slice(0, 15),
  });
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

function parseFromUrl(pathname: string): { username: string | null } {
  const match = pathname.match(DM_THREAD_PATH);
  if (!match) return { username: null };
  // Thread id is the Graph API conversation id, not the username. We only use
  // it as a presence check; the lead is identified by the header link.
  return { username: null };
}

export function readThreadSnapshot(
  doc: Document = document,
  pathname: string = location.pathname
): ThreadSnapshot {
  const urlMeta = parseFromUrl(pathname);
  const header = findPartnerHandle(doc);
  const messages = findMessages(doc);
  return {
    username: header.username ?? urlMeta.username,
    displayName: header.displayName,
    messages,
    hasCompose: Boolean(findComposeBox(doc)),
  };
}

// The tray calls this with the body only; bind the live document here.
getBus().pasteIntoCompose = (text: string) => pasteIntoCompose(document, text);

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

/**
 * Finds the element that actually scrolls the message list.
 *
 * Instagram virtualises the thread: only the rendered bubbles exist in the
 * DOM, so "read the conversation" means scrolling older messages into
 * existence first. We walk up from a bubble to the nearest ancestor with real
 * overflow rather than guessing at a class name.
 */
function findScrollContainer(doc: Document): HTMLElement | null {
  const bubble = doc.querySelector<HTMLElement>('div[role="row"], [data-testid="message-bubble"]');
  let node: HTMLElement | null = bubble?.parentElement ?? null;
  while (node && node !== doc.body) {
    const style = getComputedStyle(node);
    const scrollable = /(auto|scroll)/.test(`${style.overflowY}${style.overflow}`);
    if (scrollable && node.scrollHeight > node.clientHeight + 40) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Scrolls the thread up until Instagram stops rendering older messages.
 *
 * Capped on both passes and wall-clock: a two-year-old thread would otherwise
 * spin for minutes and the drafting model only reads the last 40 messages
 * anyway. Returns how many messages ended up visible.
 */
export async function loadOlderMessages(doc: Document = document, maxPasses = 25): Promise<number> {
  const container = findScrollContainer(doc);
  if (!container) {
    debugLog("warn", "history_no_scroll_container");
    return findMessages(doc).length;
  }

  const startedAt = Date.now();
  let seen = findMessages(doc).length;
  let stagnant = 0;

  for (let pass = 0; pass < maxPasses && stagnant < 3; pass += 1) {
    if (Date.now() - startedAt > 20_000) break;
    container.scrollTop = 0;
    await new Promise((resolve) => setTimeout(resolve, 400));
    const count = findMessages(doc).length;
    stagnant = count > seen ? 0 : stagnant + 1;
    seen = Math.max(seen, count);
  }

  // Put the operator back at the newest message, where they were.
  container.scrollTop = container.scrollHeight;
  debugLog("info", "history_loaded", { messages: seen, elapsedMs: Date.now() - startedAt });
  return seen;
}

let lastKey = "";

/**
 * Re-reads the thread when anything meaningful changed. IG is a SPA whose DOM
 * churns constantly, so we key on the path plus what we actually extracted;
 * keying on href alone missed every in-place thread update.
 */
function tick(force = false) {
  const pathname = location.pathname;
  if (!DM_THREAD_PATH.test(pathname) && !DM_INBOX_PATH.test(pathname)) {
    if (force) debugLog("warn", "not_a_dm_path", { pathname });
    return;
  }
  const snap = readThreadSnapshot(document, pathname);
  const key = `${pathname}|${snap.username ?? ""}|${snap.messages.length}|${snap.hasCompose}`;
  if (!force && key === lastKey) return;
  lastKey = key;
  debugLog("info", "snapshot", {
    pathname,
    username: snap.username,
    displayName: snap.displayName,
    messages: snap.messages.length,
    hasCompose: snap.hasCompose,
  });
  getBus().emit(snap);
}

// Guarded so a manual re-injection from the DevTools panel cannot stack a
// second observer on a tab that already has one.
if (!getBus().ready.instagram) {
  getBus().ready.instagram = true;

  const observer = new MutationObserver(() => tick());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("popstate", () => tick());
  window.addEventListener("hashchange", () => tick());

  // The DevTools panel can force a re-read when IG's DOM settled after our
  // last mutation batch.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "copilot.rescan") {
      tick(true);
      sendResponse({ ok: true, snapshot: getBus().lastSnapshot });
      return true;
    }
    if (msg?.type === "copilot.loadHistory") {
      loadOlderMessages().then((messages) => {
        tick(true);
        sendResponse({ ok: true, messages });
      });
      return true;
    }
    return false;
  });

  debugLog("info", "instagram_content_script_loaded", { pathname: location.pathname });
  tick(true);
}
