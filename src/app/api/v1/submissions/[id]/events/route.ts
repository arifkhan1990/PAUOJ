import type { NextRequest } from "next/server";
import { errors } from "@/server/api/errors";
import { optionalApiUser } from "@/server/api/auth";
import { getSubmissionById } from "@/server/services/submissions";
import { getSubmissionEventBus } from "@/server/judge/submission-events";
import { isPendingVerdict } from "@/lib/verdicts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

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
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

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
        if (running) {
          pendingEvent = true;
          return;
        }
        void poll();
      };

      send("update", initial);
      lastPayload = JSON.stringify(initial);
      if (finishIfDone(initial.status)) return;

      // Subscribe before the first refresh poll so a verdict committed
      // between the initial fetch and here is still picked up.
      unlisten = getSubmissionEventBus().subscribe(id, onEvent);
      void poll();

      // Fallback poll: covers Redis outages and lost events.
      pollTimer = setInterval(() => void poll(), 15_000);
      heartbeatTimer = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);

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
