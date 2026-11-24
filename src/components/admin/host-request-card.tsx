import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BannerPreview } from "@/components/shared/banner-preview";
import {
  CONTEST_FORMAT_LABEL,
  CONTEST_HOST_REQUEST_STATUS_LABEL,
  CONTEST_PAYMENT_STATUS_LABEL,
  type ContestHostRequestView,
} from "@/lib/contest-ops";
import { formatDateTime, formatRelative, safeHttpUrl } from "@/lib/utils";
import type { ContestDivision } from "@/lib/types";

const DIVISION_LABEL: Record<ContestDivision, string> = {
  OPEN: "Open",
  DIV1: "Div. 1",
  DIV2: "Div. 2",
  DIV3: "Div. 3",
  DIV4: "Div. 4",
};

function statusVariant(
  status: ContestHostRequestView["status"],
): "warning" | "success" | "destructive" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  if (status === "CONVERTED") return "default";
  return "warning";
}

function paymentVariant(
  status: ContestHostRequestView["paymentStatus"],
): "warning" | "success" | "muted" | "destructive" {
  if (status === "PAID") return "success";
  if (status === "WAIVED") return "muted";
  if (status === "REFUNDED") return "destructive";
  return "warning";
}

export function HostRequestCard({
  request,
  actions,
}: {
  request: ContestHostRequestView;
  actions?: ReactNode;
}) {
  const bannerHref = safeHttpUrl(request.bannerUrl);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-sm font-semibold">
              {request.title}
            </h3>
            <Badge variant={statusVariant(request.status)}>
              {CONTEST_HOST_REQUEST_STATUS_LABEL[request.status]}
            </Badge>
            <Badge variant={paymentVariant(request.paymentStatus)}>
              {CONTEST_PAYMENT_STATUS_LABEL[request.paymentStatus]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Requested by{" "}
            <Link
              href={`/users/${request.requestedBy.username}`}
              className="font-medium text-foreground hover:text-primary"
            >
              @{request.requestedBy.username}
            </Link>{" "}
            · {request.requestedBy.displayName} ·{" "}
            <span title={formatDateTime(request.createdAt)}>
              {formatRelative(request.createdAt)}
            </span>
          </p>
        </div>
        <p className="font-mono text-sm font-semibold tabular-nums">
          ৳{request.feeBdt.toLocaleString("en-US")}
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Format</p>
          <p className="font-medium">
            {CONTEST_FORMAT_LABEL[request.format]}
            {request.format === "GROUP"
              ? ` · ${request.teamSize} per team`
              : ""}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Division</p>
          <p className="font-medium">{DIVISION_LABEL[request.division]}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expected coders</p>
          <p className="font-medium">{request.expectedParticipants}</p>
        </div>
        <div>
          <p className="text-muted-foreground">TrxID</p>
          <p className="break-all font-mono font-semibold">
            {request.paymentReference ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Starts</p>
          <p className="font-medium">{formatDateTime(request.startAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ends</p>
          <p className="font-medium">{formatDateTime(request.endAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fee</p>
          <p className="font-medium">
            ৳{request.feeBdt.toLocaleString("en-US")} ·{" "}
            {CONTEST_PAYMENT_STATUS_LABEL[request.paymentStatus]}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Submitted</p>
          <p className="font-medium">{formatDateTime(request.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p className="flex min-w-0 items-center gap-1.5">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <a
            href={`mailto:${request.contactEmail}`}
            className="truncate hover:text-primary"
          >
            {request.contactEmail}
          </a>
        </p>
        <p className="flex min-w-0 items-center gap-1.5">
          <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {request.contactPhone ? (
            <a
              href={`tel:${request.contactPhone}`}
              className="truncate hover:text-primary"
            >
              {request.contactPhone}
            </a>
          ) : (
            <span className="text-muted-foreground">No phone</span>
          )}
        </p>
      </div>

      {request.bannerUrl ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Banner
          </p>
          <BannerPreview
            url={request.bannerUrl}
            alt={`Submitted banner for ${request.title}`}
            className="max-w-sm"
          />
          {bannerHref ? (
            <a
              href={bannerHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 max-w-full items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
            >
              <ExternalLink
                className="size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="break-all">{request.bannerUrl}</span>
            </a>
          ) : (
            <p className="break-all text-[11px] text-muted-foreground">
              {request.bannerUrl}
            </p>
          )}
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">
          {request.description}
        </p>
      </div>

      {request.sponsorNote ? (
        <div className="rounded-lg border-l-2 border-border bg-muted/20 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sponsor note
          </p>
          <p className="mt-1 whitespace-pre-line break-words text-sm">
            {request.sponsorNote}
          </p>
        </div>
      ) : null}

      {request.adminNote ? (
        <p className="rounded-md border border-border px-3 py-2 text-xs leading-relaxed">
          <span className="font-medium">Admin note:</span>{" "}
          <span className="text-muted-foreground">{request.adminNote}</span>
        </p>
      ) : null}

      {request.reviewedAt ? (
        <p className="text-[11px] text-muted-foreground">
          Reviewed {formatRelative(request.reviewedAt)}
        </p>
      ) : null}

      {request.contest ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs dark:border-emerald-800 dark:bg-emerald-950">
          <p className="font-semibold text-emerald-900 dark:text-emerald-100">
            Converted to a private contest
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`/admin/contests/${request.contest.id}/operations`}
              className="inline-flex min-h-11 items-center gap-1 font-medium text-emerald-900 underline-offset-2 hover:underline dark:text-emerald-100"
            >
              {request.contest.title}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            <span className="inline-flex min-h-11 items-center font-mono text-[11px] text-emerald-800 dark:text-emerald-200">
              {request.contest.slug}
            </span>
          </div>
        </div>
      ) : null}

      {actions}
    </div>
  );
}
