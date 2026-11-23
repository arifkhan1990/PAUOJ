/**
 * Minimal dependency-free Chrome DevTools Protocol client for E2E scripts.
 * Launches headless Chrome with a throwaway profile and exposes one page
 * session (navigate, evaluate, waitFor, setCookie, close).
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function launchChrome({ chromeBin, baseUrl }) {
  const profile = mkdtempSync(join(tmpdir(), "pauoj-chrome-cdp-"));
  const proc = spawn(chromeBin, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore", detached: true });
  const kill = () => {
    try { process.kill(-proc.pid, "SIGKILL"); } catch { proc.kill("SIGKILL"); }
  };
  let spawnError = null;
  proc.once("error", (error) => { spawnError = error; });

  let port = "";
  for (let attempt = 0; attempt < 100 && !port; attempt += 1) {
    try {
      port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0].trim();
    } catch {
      await sleep(100);
    }
  }
  if (!port) {
    kill();
    rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    throw new Error(`could not start Chrome (${chromeBin}): ${spawnError?.message ?? "no DevTools port"}`);
  }

  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const entry = message.id ? pending.get(message.id) : null;
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  ws.addEventListener("close", () => {
    for (const entry of pending.values()) entry.reject(new Error("CDP connection closed"));
    pending.clear();
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP WebSocket connect timed out")), 10_000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP WebSocket error")); }, { once: true });
  });

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = (nextId += 1);
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  await send("Target.activateTarget", { targetId });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Network.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  // Keep the page focused in headless so autofocus/hydration timers behave.
  await send("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId);
  await send("Page.bringToFront", {}, sessionId);

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, description, timeout = 8_000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        if (await evaluate(expression)) return true;
      } catch {
        // The execution context is briefly unavailable while navigating.
      }
      await sleep(150);
    }
    throw new Error(`browser timed out waiting for ${description}`);
  };

  return {
    evaluate,
    waitFor,
    async setCookie(name, value) {
      const result = await send("Network.setCookie", { name, value, url: `${baseUrl}/` }, sessionId);
      if (result.success === false) throw new Error("CDP Network.setCookie was rejected");
    },
    async click(selector) {
      const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return null;
        element.scrollIntoView({ block: "center", inline: "center" });
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      if (!point) return false;
      const base = { x: point.x, y: point.y, button: "left", clickCount: 1 };
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }, sessionId);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", ...base }, sessionId);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...base }, sessionId);
      return true;
    },
    async navigate(url) {
      await send("Page.navigate", { url }, sessionId);
      await waitFor(
        `document.readyState === "complete" && location.href.startsWith(${JSON.stringify(url)})`,
        `page load ${url}`,
        15_000,
      );
    },
    async close() {
      try {
        ws.close();
      } catch {
        // Already closed.
      }
      kill();
      await new Promise((resolve) => {
        proc.once("exit", resolve);
        setTimeout(resolve, 2_000);
      });
      rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    },
  };
}
