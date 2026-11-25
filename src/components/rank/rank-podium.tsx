import type { ReactNode } from "react";
import Link from "next/link";
import { Medal } from "lucide-react";
import { YouPill } from "@/components/rank/rank-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const podiumLabel = ["1st", "2nd", "3rd"] as const;

const podiumStyle = [
  "border-amber-300/80 bg-amber-50/60 ring-1 ring-amber-300/50 dark:border-amber-700/60 dark:bg-amber-950/20 dark:ring-amber-700/40",
  "border-border bg-card",
  "border-border bg-card",
];

const medalStyle = [
  "text-amber-600 dark:text-amber-400",
  "text-slate-500 dark:text-slate-300",
  "text-orange-600 dark:text-orange-400",
];

/** Placement order on sm+: second, first, third. DOM order stays 1, 2, 3. */
const podiumOrder = ["sm:order-2", "sm:order-1", "sm:order-3"];

/** Board-neutral podium row; each board supplies its own metric markup. */
export type RankPodiumEntry = {
  username: string;
  displayName: string;
  /** Global rank, kept as-is even when filters narrow the board. */
  rank: number;
  /** Institution · country line, or "—". */
  place: string;
  metricValue: string;
  metricUnit: string;
  /** Extra metric detail such as a rating tier badge. */
  metricNote?: ReactNode;
  /** Secondary stats shown on the right of the metric. */
  detail: ReactNode;
  /** Tier colour for the display name and @username (rating board). */
  nameClassName?: string;
  /** Tier key for `data-tier` on the profile link (rating board). */
  tierKey?: string;
  avatarPreset?: string | null;
  avatarImageAt?: string | null;
};

export function RankPodium({
  entries,
  filtered = false,
  currentUsername,
  title,
  description,
  headingId = "rank-podium-heading",
}: {
  entries: RankPodiumEntry[];
  filtered?: boolean;
  currentUsername?: string | null;
  title?: string;
  description?: string;
  headingId?: string;
}) {
  const top = entries.slice(0, 3);
  if (top.length < 3) return null;

  return (
    <section aria-labelledby={headingId} className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id={headingId}
            className="text-lg font-semibold tracking-tight"
          >
            {title ?? (filtered ? "Top of this board" : "Top coders")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ??
              (filtered
                ? "The three coders at the top of the current board."
                : "The three highest-ranked coders on the judge.")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
        {top.map((entry, index) => {
          const isCurrent = entry.username === currentUsername;
          return (
            <Card
              key={entry.username}
              className={cn(
                "flex flex-col p-5",
                podiumStyle[index],
                podiumOrder[index],
                index === 0 && "sm:-mt-4 sm:pb-7",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <Medal
                    aria-hidden="true"
                    className={cn("size-4", medalStyle[index])}
                  />
                  {podiumLabel[index]}
                </span>
                <span className="flex items-center gap-2">
                  {entry.rank !== index + 1 ? (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Rank #{entry.rank}
                    </span>
                  ) : null}
                  {isCurrent ? <YouPill /> : null}
                </span>
              </div>

              <Link
                href={`/users/${entry.username}`}
                data-tier={entry.tierKey}
                className="mt-3 flex min-h-11 min-w-0 items-center gap-3 rounded-md hover:underline"
              >
                <UserAvatar
                  name={entry.displayName}
                  username={entry.username}
                  size={index === 0 ? "lg" : "md"}
                  avatarPreset={entry.avatarPreset}
                  avatarImageAt={entry.avatarImageAt}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      entry.nameClassName,
                    )}
                  >
                    {entry.displayName}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-xs font-medium text-muted-foreground",
                      entry.nameClassName,
                    )}
                  >
                    @{entry.username}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {entry.place}
                  </span>
                </span>
              </Link>

              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tabular-nums">
                      {entry.metricValue}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.metricUnit}
                    </span>
                  </p>
                  {entry.metricNote ? (
                    <div className="mt-1.5">{entry.metricNote}</div>
                  ) : null}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {entry.detail}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
