"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Inbox,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  MONTHLY_SERIES_SCHEDULE,
  nextMonthlySeriesStart,
} from "@/lib/contest-schedule";
import type { ContestSeriesView } from "@/lib/contest-ops";

type EnsureResult = {
  created: boolean;
  contestId: string;
  startAt: string;
};

const dhakaFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Dhaka",
});

function formatDhaka(iso: string): string {
  return `${dhakaFormatter.format(new Date(iso))} Asia/Dhaka`;
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const ORDINAL_LABELS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function ContestSeriesPanel({
  series,
  pendingHostRequests,
}: {
  series: ContestSeriesView[];
  pendingHostRequests: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const primary = series[0] ?? null;
  const schedule = {
    weekday: primary?.weekday ?? MONTHLY_SERIES_SCHEDULE.weekday,
    weekOfMonth: primary?.weekOfMonth ?? MONTHLY_SERIES_SCHEDULE.weekOfMonth,
    hour: primary?.hour ?? MONTHLY_SERIES_SCHEDULE.hour,
    minute: primary?.minute ?? MONTHLY_SERIES_SCHEDULE.minute,
    durationMinutes:
      primary?.durationMinutes ?? MONTHLY_SERIES_SCHEDULE.durationMinutes,
  };
  const nextRunAt =
    primary?.nextRunAt ??
    nextMonthlySeriesStart(new Date(), schedule).toISOString();
  const weekdayLabel = WEEKDAY_LABELS[schedule.weekday] ?? "Sunday";
  const ordinalLabel =
    ORDINAL_LABELS[schedule.weekOfMonth - 1] ?? `Week ${schedule.weekOfMonth}`;
  const cadence = `${ordinalLabel} ${weekdayLabel} · ${pad(schedule.hour)}:${pad(schedule.minute)} Asia/Dhaka · ${schedule.durationMinutes} min`;

  const ensure = async () => {
    setPending(true);
    try {
      const result = await apiPost<EnsureResult>(
        "/api/v1/admin/contest-series/ensure",
        {},
      );
      const paused = primary !== null && !primary.isActive;
      toast({
        title: result.created
          ? "Next round scheduled"
          : paused
            ? "Series is paused"
            : "Next round already exists",
        description: paused
          ? "Reactivate the series to create monthly rounds automatically."
          : `Starts ${formatDhaka(result.startAt)}.`,
        variant: result.created ? "success" : paused ? "warning" : "info",
      });
      router.refresh();
    } catch (requestError) {
      toast({
        title: "Could not ensure the next round",
        description:
          requestError instanceof ApiClientError
            ? requestError.message
            : "Try again in a moment.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Monthly series</h2>
            <p
              className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
              title={primary?.description}
            >
              {primary
                ? primary.description
                : "The automatic monthly round is not seeded yet. Ensure the next round to create it."}
            </p>
          </div>
        </div>
        <Badge
          variant={
            primary === null ? "muted" : primary.isActive ? "success" : "warning"
          }
        >
          {primary === null
            ? "Not seeded"
            : primary.isActive
              ? "Active"
              : "Paused"}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Next run</dt>
          <dd className="mt-0.5 font-medium">{formatDhaka(nextRunAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cadence</dt>
          <dd className="mt-0.5 font-medium">{cadence}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last generated</dt>
          <dd className="mt-0.5 font-medium">
            {primary?.lastRunAt ? formatDhaka(primary.lastRunAt) : "Not run yet"}
          </dd>
        </div>
      </dl>

      {primary && !primary.isActive ? (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          The series is paused. The worker will not create further rounds until
          it is reactivated; manual ensure still creates one round.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="lg"
          onClick={() => void ensure()}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Ensure next round now
        </Button>
        <Link
          href="/admin/host-requests"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Inbox className="size-4" aria-hidden="true" />
          Host requests
          {pendingHostRequests > 0 ? (
            <Badge variant="warning">{pendingHostRequests}</Badge>
          ) : null}
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Official platform round, fresh problems only.
        </span>
      </div>
    </Card>
  );
}
