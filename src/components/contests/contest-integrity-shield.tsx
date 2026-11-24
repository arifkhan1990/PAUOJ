"use client";

import { Maximize2, ShieldAlert } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import type { ContestIntegrityEventType } from "@/lib/contest-ops";
import {
  contestIntegrityEventEndpoint,
  shouldSendIntegrityEvent,
  type IntegrityThrottleState,
} from "@/lib/contest-security";
import { cn } from "@/lib/utils";

const WATERMARK_TILE_COUNT = 12;

/** Editors and inputs must never be blocked or logged by the shield. */
function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA")
  );
}

function WatermarkOverlay({ watermark }: { watermark: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
    >
      <div className="absolute inset-[-25%] flex -rotate-[24deg] flex-col justify-around">
        {Array.from({ length: WATERMARK_TILE_COUNT }, (_, index) => (
          <p
            key={index}
            className="whitespace-nowrap px-6 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/[0.08] dark:text-foreground/[0.11]"
          >
            {watermark}
          </p>
        ))}
      </div>
    </div>
  );
}

function IntegrityNotice({
  contestTitle,
  onFocusMode,
}: {
  contestTitle: string;
  onFocusMode: (() => void) | null;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">Contest integrity:</span> this{" "}
        {contestTitle} statement is watermarked with your name. Copying,
        pasting, printing and tab switches are logged, the editorial stays
        sealed until the round ends, and contest crew cannot compete.
        Screenshots are traceable, not impossible.
      </p>
      {onFocusMode ? (
        <button
          type="button"
          onClick={onFocusMode}
          aria-label="Enter contest focus mode (fullscreen)"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-400/70 bg-background/60 px-2.5 py-1.5 font-medium text-amber-900 hover:bg-background dark:border-amber-600 dark:text-amber-100"
        >
          <Maximize2 className="size-3.5" aria-hidden="true" />
          Focus mode
        </button>
      ) : null}
    </div>
  );
}

/**
 * Wraps a contest problem statement area while the round is running:
 * watermark overlay, copy/cut/paste/context-menu/print guards and
 * integrity event logging. The judge editor lives outside this shield
 * and is never blocked (editable targets are exempt defensively too).
 * Events carry only the type and problem id — never keystrokes, code
 * or personal data.
 */
export function ContestIntegrityShield({
  contestSlug,
  contestTitle,
  watermark,
  problemId,
  focusMode = true,
  className,
  children,
}: {
  contestSlug: string;
  contestTitle: string;
  watermark: string | null;
  problemId: string | null;
  focusMode?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentAtRef = useRef<IntegrityThrottleState>({});
  const fullscreenRef = useRef<Element | null>(null);

  const logEvent = useCallback(
    (type: ContestIntegrityEventType) => {
      const decision = shouldSendIntegrityEvent(
        sentAtRef.current,
        type,
        Date.now(),
      );
      if (!decision.send) return;
      sentAtRef.current = decision.next;
      const url = contestIntegrityEventEndpoint(contestSlug);
      const body = JSON.stringify({
        type,
        ...(problemId ? { problemId } : {}),
      });
      const blob = () =>
        new Blob([body], { type: "application/json" });
      // Tab/fullscreen events can fire while the page is being torn down,
      // where sendBeacon is the only reliable transport; every other event
      // prefers fetch keepalive and falls back to sendBeacon.
      const beaconFirst =
        type === "TAB_HIDDEN" || type === "FULLSCREEN_EXIT";
      if (
        beaconFirst &&
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        try {
          if (navigator.sendBeacon(url, blob())) return;
        } catch {
          // fall through to fetch
        }
      }
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.sendBeacon === "function"
        ) {
          try {
            navigator.sendBeacon(url, blob());
          } catch {
            // logging must never break the contest UI
          }
        }
      });
    },
    [contestSlug, problemId],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logEvent("TAB_HIDDEN");
      }
    };
    const onFullscreenChange = () => {
      const current = document.fullscreenElement;
      const wasFullscreen = fullscreenRef.current !== null;
      fullscreenRef.current = current;
      if (wasFullscreen && current === null) {
        logEvent("FULLSCREEN_EXIT");
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        logEvent("PRINT");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [logEvent]);

  const guardStatementEvent = useCallback(
    (type: ContestIntegrityEventType) =>
      (event: SyntheticEvent) => {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        logEvent(type);
      },
    [logEvent],
  );

  const enterFocusMode = useCallback(() => {
    const element = containerRef.current;
    if (!element || typeof element.requestFullscreen !== "function") return;
    try {
      const request = element.requestFullscreen();
      if (request && typeof request.catch === "function") {
        request.catch(() => {
          // Fullscreen may be denied; the contest keeps working.
        });
      }
    } catch {
      // ignore unsupported browsers
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onCopy={guardStatementEvent("COPY")}
      onCut={guardStatementEvent("COPY")}
      onPaste={guardStatementEvent("PASTE")}
      onContextMenu={guardStatementEvent("CONTEXT_MENU")}
    >
      <IntegrityNotice
        contestTitle={contestTitle}
        onFocusMode={focusMode ? enterFocusMode : null}
      />
      {children}
      {watermark ? <WatermarkOverlay watermark={watermark} /> : null}
    </div>
  );
}
