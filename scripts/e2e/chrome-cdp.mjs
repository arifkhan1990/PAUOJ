/**
 * Minimal dependency-free Chrome DevTools Protocol client for E2E scripts.
 * Launches headless Chrome with a throwaway profile and exposes one page
 * session (navigate, evaluate, waitFor, setCookie, close).
 *
 * Launch is retried once with a fresh profile. Failures carry Chrome's exit
 * status and stderr tail so a CI failure is diagnosable instead of a bare
 * "no DevTools port".
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LAUNCH_ATTEMPTS = 2;
const LAUNCH_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 100;
const STDERR_TAIL_CHARS = 8 * 1024;

const CHROME_FLAGS = [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--disable-dev-shm-usage",
  "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1",
  // Keep headless Chrome from doing profile/first-run/background work that can
  // delay (or silently skip) DevToolsActivePort on loaded CI runners.
  "--disable-background-networking", "--disable-sync", "--metrics-recording-only",
  "--no-service-autorun", "--password-store=basic", "--use-mock-keychain",
];

class ChromeLaunchError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message);
    this.name = "ChromeLaunchError";
    this.retryable = retryable;
  }
}

/** Bounded stderr buffer; the stream must stay drained or Chrome blocks on a full pipe. */
function createStderrTail(limit = STDERR_TAIL_CHARS) {
  let text = "";
  return {
    push(chunk) { text = (text + chunk).slice(-limit); },
    text() { return text; },
    lastLines(count = 8) {
      return text.trim().split("\n").map((line) => line.trimEnd()).filter(Boolean).slice(-count).join("\n");
    },
  };
}

function readDevToolsPortFile(profile) {
  try {
    const [portLine = "", pathLine = ""] = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n");
    const port = portLine.trim();
    if (!port) return null;
    const path = pathLine.trim();
    return { port, wsUrl: path.startsWith("/") ? `ws://127.0.0.1:${port}${path}` : null };
  } catch {
    return null;
  }
}

function launchFailure(reason, { chromeBin, exitInfo, spawnError, stderr }) {
  const details = [reason];
  if (spawnError) details.push(`spawn error: ${spawnError.message}`);
  if (exitInfo) {
    const signal = exitInfo.signal ? `, signal ${exitInfo.signal}` : "";
    details.push(`exit code ${exitInfo.code ?? "null"}${signal}`);
  }
  const stderrTail = stderr.lastLines();
  if (stderrTail) details.push(`last stderr:\n${stderrTail}`);
  return new ChromeLaunchError(`could not start Chrome (${chromeBin}): ${details.join("; ")}`, {
    retryable: spawnError?.code !== "ENOENT" && spawnError?.code !== "EACCES",
  });
}

/**
 * Wait for DevToolsActivePort (or the stderr "DevTools listening" line as a
 * fallback). Throws as soon as Chrome exits so the caller sees the real cause.
 */
async function waitForDevTools({ chromeBin, profile, stderr, exitState, spawnState }) {
  const deadline = Date.now() + LAUNCH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const portFile = readDevToolsPortFile(profile);
    if (portFile) return portFile;
    const listening = /DevTools listening on (ws:\/\/\S+)/.exec(stderr.text());
    if (listening) return { wsUrl: listening[1] };
    if (spawnState.value) {
      throw launchFailure("Chrome could not be spawned", { chromeBin, spawnError: spawnState.value, exitInfo: exitState.value, stderr });
    }
    if (exitState.value) {
      throw launchFailure("Chrome exited before DevTools became available", {
        chromeBin, exitInfo: exitState.value, stderr,
      });
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw launchFailure(`DevToolsActivePort was not written within ${LAUNCH_TIMEOUT_MS / 1000}s`, {
    chromeBin, exitInfo: exitState.value, spawnError: spawnState.value, stderr,
  });
}

/** Resolve the browser WebSocket URL, falling back to the HTTP /json/version endpoint. */
async function resolveWebSocketUrl(target, { chromeBin, stderr }) {
  if (target.wsUrl) return target.wsUrl;
  const deadline = Date.now() + 10_000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${target.port}/json/version`);
      const version = await response.json();
      if (version?.webSocketDebuggerUrl) return version.webSocketDebuggerUrl;
      lastError = new Error("response has no webSocketDebuggerUrl");
    } catch (error) {
      lastError = error;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw launchFailure(
    `could not read /json/version on DevTools port ${target.port}: ${lastError?.message ?? "unknown error"}`,
    { chromeBin, stderr },
  );
}

async function openWebSocket(wsUrl, { chromeBin, stderr }) {
  const ws = new WebSocket(wsUrl);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP WebSocket connect timed out")), 10_000);
      ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP WebSocket error")); }, { once: true });
    });
  } catch (error) {
    try { ws.close(); } catch { /* never opened */ }
    throw launchFailure(`CDP WebSocket failed for ${wsUrl}: ${error.message}`, { chromeBin, stderr });
  }
  return ws;
}

async function connectChrome({ chromeBin, baseUrl }) {
  const profile = mkdtempSync(join(tmpdir(), "pauoj-chrome-cdp-"));
  const stderr = createStderrTail();
  const proc = spawn(chromeBin, [...CHROME_FLAGS, `--user-data-dir=${profile}`, "about:blank"], {
    stdio: ["ignore", "ignore", "pipe"], detached: true,
  });
  proc.stderr?.setEncoding("utf8");
  proc.stderr?.on("data", (chunk) => stderr.push(chunk));

  const exitState = { value: null };
  proc.once("exit", (code, signal) => { exitState.value = { code, signal }; });
  const spawnState = { value: null };
  proc.once("error", (error) => { spawnState.value = error; });

  const kill = () => {
    try { process.kill(-proc.pid, "SIGKILL"); } catch { try { proc.kill("SIGKILL"); } catch { /* already gone */ } }
  };
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    kill();
    if (!exitState.value) {
      await Promise.race([
        new Promise((resolve) => proc.once("exit", resolve)),
        sleep(2_000),
      ]);
    }
    rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  };

  try {
    const target = await waitForDevTools({ chromeBin, profile, stderr, exitState, spawnState });
    const wsUrl = await resolveWebSocketUrl(target, { chromeBin, stderr });
    const ws = await openWebSocket(wsUrl, { chromeBin, stderr });
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
      /** True mobile widths: headless window-size is clamped to 500px. */
      async setViewport(width, height) {
        await send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          screenWidth: width,
          screenHeight: height,
          deviceScaleFactor: 1,
          mobile: width < 768,
        }, sessionId);
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
      /** Real key events so native focus trapping/Escape run (synthetic JS events do not). */
      async pressKey(key, { shift = false } = {}) {
        const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
        const code = codes[key];
        if (!code) throw new Error(`unsupported key: ${key}`);
        const event = {
          key,
          code: key,
          windowsVirtualKeyCode: code,
          nativeVirtualKeyCode: code,
          modifiers: shift ? 8 : 0,
        };
        await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...event }, sessionId);
        await send("Input.dispatchKeyEvent", { type: "keyUp", ...event }, sessionId);
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
        await cleanup();
      },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export async function launchChrome({ chromeBin, baseUrl }) {
  let lastError = null;
  let attempts = 0;
  for (attempts = 1; attempts <= LAUNCH_ATTEMPTS; attempts += 1) {
    try {
      return await connectChrome({ chromeBin, baseUrl });
    } catch (error) {
      lastError = error;
      const retryable = error instanceof ChromeLaunchError ? error.retryable : false;
      if (!retryable) break;
      if (attempts < LAUNCH_ATTEMPTS) await sleep(500);
    }
  }
  const tried = Math.min(attempts, LAUNCH_ATTEMPTS);
  if (lastError && tried > 1) lastError.message += ` (after ${tried} launch attempts)`;
  throw lastError;
}
