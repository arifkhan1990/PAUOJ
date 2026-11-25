import Link from "next/link";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { RankBadge, YouPill } from "@/components/rank/rank-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RankRow } from "@/lib/types";
import {
  clampNumber,
  cn,
  formatPercent,
  formatRelative,
} from "@/lib/utils";

function Acceptance({
  rate,
  align = "left",
}: {
  rate: number;
  align?: "left" | "right";
}) {
  const width = clampNumber(rate, 0, 100);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        align === "right" && "justify-end",
      )}
      title={`${formatPercent(rate)} acceptance`}
    >
      <span className="text-sm tabular-nums">{formatPercent(rate)}</span>
      <span
        aria-hidden="true"
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-success"
          style={{ width: `${width}%` }}
        />
      </span>
    </span>
  );
}

const headClass = "sticky top-16 z-10 border-b border-border bg-card";

export function RankTable({
  items,
  currentUsername,
  caption = "Global ranking by points",
}: {
  items: RankRow[];
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
              <TableHead className={cn(headClass, "w-[34%]")}>Coder</TableHead>
              <TableHead className={cn(headClass, "hidden lg:table-cell")}>
                Institution
              </TableHead>
              <TableHead className={cn(headClass, "text-right")}>
                Points
              </TableHead>
              <TableHead className={cn(headClass, "text-right")}>
                Solved
              </TableHead>
              <TableHead
                className={cn(headClass, "text-right")}
              >
                Submissions
              </TableHead>
              <TableHead
                className={cn(headClass, "hidden text-right lg:table-cell")}
              >
                Acceptance
              </TableHead>
              <TableHead
                className={cn(headClass, "hidden text-right xl:table-cell")}
              >
                Last AC
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
                    <Link
                      href={`/users/${row.username}`}
                      className="flex min-h-11 items-center gap-2.5 rounded-md hover:text-primary"
                    >
                      <UserAvatar
                        name={row.displayName}
                        username={row.username}
                        size="sm"
                        avatarPreset={row.avatarPreset}
                        avatarImageAt={row.avatarImageUpdatedAt}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {row.displayName}
                          </span>
                          {isCurrent ? <YouPill /> : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          @{row.username}
                        </span>
                        <PresenceIndicator
                          presence={row.presence}
                          variant="compact"
                          className="mt-0.5"
                        />
                      </span>
                    </Link>
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
                  <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                    {row.points}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {row.solvedCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {row.submissionCount}
                  </TableCell>
                  <TableCell className="hidden text-right lg:table-cell">
                    <Acceptance rate={row.acceptanceRate} align="right" />
                  </TableCell>
                  <TableCell className="hidden text-right text-xs text-muted-foreground xl:table-cell">
                    {row.lastAcceptedAt
                      ? formatRelative(row.lastAcceptedAt)
                      : "—"}
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
          const place =
            [row.institution, row.country].filter(Boolean).join(" · ") || "—";
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
                    <Link
                      href={`/users/${row.username}`}
                      className="flex min-h-11 min-w-0 items-center gap-3 rounded-md hover:text-primary"
                    >
                      <UserAvatar
                        name={row.displayName}
                        username={row.username}
                        size="md"
                        avatarPreset={row.avatarPreset}
                        avatarImageAt={row.avatarImageUpdatedAt}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">
                            {row.displayName}
                          </span>
                          {isCurrent ? <YouPill /> : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          @{row.username}
                        </span>
                        <PresenceIndicator
                          presence={row.presence}
                          variant="compact"
                          className="mt-0.5"
                        />
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {place}
                        </span>
                      </span>
                    </Link>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {row.points}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      points
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Solved
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums">
                      {row.solvedCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Acceptance
                    </dt>
                    <dd>
                      <Acceptance rate={row.acceptanceRate} />
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
