import type { PresenceInfo, PresenceState } from "@/lib/follow-types";
import { cn } from "@/lib/utils";

type VisibleState = Exclude<PresenceState, "HIDDEN">;

const DOT_CLASS: Record<VisibleState, string> = {
  ONLINE: "bg-emerald-600 dark:bg-emerald-400",
  RECENT: "bg-muted-foreground/60",
  OFFLINE: "bg-muted-foreground/40",
};

/**
 * Server labels are authoritative. These fallbacks only cover a missing label
 * and follow the same vocabulary ("Online now", "Last active …",
 * "No recent activity") so the status is never colour-only.
 */
const FALLBACK_LABEL: Record<VisibleState, string> = {
  ONLINE: "Online now",
  RECENT: "Last active recently",
  OFFLINE: "No recent activity",
};

/** Default reads as a clear pill; compact fits list rows and metadata lines. */
const PILL_CLASS: Record<VisibleState, string> = {
  ONLINE:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  RECENT: "border-border bg-muted/50 text-foreground",
  OFFLINE: "border-border bg-muted/40 text-muted-foreground",
};

export function presenceText(presence: PresenceInfo): string | null {
  if (presence.state === "HIDDEN") return null;
  const label = presence.label?.trim();
  return label ? label : FALLBACK_LABEL[presence.state];
}

export function PresenceIndicator({
  presence,
  variant = "default",
  className,
}: {
  presence: PresenceInfo;
  /** Compact fits list rows and metadata lines. */
  variant?: "default" | "compact";
  className?: string;
}) {
  const state = presence.state;
  const label = presenceText(presence);
  if (state === "HIDDEN" || label === null) return null;

  const compact = variant === "compact";
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5",
        compact
          ? "text-[11px] text-muted-foreground"
          : cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              PILL_CLASS[state],
            ),
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[state])}
      />
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "min-w-0 truncate",
          compact && state === "ONLINE" && "font-medium text-foreground",
        )}
      >
        {label}
      </span>
    </span>
  );
}
