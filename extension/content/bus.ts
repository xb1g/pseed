/**
 * Shared bus between the two content scripts.
 *
 * Both `instagram.ts` and `copilot.ts` run in the SAME isolated world, so a
 * plain object hung off `window` is the cheapest reliable channel between
 * them. The previous design used `window.postMessage`, which crosses into
 * Instagram's own page world: unreliable for same-world delivery and it
 * handed every DM we scraped to IG's page scripts. This does neither.
 *
 * Bundled into each content script (esbuild inlines it); the bus object
 * itself is created once, by whichever script touches it first.
 */

export interface ParsedMessage {
  direction: "inbound" | "outbound";
  body: string;
  sent_at: string;
}

export interface ThreadSnapshot {
  username: string | null;
  displayName: string | null;
  messages: ParsedMessage[];
  hasCompose: boolean;
}

export interface CopilotBus {
  /**
   * Which scripts already initialised in this tab. Manual injection from the
   * DevTools panel can land on a tab that already has them, and a second
   * MutationObserver or a second tray would double every event.
   */
  ready: { instagram?: boolean; tray?: boolean };
  /** Set by instagram.ts once its DOM helpers are ready. */
  pasteIntoCompose?: (text: string) => boolean;
  /** Last snapshot emitted, so a late subscriber is not stuck blank. */
  lastSnapshot: ThreadSnapshot | null;
  listeners: ((snapshot: ThreadSnapshot) => void)[];
  emit(snapshot: ThreadSnapshot): void;
  onSnapshot(listener: (snapshot: ThreadSnapshot) => void): void;
}

declare global {
  interface Window {
    __psdmlpCopilot?: CopilotBus;
  }
}

export function getBus(): CopilotBus {
  if (!window.__psdmlpCopilot) {
    window.__psdmlpCopilot = {
      ready: {},
      lastSnapshot: null,
      listeners: [],
      emit(snapshot) {
        this.lastSnapshot = snapshot;
        for (const listener of this.listeners) listener(snapshot);
      },
      onSnapshot(listener) {
        this.listeners.push(listener);
        if (this.lastSnapshot) listener(this.lastSnapshot);
      },
    };
  }
  return window.__psdmlpCopilot;
}

/**
 * False once the extension has been reloaded/updated while this tab kept the
 * old content script alive. Every `chrome.*` call then throws
 * "Extension context invalidated", so all of them are gated on this.
 */
export function isContextAlive(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

/** Debug event types the DevTools panel renders. */
export type DebugLevel = "info" | "warn" | "error";

/**
 * Ships one line to the background ring buffer for the DevTools panel. Fire
 * and forget: if the service worker is asleep or the panel was never opened,
 * this must never break the tray.
 */
export function debugLog(level: DebugLevel, event: string, detail?: unknown): void {
  if (!isContextAlive()) return;
  try {
    // MV3 sendMessage returns a promise when no callback is passed; an
    // unhandled rejection here surfaces in the page console as a red error.
    const sent = chrome.runtime.sendMessage({
      type: "copilot.debug",
      entry: {
        at: new Date().toISOString(),
        level,
        event,
        detail: detail === undefined ? null : JSON.parse(JSON.stringify(detail)),
        url: location.href,
      },
    });
    // A rejection means the worker was gone by the time it landed. Swallow it:
    // an unhandled rejection would surface as a red error in IG's console.
    if (sent && typeof sent.catch === "function") sent.catch(() => {});
  } catch {
    /* service worker asleep or context invalidated — nothing to do */
  }
}
