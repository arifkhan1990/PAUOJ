"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/shared/pagination";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreboardTable } from "@/features/contests/scoreboard-table";
import type { ContestScoreboard } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STANDINGS_POLL_MS = 20_000;
/** Refresh the relative age label between polls. */
const AGE_TICK_MS = 10_000;

type ScoreboardResponse = { data?: ContestScoreboard };

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Human-readable age of the snapshot the server sent, in the user's tab. */
export function formatStandingsAge(generatedAt: string, now: number): string {
  const generated = Date.parse(generatedAt);
  if (!Number.isFinite(generated)) return "Updated moments ago";
  const seconds = Math.max(0, Math.floor((now - generated) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} h ago`;
}

/** Ranks visible on this page, or null when the board has no rows. */
export function standingsRange(
  page: number,
  pageSize: number,
  total: number,
): { start: number; end: number } | null {
  if (total <= 0 || pageSize <= 0) return null;
  const start = (Math.max(1, page) - 1) * pageSize + 1;
  if (start > total) return null;
  return { start, end: Math.min(total, start + pageSize - 1) };
}

function StandingsSkeleton({ labels }: { labels: string[] }) {
  return (
    <div
      className="space-y-2 p-3"
      aria-busy="true"
      aria-label="Loading live standings"
    >
      <div className="flex items-center gap-3 pb-1">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 w-14" />
        {labels.map((label) => (
          <Skeleton key={label} className="hidden h-5 w-8 sm:block" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-12" />
          {labels.map((label) => (
            <Skeleton key={label} className="hidden h-8 w-8 sm:block" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StandingsLive({
  slug,
  initialBoard,
  deferInitialRows = false,
}: {
  slug: string;
  initialBoard: ContestScoreboard;
  /** Running boards render a shell first and fetch the rows from the API. */
  deferInitialRows?: boolean;
}) {
  const [board, setBoard] = useState(initialBoard);
  const [loaded, setLoaded] = useState(!deferInitialRows);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => {
    const generated = Date.parse(initialBoard.generatedAt);
    return Number.isFinite(generated) ? generated : Date.now();
  });
  const etagRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const page = initialBoard.pagination.page;
  const pageSize = initialBoard.pagination.pageSize;
  const running = board.contest.status === "RUNNING";
  const total = board.pagination.total;
  const range = standingsRange(board.pagination.page, pageSize, total);
  const age = formatStandingsAge(board.generatedAt, now);
  const statusText = paused
    ? "Live updates paused. Retrying…"
    : !loaded
      ? "Loading live standings…"
      : board.contest.status === "ENDED"
        ? `Final standings · ${age.toLowerCase()}`
        : age;

  // Adopt a newer SSR snapshot (e.g. the page was re-rendered on the server).
  useEffect(() => {
    setBoard(initialBoard);
    etagRef.current = null;
  }, [initialBoard]);

  // The initial age is derived from generatedAt so SSR and hydration agree;
  // once mounted, switch to the real clock.
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const headers = new Headers();
      if (etagRef.current) headers.set("if-none-match", etagRef.current);
      const response = await fetch(
        `/api/v1/contests/${encodeURIComponent(slug)}/standings?page=${page}&pageSize=${pageSize}`,
        {
          headers,
          signal: controller.signal,
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      if (response.status === 304) {
        setPaused(false);
        setLoaded(true);
        setNow(Date.now());
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as ScoreboardResponse | null;
      if (!payload?.data) throw new Error("Invalid scoreboard payload");
      etagRef.current = response.headers.get("etag");
      setBoard(payload.data);
      setPaused(false);
      setLoaded(true);
      setNow(Date.now());
    } catch {
      if (controller.signal.aborted) return;
      setPaused(true);
    } finally {
      inFlightRef.current = false;
    }
  }, [slug, page, pageSize]);

  // Deferred running boards fetch their first page immediately after mount;
  // the interval below only handles later refreshes.
  useEffect(() => {
    if (!deferInitialRows) return;
    void refresh();
  }, [deferInitialRows, refresh]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onResume = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    // Spread 10k clients over a 5s window so contest-start polls do not align.
    const period = STANDINGS_POLL_MS + Math.floor(Math.random() * 5_000);
    const timer = window.setInterval(tick, period);
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      abortRef.current?.abort();
    };
  }, [running, refresh]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), AGE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <p
          className={cn(
            "inline-flex items-center gap-1.5",
            paused && "text-amber-700 dark:text-amber-300",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              paused
                ? "bg-amber-500"
                : running
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/60",
            )}
          />
          {statusText}
        </p>
        <span className="sr-only" role="status" aria-live="polite">
          {paused ? "Live updates paused. Retrying…" : ""}
        </span>
        {range && loaded ? (
          <span className="tabular-nums">
            Showing {formatCount(range.start)}–{formatCount(range.end)} of{" "}
            {formatCount(total)}
          </span>
        ) : null}
      </div>

      <Card className="mt-3 overflow-hidden p-1">
        {loaded ? (
          <ScoreboardTable board={board} />
        ) : (
          <StandingsSkeleton labels={board.labels} />
        )}
      </Card>

      {loaded ? (
        <Pagination
          pathname={`/contests/${slug}/standings`}
          searchParams={{ page: String(board.pagination.page) }}
          page={board.pagination.page}
          totalPages={board.pagination.totalPages}
        />
      ) : null}
    </div>
  );
}
