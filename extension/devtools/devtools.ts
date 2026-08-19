/**
 * DevTools entry point. Its only job is to register the panel; everything
 * interesting lives in panel.ts.
 */

chrome.devtools.panels.create("DM Copilot", "", "devtools/panel.html", () => {
  /* panel created */
});
