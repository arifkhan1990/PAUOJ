/**
 * Browser (CDP) checks for the private-plan note UI. Runs against the plan
 * created by the API phase, with the owner's session cookie injected via CDP.
 */
import { launchChrome } from "./chrome-cdp.mjs";
import { BASE_URL, CHROME_BIN, assert, pass, sleep, state } from "./shared.mjs";

export async function stepBrowser(rakib, { slug, note }) {
  state.chrome = await launchChrome({ chromeBin: CHROME_BIN, baseUrl: BASE_URL });
  const chrome = state.chrome;
  await chrome.setCookie("pauoj_session", rakib);
  await chrome.navigate(`${BASE_URL}/lists/${slug}`);
  await chrome.waitFor(`(() => {
    const trigger = document.querySelector('button[aria-label^="Edit note for"][aria-expanded]');
    return Boolean(trigger && trigger.getBoundingClientRect().width > 0);
  })()`, "the compact note trigger", 15_000);

  const compact = await chrome.evaluate(`(() => {
    const trigger = document.querySelector('button[aria-label^="Edit note for"][aria-expanded]');
    if (!trigger) return null;
    const row = trigger.closest("li");
    const rect = trigger.getBoundingClientRect();
    const wideRow = [...document.querySelectorAll("button, a, div")].some((element) =>
      (element.textContent || "").trim() === "Add note" && element.getBoundingClientRect().width > window.innerWidth * 0.6);
    return { tag: trigger.tagName, width: rect.width, rowWidth: row ? row.getBoundingClientRect().width : 0,
      expanded: trigger.getAttribute("aria-expanded"), wideRow };
  })()`);
  assert(compact, "compact note trigger not found");
  assert(compact.tag === "BUTTON", "note trigger must be a button");
  assert(compact.width > 0 && compact.width < 220, `note trigger is not compact (${compact.width}px)`);
  assert(compact.rowWidth > 0 && compact.width < compact.rowWidth * 0.5, "note trigger spans most of the problem row");
  assert(compact.expanded === "false", "note trigger should start collapsed");
  assert(!compact.wideRow, "found a full-width Add note row");
  pass("note action is a compact collapsed trigger (no full-width row)");

  let editorState = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    editorState = await chrome.evaluate(`(() => {
      const area = document.querySelector("textarea");
      if (area) return { open: true, focused: document.activeElement === area };
      const trigger = document.querySelector('button[aria-label^="Edit note for"][aria-expanded]');
      return { open: false, expanded: trigger?.getAttribute("aria-expanded") };
    })()`);
    if (editorState.open) break;
    // A real mouse click drives focus + React handlers once hydration finishes.
    if (attempt < 20) await chrome.click('button[aria-label^="Edit note for"][aria-expanded]');
    else await chrome.evaluate(`document.querySelector('button[aria-label^="Edit note for"][aria-expanded]')?.click()`);
    await sleep(attempt < 20 ? 250 : 500);
  }
  const diagnostics = await chrome.evaluate(`(() => ({
    focused: document.hasFocus(),
    textareas: document.querySelectorAll("textarea").length,
    rowTriggers: document.querySelectorAll('button[aria-label^="Edit note for"][aria-expanded]').length,
    failedResources: performance.getEntriesByType("resource").filter((entry) => entry.responseStatus >= 400).map((entry) => entry.name).slice(0, 5),
  }))()`);
  assert(editorState?.open,
    `inline note editor did not open after clicking the note action (state: ${JSON.stringify(editorState)}; page: ${JSON.stringify(diagnostics)})`);

  const editor = await chrome.evaluate(`(() => {
    const area = document.querySelector("textarea");
    const trigger = document.querySelector('button[aria-label^="Edit note for"][aria-expanded]');
    const panel = trigger?.getAttribute("aria-controls");
    return { value: area?.value, expanded: trigger?.getAttribute("aria-expanded"), controls: panel,
      linked: Boolean(panel && document.getElementById(panel)?.contains(area)),
      focused: document.activeElement === area, ariaBusy: area?.closest("[aria-busy]")?.getAttribute("aria-busy") };
  })()`);
  assert(editor.focused || !(await chrome.evaluate("document.hasFocus()")), "inline note editor textarea is not focused");
  assert(editor.value === note, "inline note editor did not load the saved note");
  assert(editor.expanded === "true", "note trigger aria-expanded did not become true");
  assert(editor.linked, "note panel is not linked from the trigger via aria-controls");
  assert(editor.ariaBusy === "false", "note editor should not be busy");

  await chrome.evaluate(`(() => {
    const panel = document.querySelector("textarea")?.closest("div[id]");
    [...(panel?.querySelectorAll("button") ?? [])].find((button) => button.textContent.trim() === "Cancel")?.click();
  })()`);
  await chrome.waitFor(`!document.querySelector("textarea")`, "the note editor to close");
  if (await chrome.evaluate("document.hasFocus()")) {
    await chrome.waitFor(
      `document.activeElement === document.querySelector('button[aria-label^="Edit note for"][aria-expanded]')`,
      "focus to return to the note trigger",
    );
  }
  const expanded = await chrome.evaluate(
    `document.querySelector('button[aria-label^="Edit note for"][aria-expanded]')?.getAttribute("aria-expanded")`,
  );
  assert(expanded === "false", "aria-expanded did not reset after Cancel");

  pass("clicking the note action opens the inline editor (saved note loaded) and Cancel closes it");
  await chrome.close();
  state.chrome = null;
}
