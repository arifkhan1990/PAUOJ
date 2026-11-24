import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CONTEST_INTEGRITY_EVENT_LABEL,
  type ContestIntegrityEventType,
  type ContestIntegritySummary,
} from "@/lib/contest-ops";
import { formatDateTime, formatRelative } from "@/lib/utils";

const EVENT_TYPES = Object.keys(
  CONTEST_INTEGRITY_EVENT_LABEL,
) as ContestIntegrityEventType[];

export function IntegrityPanel({
  contestId,
  integrity,
}: {
  contestId: string;
  integrity: ContestIntegritySummary;
}) {
  const totalEvents = EVENT_TYPES.reduce(
    (sum, type) => sum + (integrity.totals[type] ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Integrity events</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Copy, paste, tab-switch and print signals recorded during the
              round. Watermarks make screenshots traceable.
            </p>
          </div>
          <Badge variant={totalEvents > 0 ? "warning" : "success"}>
            {totalEvents} {totalEvents === 1 ? "event" : "events"}
          </Badge>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {EVENT_TYPES.map((type) => {
            const count = integrity.totals[type] ?? 0;
            return (
              <div
                key={type}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <dt className="text-[11px] leading-snug text-muted-foreground">
                  {CONTEST_INTEGRITY_EVENT_LABEL[type]}
                </dt>
                <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
                  {count}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-4">
          <Link
            href={`/admin/contests/${contestId}/plagiarism`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            Open plagiarism report
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Recent events</h3>
          {integrity.events.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              No integrity events recorded yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {integrity.events.slice(0, 25).map((event) => (
                <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium">
                      {CONTEST_INTEGRITY_EVENT_LABEL[event.type]}
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground"
                      title={formatDateTime(event.createdAt)}
                    >
                      {formatRelative(event.createdAt)}
                    </p>
                  </div>
                  <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
                    {event.user.displayName} (@{event.user.username})
                    {event.problem ? ` · ${event.problem.title}` : ""}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {integrity.events.length > 25 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Showing the 25 most recent of {integrity.events.length} loaded
              events.
            </p>
          ) : null}
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Flagged users</h3>
          {integrity.flaggedUsers.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              Nobody has triggered an integrity signal in this contest.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {integrity.flaggedUsers.map((user) => (
                <li
                  key={user.userId}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/users/${user.username}`}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {user.displayName}
                    </Link>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.events > 5 ? "destructive" : "warning"}>
                      {user.events} {user.events === 1 ? "event" : "events"}
                    </Badge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Last {formatRelative(user.lastEventAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
