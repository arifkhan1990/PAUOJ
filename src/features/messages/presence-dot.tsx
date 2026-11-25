import type { PresenceInfo } from "@/lib/follow-types";
import { cn } from "@/lib/utils";
import { presenceText } from "@/components/profile/presence-indicator";

const dotClass: Record<PresenceInfo["state"], string> = {
  ONLINE: "bg-emerald-500",
  RECENT: "bg-amber-500",
  OFFLINE: "bg-muted-foreground/40",
  HIDDEN: "bg-transparent",
};

/** Local presence dot; the shared indicator belongs to the profile agent. */
export function PresenceDot({
  presence,
  className,
}: {
  presence: PresenceInfo;
  className?: string;
}) {
  if (presence.state === "HIDDEN") return null;
  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full ring-2 ring-background",
        dotClass[presence.state],
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** Dot plus the server-computed label, for the thread header. */
export function PresenceLabel({ presence }: { presence: PresenceInfo }) {
  const label = presenceText(presence);
  if (presence.state === "HIDDEN" || label === null) return null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <PresenceDot presence={presence} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
