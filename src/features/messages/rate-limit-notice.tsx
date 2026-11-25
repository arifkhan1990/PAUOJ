import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DEFAULT_RETRY_SECONDS = 60;

/** "Try again in 42 seconds." with sane handling of odd limiter output. */
export function retryWaitLabel(seconds: number): string {
  const value =
    Number.isFinite(seconds) && seconds > 0
      ? Math.ceil(seconds)
      : DEFAULT_RETRY_SECONDS;
  return `Try again in ${value} second${value === 1 ? "" : "s"}.`;
}

/**
 * Rendered instead of the conversations when an SSR burst limit trips, so the
 * page never runs the inbox queries it is trying to protect.
 */
export function RateLimitNotice({
  retryAfterSeconds,
  action,
  className,
}: {
  retryAfterSeconds: number;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      role="status"
      className={cn("flex items-start gap-3 p-5", className)}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Clock3 className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">Too many requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {retryWaitLabel(retryAfterSeconds)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          You are opening pages faster than we allow. Nothing was lost; just
          pause for a moment.
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </Card>
  );
}
