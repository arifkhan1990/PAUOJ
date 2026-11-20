"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function splitRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function ContestCountdown({
  startAt,
  endAt,
}: {
  startAt: string;
  endAt: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (now === null) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Timer className="size-4 text-primary" />
        <span className="font-mono tabular-nums">--:--:--</span>
      </span>
    );
  }

  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const running = now >= start && now < end;
  const target = now < start ? start : running ? end : null;

  if (target === null) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Timer className="size-4" />
        Contest ended
      </span>
    );
  }

  const remaining = splitRemaining(target - now);
  const label = running ? "Ends in" : "Starts in";
  const value =
    remaining.days > 0
      ? `${remaining.days}d ${pad(remaining.hours)}h ${pad(remaining.minutes)}m`
      : `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`;

  return (
    <span className="inline-flex items-center gap-2 text-xs" aria-live="off">
      <Timer className="size-4 text-primary" />
      <span className="uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </span>
  );
}
