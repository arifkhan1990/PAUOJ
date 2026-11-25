import Link from "next/link";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { RankBadge, YouPill } from "@/components/rank/rank-badge";
import { RatingTierBadge } from "@/components/rank/rating-tier-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RatingRow } from "@/lib/rating-rank-types";
import { getRatingTier } from "@/lib/rating-tiers";
import { cn, formatRelative } from "@/lib/utils";

const headClass = "sticky top-16 z-10 border-b border-border bg-card";

const deltaUp = "text-emerald-700 dark:text-emerald-400";
const deltaDown = "text-rose-700 dark:text-rose-400";

/** Explicit sign plus colour, so the direction is never colour-only. */
export function RatingDelta({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded === 0) {
    return (
      <span
        className={cn(
          "text-sm font-medium tabular-nums text-muted-foreground",
          className,
        )}
      >
        ±0
        <span className="sr-only"> no rating change</span>
      </span>
    );
  }
  const positive = rounded > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center text-sm font-semibold tabular-nums",
        positive ? deltaUp : deltaDown,
        className,
      )}
    >
      <span aria-hidden="true">
        {positive ? "+" : "−"}
        {Math.abs(rounded)}
      </span>
      <span className="sr-only">
        {positive ? "Up" : "Down"} {Math.abs(rounded)} rating
      </span>
    </span>
  );
}

function Place({ row }: { row: RatingRow }) {
  return (
    <span className="block truncate text-xs text-muted-foreground">
      {[row.institution, row.country].filter(Boolean).join(" · ") || "—"}
    </span>
  );
}

function CoderCell({
  row,
  isCurrent,
  size,
  showPlace = false,
}: {
  row: RatingRow;
  isCurrent: boolean;
  size: "sm" | "md";
  showPlace?: boolean;
}) {
  const tier = getRatingTier(row.rating);
  return (
    <Link
      href={`/users/${row.username}`}
      data-tier={tier.key}
      className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-md hover:underline"
    >
      <UserAvatar
        name={row.displayName}
        username={row.username}
        size={size}
        avatarPreset={row.avatarPreset}
        avatarImageAt={row.avatarImageUpdatedAt}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm font-medium",
              tier.textClassName,
            )}
          >
            {row.displayName}
          </span>
          {isCurrent ? <YouPill /> : null}
        </span>
        <span
          className={cn(
            "block truncate text-xs font-medium",
            tier.textClassName,
          )}
        >
          @{row.username}
        </span>
        <PresenceIndicator
          presence={row.presence}
          variant="compact"
          className="mt-0.5"
        />
        {showPlace ? <Place row={row} /> : null}
      </span>
    </Link>
  );
}

export function RatingTable({
  items,
  currentUsername,
  caption = "Global rating ranking",
}: {
  items: RatingRow[];
  currentUsername?: string | null;
  caption?: string;
}) {
  return (
    <>
      <Card className="hidden md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(headClass, "w-16")}>Rank</TableHead>
              <TableHead className={cn(headClass, "w-[30%]")}>Coder</TableHead>
              <TableHead className={cn(headClass, "hidden lg:table-cell")}>
                Institution
              </TableHead>
              <TableHead className={cn(headClass, "text-right")}>
                Rating
              </TableHead>
              <TableHead className={cn(headClass, "text-right")}>Peak</TableHead>
              <TableHead className={cn(headClass, "text-right")}>
                Contests
              </TableHead>
              <TableHead className={cn(headClass, "text-right")}>
                Last change
              </TableHead>
              <TableHead
                className={cn(headClass, "hidden text-right xl:table-cell")}
              >
                Last contest
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => {
              const isCurrent = row.username === currentUsername;
              return (
                <TableRow
                  key={row.username}
                  data-current={isCurrent ? "true" : undefined}
                  className={cn(isCurrent && "bg-primary/5 hover:bg-primary/10")}
                >
                  <TableCell>
                    <RankBadge rank={row.rank} />
                  </TableCell>
                  <TableCell>
                    <CoderCell row={row} isCurrent={isCurrent} size="sm" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="block max-w-48 truncate text-sm">
                      {row.institution ?? "—"}
                    </span>
                    {row.country ? (
                      <span className="block text-xs text-muted-foreground">
                        {row.country}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="block font-mono text-sm font-semibold tabular-nums">
                      {row.rating}
                    </span>
                    <div className="mt-1 flex justify-end">
                      <RatingTierBadge rating={row.rating} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {row.maxRating}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {row.contestCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <RatingDelta value={row.lastDelta} />
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    {row.lastContestSlug ? (
                      <Link
                        href={`/contests/${row.lastContestSlug}`}
                        className="block max-w-40 truncate text-sm hover:text-primary hover:underline"
                        title={row.lastContestTitle}
                      >
                        {row.lastContestTitle}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                    {row.lastContestAt ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatRelative(row.lastContestAt)}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </Card>

      <ul className="space-y-2.5 md:hidden">
        {items.map((row) => {
          const isCurrent = row.username === currentUsername;
          return (
            <li key={row.username}>
              <Card
                data-current={isCurrent ? "true" : undefined}
                className={cn(
                  "p-4",
                  isCurrent && "border-primary/50 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <RankBadge rank={row.rank} size="md" />
                    <CoderCell
                      row={row}
                      isCurrent={isCurrent}
                      size="md"
                      showPlace
                    />
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-lg font-semibold tabular-nums">
                      {row.rating}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <RatingTierBadge rating={row.rating} />
                    </div>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Peak
                    </dt>
                    <dd className="font-mono text-sm font-semibold tabular-nums">
                      {row.maxRating}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Contests
                    </dt>
                    <dd className="font-mono text-sm font-semibold tabular-nums">
                      {row.contestCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Last change
                    </dt>
                    <dd>
                      <RatingDelta value={row.lastDelta} />
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
