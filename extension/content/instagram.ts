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

import { getBus, debugLog, isContextAlive } from "./bus";

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
    `${COMPOSER_PAGELET} div[contenteditable="true"][role="textbox"], div[contenteditable="true"][role="textbox"]`
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
  "about",
  "legal",
  "privacy",
]);

function handleFromPath(href: string): string | null {
  const match = href.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
  if (!match) return null;
  const handle = match[1];
  if (RESERVED_HANDLES.has(handle.toLowerCase())) return null;
  return handle;
}

/**
 * Instagram hashes every class name per build, but it labels its major panes
 * with `data-pagelet` and marks each message row with ARIA. Those two survive
 * the churn, so the whole reader is built on them and nothing else.
 */
const MESSAGE_LIST = '[data-pagelet="IGDMessagesList"]';
const COMPOSER_PAGELET = '[data-pagelet="IGDComposerForCannes"]';
/** Only inbound rows carry the lead's avatar link. This is the direction tell. */
const AVATAR_LINK = 'a[aria-label^="Open the profile page of"]';
/** The message body itself, as opposed to a reply quote or a timestamp. */
const MESSAGE_BODY = 'span[dir="auto"] > div[dir="auto"]';

function findMessageList(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>(MESSAGE_LIST);
}

/**
 * Resolves the lead's @handle from the open thread.
 *
 * Every inbound row repeats the handle in the avatar link's aria-label, so we
 * read it from the message list rather than the header: the header re-renders
 * on its own schedule and was blank half the time.
 */
function findPartnerHandle(doc: Document): { username: string | null; displayName: string | null } {
  const displayName = doc.querySelector("h2 span[title]")?.getAttribute("title")?.trim() || null;

  const avatar = doc.querySelector<HTMLAnchorElement>(`${MESSAGE_LIST} ${AVATAR_LINK}`);
  if (avatar) {
    const label = (avatar.getAttribute("aria-label") ?? "").replace(
      /^Open the profile page of\s*/i,
      ""
    );
    const username = handleFromPath(avatar.getAttribute("href") ?? "") ?? (label || null);
    if (username) return { username, displayName };
  }

  // Header fallback: the "View profile" link next to the thread title.
  const headerLink = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href^="/"][role="link"]'))
    .map((a) => handleFromPath(a.getAttribute("href") ?? ""))
    .find((handle): handle is string => Boolean(handle));
  if (headerLink) return { username: headerLink, displayName };

  debugLog("warn", "username_lookup_failed", {
    hasMessageList: Boolean(findMessageList(doc)),
    displayName,
  });
  return { username: null, displayName };
}

/**
 * Reads the rendered conversation.
 *
 * One `div[role="group"]` per message. Direction comes from the presence of
 * the lead's avatar link, which Instagram renders only beside their own
 * messages: geometry used to decide this, and it flipped whenever the pane
 * resized. System banners ("Auto-detected outcome") and timestamps live
 * outside the groups, so they never enter the transcript.
 */
function findMessages(doc: Document): ParsedMessage[] {
  const list = findMessageList(doc);
  if (!list) {
    debugLog("warn", "message_list_not_found", { pathname: location.pathname });
    return [];
  }

  const out: ParsedMessage[] = [];
  for (const row of Array.from(list.querySelectorAll<HTMLElement>('div[role="group"]'))) {
    // Reply quotes sit in the same row but have no `span[dir=auto]` wrapper,
    // which is what keeps the quoted text out of the body.
    const body = Array.from(row.querySelectorAll<HTMLElement>(MESSAGE_BODY))
      .map((node) => textOf(node))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!body) continue;
    out.push({
      direction: row.querySelector(AVATAR_LINK) ? "inbound" : "outbound",
      body: body.slice(0, 4000),
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
  let node: HTMLElement | null = findMessageList(doc);
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

  const observer = new MutationObserver(() => scheduleTick());
  let pending: number | null = null;

  /**
   * Instagram mutates the DOM continuously, and a scan walks every
   * `span > div` on the page. Coalesce a burst into one read, and shut the
   * whole thing down once the extension has been reloaded out from under us:
   * an orphaned observer would keep scanning this tab forever.
   */
  function scheduleTick(): void {
    if (!isContextAlive()) {
      observer.disconnect();
      if (pending !== null) clearTimeout(pending);
      getBus().ready.instagram = false;
      getBus().ready.tray = false;
      return;
    }
    if (pending !== null) return;
    pending = window.setTimeout(() => {
      pending = null;
      tick();
    }, 600);
  }

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("popstate", () => scheduleTick());
  window.addEventListener("hashchange", () => scheduleTick());
  // Heartbeat. Mutations are the fast path, but IG can settle into a state
  // where nothing mutates and we never noticed the thread finished loading.
  setInterval(() => scheduleTick(), 3000);

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
