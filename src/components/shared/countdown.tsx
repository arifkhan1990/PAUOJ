"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";

function formatRemaining(ms: number, showSeconds: boolean): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [
    days > 0 ? `${days}d` : null,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    showSeconds ? `${String(seconds).padStart(2, "0")}s` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export function Countdown({
  target,
  label,
  className,
  compact = false,
}: {
  target: string;
  label: string;
  className?: string;
  /** Drops the ticking seconds for dense list rows. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const next = targetMs - Date.now();
      setRemaining(next);
      if (next <= 0 && !refreshed.current) {
        refreshed.current = true;
        router.refresh();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, router]);

  return (
    <span
      className={className}
      title={label}
      suppressHydrationWarning
    >
      <Clock3 className="mr-1.5 inline size-3.5 align-[-2px]" />
      {label}:{" "}
      <span className="font-mono tabular-nums">
        {remaining === null ? "…" : formatRemaining(remaining, !compact)}
      </span>
    </span>
  );
}
