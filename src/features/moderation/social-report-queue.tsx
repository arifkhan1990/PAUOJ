"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCheck,
  Flag,
  Loader2,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import { buildQueryString, type SearchParams } from "@/lib/pagination";
import type {
  SocialReportItem,
  SocialReportKind,
  SocialReportReason,
  SocialReportStatus,
} from "@/lib/social-report-types";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

export type SocialReportFilter = "open" | "resolved" | "dismissed" | "all";
export type SocialReportCounts = Record<SocialReportFilter, number>;
type BadgeVariant = NonNullable<BadgeProps["variant"]>;
type CloseStatus = Extract<SocialReportStatus, "RESOLVED" | "DISMISSED">;

export const SOCIAL_REPORT_STATUS_TABS: {
  value: SocialReportFilter;
  label: string;
}[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export const SOCIAL_REPORT_KIND_LABELS: Record<SocialReportKind, string> = {
  MESSAGE: "Message", CONVERSATION: "Conversation",
  FOLLOW_REQUEST: "Follow request", PROFILE: "Profile",
};

export const SOCIAL_REPORT_REASON_LABELS: Record<SocialReportReason, string> = {
  SPAM: "Spam", HARASSMENT: "Harassment", HATE: "Hate speech",
  SCAM: "Scam", IMPERSONATION: "Impersonation", OTHER: "Other",
};

export function statusTabLabel(value: SocialReportFilter): string {
  return (
    SOCIAL_REPORT_STATUS_TABS.find((tab) => tab.value === value)?.label ?? "All"
  );
}

export function socialReportKindLabel(kind: SocialReportKind): string {
  return SOCIAL_REPORT_KIND_LABELS[kind];
}

export function socialReportReasonLabel(reason: SocialReportReason): string {
  return SOCIAL_REPORT_REASON_LABELS[reason];
}

/** Status-tab link that drops the previous page offset. */
export function socialReportHref(
  basePath: string,
  searchParams: SearchParams,
  status: SocialReportFilter,
  page?: number,
): string {
  const query = buildQueryString(searchParams, { status, page });
  return query ? `${basePath}?${query}` : basePath;
}

const STATUS_META: Record<SocialReportStatus, { label: string; variant: BadgeVariant; Icon: LucideIcon }> = {
  OPEN: { label: "Open", variant: "warning", Icon: Flag },
  RESOLVED: { label: "Resolved", variant: "success", Icon: CheckCheck },
  DISMISSED: { label: "Dismissed", variant: "muted", Icon: XCircle },
};

const REASON_VARIANTS: Record<SocialReportReason, BadgeVariant> = {
  SPAM: "warning", SCAM: "warning", HARASSMENT: "destructive",
  HATE: "destructive", IMPERSONATION: "destructive", OTHER: "muted",
};

const EMPTY_TITLE: Record<SocialReportFilter, string> = {
  open: "No open social reports", resolved: "Nothing resolved yet",
  dismissed: "Nothing dismissed yet", all: "No social reports yet",
};

const EMPTY_HINT: Record<SocialReportFilter, string> = {
  open: "Reported messages, conversations, profiles and follow requests land here.",
  resolved: "Resolved reports stay here so every decision stays auditable.",
  dismissed: "Dismissed reports stay here so every decision stays auditable.",
  all: "When someone reports a message, conversation, profile or follow request, it appears here.",
};

const NOTE_LIMIT = 500;
const NOTICE_CLASS =
  "flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6";
const PROFILE_LINK_CLASS =
  "rounded-sm font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SocialReportQueue({
  items,
  status,
  counts,
  total,
  searchParams,
  basePath = "/admin/social-reports",
  pastEnd = false,
}: {
  items: SocialReportItem[];
  status: SocialReportFilter;
  counts: SocialReportCounts;
  total: number;
  searchParams: SearchParams;
  basePath?: string;
  pastEnd?: boolean;
}) {
  const [rows, setRows] = useState<SocialReportItem[]>(items);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{
    id: string;
    status: CloseStatus;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const locked = pending !== null;

  useEffect(() => {
    setRows(items);
  }, [items]);

  const moderate = async (report: SocialReportItem, next: CloseStatus) => {
    if (pending) return;
    const note = (notes[report.id] ?? "").trim().slice(0, NOTE_LIMIT);
    setPending({ id: report.id, status: next });
    setError(null);
    try {
      const updated = await apiPatch<SocialReportItem>(
        `/api/v1/admin/social-reports/${report.id}`,
        note ? { status: next, note } : { status: next },
      );
      setRows((current) =>
        status === "open"
          ? current.filter((row) => row.id !== report.id)
          : current.map((row) => (row.id === report.id ? updated : row)),
      );
      setNotes((current) => {
        if (!(report.id in current)) return current;
        const nextNotes = { ...current };
        delete nextNotes[report.id];
        return nextNotes;
      });
      toast({
        title: next === "RESOLVED" ? "Report resolved" : "Report dismissed",
        description: `The report about @${report.target.username} is closed.`,
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not update the report. Please try again.";
      setError(message);
      toast({ title: "Update failed", description: message, variant: "error" });
      if (requestError instanceof ApiClientError && requestError.status === 409) {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Filter reports by status"
          className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1"
        >
          {SOCIAL_REPORT_STATUS_TABS.map((tab) => {
            const active = tab.value === status;
            return (
              <Link
                key={tab.value}
                href={socialReportHref(basePath, searchParams, tab.value)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-3",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {statusTabLabel(tab.value)}
                <span
                  className={cn(
                    "rounded px-1 font-mono text-[10px] tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[tab.value]}
                </span>
              </Link>
            );
          })}
        </nav>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {total} {total === 1 ? "report" : "reports"}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <p className="inline-flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </Button>
        </div>
      ) : null}

      {pastEnd ? (
        <div className={NOTICE_CLASS}>
          <Flag className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Nothing on this page</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This page is past the end of the queue for this filter.
            </p>
            <Link
              href={socialReportHref(basePath, searchParams, status, 1)}
              className="mt-2 inline-flex min-h-11 items-center rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back to page 1
            </Link>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className={NOTICE_CLASS}>
          <Flag className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{EMPTY_TITLE[status]}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {EMPTY_HINT[status]}
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((report) => {
            const meta = STATUS_META[report.status];
            const note = notes[report.id] ?? "";
            const noteId = `social-report-note-${report.id}`;
            const countId = `social-report-note-count-${report.id}`;
            const busy =
              pending && pending.id === report.id ? pending.status : null;
            const contextIds: { label: string; value: string }[] = [];
            if (report.conversationId) {
              contextIds.push({ label: "Conversation", value: report.conversationId });
            }
            if (report.messageId) {
              contextIds.push({ label: "Message", value: report.messageId });
            }
            return (
              <li key={report.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="outline">{socialReportKindLabel(report.kind)}</Badge>
                      <Badge variant={REASON_VARIANTS[report.reason]}>
                        {socialReportReasonLabel(report.reason)}
                      </Badge>
                      <Badge variant={meta.variant}>
                        <meta.Icon className="size-3" aria-hidden="true" />
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      <time dateTime={report.createdAt} title={formatDateTime(report.createdAt)}>
                        {formatRelative(report.createdAt)}
                      </time>
                    </p>
                  </div>

                  <p className="mt-2 min-w-0 break-words text-xs text-muted-foreground">
                    Reported by{" "}
                    <Link href={`/users/${report.reporter.username}`} className={PROFILE_LINK_CLASS}>
                      @{report.reporter.username}
                    </Link>{" "}
                    about{" "}
                    <Link href={`/users/${report.target.username}`} className={PROFILE_LINK_CLASS}>
                      @{report.target.username}
                    </Link>
                  </p>

                  {report.excerpt ? (
                    <blockquote className="mt-3 whitespace-pre-wrap break-words rounded-lg border-l-2 border-border bg-muted/20 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                      {report.excerpt}
                    </blockquote>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No message excerpt was attached to this report.
                    </p>
                  )}

                  {report.details ? (
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Details:</span>{" "}
                      {report.details}
                    </p>
                  ) : null}

                  {contextIds.length > 0 ? (
                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      {contextIds.map((entry) => (
                        <div key={entry.label} className="flex min-w-0 gap-1">
                          <dt className="font-medium">{entry.label}</dt>
                          <dd className="break-all font-mono">{entry.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {report.status !== "OPEN" ? (
                    <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <p className="text-[11px] font-medium">Resolution note</p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                        {report.resolutionNote || "No note was left."}
                      </p>
                      {report.resolvedAt ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          <time dateTime={report.resolvedAt} title={formatDateTime(report.resolvedAt)}>
                            {meta.label} {formatRelative(report.resolvedAt)}
                          </time>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <label htmlFor={noteId} className="block text-[11px] font-medium">
                        Resolution note{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional, {NOTE_LIMIT} characters max)
                        </span>
                      </label>
                      <Textarea
                        id={noteId}
                        value={note}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [report.id]: event.target.value.slice(0, NOTE_LIMIT),
                          }))
                        }
                        maxLength={NOTE_LIMIT}
                        rows={2}
                        disabled={locked}
                        placeholder="What did you check, and what did you do?"
                        aria-describedby={countId}
                        className="min-h-20 text-sm"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p id={countId} className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {note.length}/{NOTE_LIMIT}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {(["DISMISSED", "RESOLVED"] as const).map((next) => {
                            const Icon = next === "RESOLVED" ? CheckCheck : XCircle;
                            const label = next === "RESOLVED" ? "Resolve" : "Dismiss";
                            return (
                              <Button
                                key={next}
                                type="button"
                                variant={next === "RESOLVED" ? "success" : "outline"}
                                className="min-h-11"
                                onClick={() => void moderate(report, next)}
                                disabled={locked}
                                aria-label={`${label} the report by @${report.reporter.username} about @${report.target.username}`}
                              >
                                {busy === next ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Icon className="size-3.5" aria-hidden="true" />
                                )}
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
