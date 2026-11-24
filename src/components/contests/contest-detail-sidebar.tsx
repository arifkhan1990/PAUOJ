import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddToCalendarButton } from "@/features/contests/add-to-calendar-button";
import { ContestShareButton } from "@/features/contests/contest-share-button";
import {
  contestHostPath,
  contestSponsorPath,
} from "@/lib/contest-ops";
import { plainContestText } from "@/lib/contest-text";
import type { ContestDetail } from "@/lib/types";
import { contestDurationMs } from "@/lib/contests";
import {
  cn,
  formatDateTime,
  formatDhakaDateTime,
  formatDuration,
} from "@/lib/utils";

function DetailRow({
  label,
  value,
  title,
  mono = true,
}: {
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-right text-[11px]",
          mono && "font-mono",
        )}
        title={title}
      >
        {value}
      </dd>
    </div>
  );
}

function registrationState(contest: ContestDetail, isGroup: boolean) {
  const isCrew =
    contest.viewerStaffStatus === "INVITED" ||
    contest.viewerStaffStatus === "ACCEPTED";
  if (isCrew) {
    return { label: "Crew only", variant: "warning" as const };
  }
  if (contest.registered) {
    return { label: "Registered", variant: "success" as const };
  }
  if (
    contest.status === "ENDED" ||
    (isGroup && contest.status === "RUNNING")
  ) {
    return { label: "Closed", variant: "muted" as const };
  }
  return { label: "Open", variant: "outline" as const };
}

export function ContestDetailSidebar({
  contest,
  className,
}: {
  contest: ContestDetail;
  className?: string;
}) {
  const format = contest.format ?? "SINGLE";
  const isGroup = format === "GROUP";
  const showTeams = isGroup || contest.teamCount > 0;
  const registration = registrationState(contest, isGroup);
  const registrationClosesAt = isGroup ? contest.startAt : contest.endAt;

  return (
    <aside
      className={cn(
        "min-w-0 space-y-4 lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1",
        className,
      )}
    >
      <Card className="p-5">
        <h2 className="text-sm font-semibold">Contest details</h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <DetailRow
            label="Starts"
            value={formatDhakaDateTime(contest.startAt)}
            title={formatDateTime(contest.startAt)}
          />
          <DetailRow
            label="Ends"
            value={formatDhakaDateTime(contest.endAt)}
            title={formatDateTime(contest.endAt)}
          />
          <DetailRow
            label="Duration"
            value={formatDuration(
              contestDurationMs(contest.startAt, contest.endAt),
            )}
          />
          <DetailRow
            label="Registration closes"
            value={formatDhakaDateTime(registrationClosesAt)}
            title={formatDateTime(registrationClosesAt)}
          />
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Registration</dt>
            <dd>
              <Badge variant={registration.variant}>{registration.label}</Badge>
            </dd>
          </div>
          <DetailRow
            label="Timezone"
            value="Asia/Dhaka (UTC+6)"
            title="Bangladesh Standard Time (UTC+06:00, no daylight saving)"
            mono={false}
          />
          <DetailRow label="Registered" value={String(contest.participantCount)} />
          {showTeams ? (
            <DetailRow label="Teams" value={String(contest.teamCount)} />
          ) : null}
        </dl>
        {contest.canRegister && contest.status === "RUNNING" && !isGroup ? (
          <p className="mt-3 rounded-md bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
            Solo registration stays open while the round is live.
          </p>
        ) : null}
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="text-sm font-semibold">Contest toolkit</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Share this round or add it to your calendar. All times are in
          Asia/Dhaka.
        </p>
        <ContestShareButton
          slug={contest.slug}
          title={contest.title}
          className="w-full"
        />
        <AddToCalendarButton
          slug={contest.slug}
          title={contest.title}
          description={plainContestText(contest.description)}
          startAt={contest.startAt}
          endAt={contest.endAt}
          ended={contest.status === "ENDED"}
          className="w-full"
        />
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="text-sm font-semibold">Partnerships</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sponsor this round or bring your own contest to PAU OJ.
        </p>
        <Link
          href={contestSponsorPath(contest.slug)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 w-full justify-start",
          )}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Sponsor this contest
        </Link>
        <Link
          href={contestHostPath()}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-11 w-full justify-start",
          )}
        >
          <Building2 className="size-4" aria-hidden="true" />
          Host your own contest
        </Link>
      </Card>
    </aside>
  );
}
