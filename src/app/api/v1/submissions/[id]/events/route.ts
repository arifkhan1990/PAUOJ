import type { NextRequest } from "next/server";
import { errors } from "@/server/api/errors";
import { optionalApiUser } from "@/server/api/auth";
import { getSubmissionById } from "@/server/services/submissions";
import {
  getSubmissionEventBus,
  readSubmissionEventVersion,
} from "@/server/judge/submission-events";
import { isPendingVerdict } from "@/lib/verdicts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

/** Version-check base cadence; a lost event is caught within ~5–7s. */
const VERSION_CHECK_MS = 5_000;
/** Per-stream jitter so concurrent streams do not tick in lockstep. */
const VERSION_CHECK_JITTER_MS = 1_500;
/** DB fallback cadence; covers Redis outages and expired version keys. */
const DB_FALLBACK_POLL_MS = 30_000;
/** SSE heartbeat so proxies keep the stream open. */
const HEARTBEAT_MS = 15_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const viewer = await optionalApiUser();
  const initial = await getSubmissionById(id, viewer);
  if (!initial) {
    return Response.json(
      { error: { code: errors.notFound().code, message: errors.notFound().message } },
      { status: 404 },
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastPayload = "";
      let running = false;
      let pendingEvent = false;
      let unlisten: (() => void) | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let versionTimer: ReturnType<typeof setInterval> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let trackedVersion: number | null = null;
      let versionChecking = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        unlisten?.();
        if (pollTimer) clearInterval(pollTimer);
        if (versionTimer) clearInterval(versionTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Stream was already closed by the client.
        }
      };

      const finishIfDone = (status: string) => {
        if (!isPendingVerdict(status)) {
          send("done", { id });
          cleanup();
          return true;
        }
        return false;
      };

      const publish = (payload: typeof initial) => {
        const serialized = JSON.stringify(payload);
        if (serialized === lastPayload) return false;
        lastPayload = serialized;
        send("update", payload);
        return true;
      };

      const poll = async () => {
        if (closed || running) return;
        running = true;
        try {
          const current = await getSubmissionById(id, viewer);
          if (!current) {
            send("error", { message: "Submission disappeared." });
            cleanup();
            return;
          }
          publish(current);
          finishIfDone(current.status);
        } catch {
          send("error", { message: "Could not refresh the submission." });
          cleanup();
        } finally {
          running = false;
          if (pendingEvent && !closed) {
            // An event arrived mid-poll; pick it up right away.
            pendingEvent = false;
            void poll();
          }
        }
      };

      const onEvent = () => {
        if (closed) return;
        // The event may race an in-flight version read; clear the tracked
        // version so the next check re-initializes instead of comparing
        // against a stale number. The immediate poll covers the event.
        trackedVersion = null;
        if (running) {
          pendingEvent = true;
          return;
        }
        void poll();
      };

      const checkVersion = async () => {
        if (closed || versionChecking) return;
        versionChecking = true;
        try {
          const version = await readSubmissionEventVersion(id);
          if (closed) return;
          if (version === null) {
            // Unreadable (Redis down or key expired): never DB-poll from
            // here; the 30s fallback timer covers it.
            trackedVersion = null;
            return;
          }
          if (trackedVersion === null) {
            trackedVersion = version;
            // The baseline can be null when the stream starts before the
            // first verdict event (no version key yet). If a key has
            // appeared since, poll once so a lost pub/sub event for that
            // very first verdict cannot wait for the 30s fallback.
            if (version > 0) {
              if (running) pendingEvent = true;
              else void poll();
            }
            return;
          }
          if (version === trackedVersion) return;
          trackedVersion = version;
          if (running) {
            pendingEvent = true;
            return;
          }
          void poll();
        } finally {
          versionChecking = false;
        }
      };

      send("update", initial);
      lastPayload = JSON.stringify(initial);
      if (finishIfDone(initial.status)) return;

      // Subscribe before the first refresh poll so a verdict committed
      // between the initial fetch and here is still picked up.
      unlisten = getSubmissionEventBus().subscribe(id, onEvent);

      // Baseline the version BEFORE the first refresh poll, strictly
      // ordered: the baseline can never be newer than what the poll's
      // DB query sees, so a verdict committing in this window is caught
      // by the poll (post-commit) or by the next version comparison (the
      // baseline predates it). A hung read only delays this first poll;
      // the 30s fallback and heartbeat below are unaffected.
      void (async () => {
        const version = await readSubmissionEventVersion(id);
        if (closed) return;
        trackedVersion = version;
        void poll();
      })();

      // Version check: one cheap Redis GET per stream every ~5–6.5s (the
      // jitter is per-stream so 10k concurrent streams opened together do
      // not tick in lockstep); a DB poll happens only when the version
      // changed. Normally detects a lost pub/sub event within ~5–7s.
      const versionCheckMs =
        VERSION_CHECK_MS +
        Math.floor(Math.random() * VERSION_CHECK_JITTER_MS);
      versionTimer = setInterval(() => void checkVersion(), versionCheckMs);
      // DB fallback: covers Redis outages and expired version keys.
      pollTimer = setInterval(() => void poll(), DB_FALLBACK_POLL_MS);
      heartbeatTimer = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
