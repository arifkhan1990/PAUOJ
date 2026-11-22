"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCheck,
  ExternalLink,
  Flag,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiClientError, apiGetPage, apiPatch } from "@/lib/api-client";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

type LessonReportItem = {
  id: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  resolvedAt: string | null;
  comment: {
    id: string;
    excerpt: string;
    deleted: boolean;
    author: { username: string; displayName: string };
  };
  lesson: { moduleSlug: string; topicSlug: string; title: string };
};

type Filter = "open" | "resolved" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

export function LessonReportQueue() {
  const [filter, setFilter] = useState<Filter>("open");
  const [items, setItems] = useState<LessonReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextFilter: Filter, nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await apiGetPage<LessonReportItem>(
          `/api/v1/admin/lesson-reports?status=${nextFilter}&page=${nextPage}`,
        );
        setItems((current) =>
          append ? [...current, ...result.items] : result.items,
        );
        setTotal(result.meta.total);
        setPage(nextPage);
      } catch (requestError) {
        setError(
          requestError instanceof ApiClientError
            ? requestError.message
            : "Could not load the reports. Please try again.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(filter, 1, false);
  }, [filter, load]);

  const resolve = async (report: LessonReportItem) => {
    if (resolvingId) return;
    setResolvingId(report.id);
    setError(null);
    try {
      const updated = await apiPatch<LessonReportItem>(
        `/api/v1/admin/lesson-reports/${report.id}`,
        { status: "RESOLVED" },
      );
      setItems((current) =>
        filter === "open"
          ? current.filter((item) => item.id !== report.id)
          : current.map((item) => (item.id === report.id ? updated : item)),
      );
      setTotal((current) =>
        filter === "open" ? Math.max(0, current - 1) : current,
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not resolve the report.",
      );
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Report status filter"
          className="inline-flex rounded-lg border border-border bg-card p-1"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                filter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {total} {total === 1 ? "report" : "reports"}
        </p>
      </div>

      {error ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
          role="alert"
        >
          <p className="inline-flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load(filter, 1, false)}
          >
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="h-28 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6">
          <Flag className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">
              {filter === "open" ? "No open reports" : "No reports here yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reported lesson comments land in this queue and notify every admin
              in-app.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((report) => (
            <li key={report.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={report.status === "OPEN" ? "warning" : "success"}>
                        {report.status === "OPEN" ? (
                          <Flag className="size-3" aria-hidden="true" />
                        ) : (
                          <CheckCheck className="size-3" aria-hidden="true" />
                        )}
                        {report.status === "OPEN" ? "Open" : "Resolved"}
                      </Badge>
                      <Link
                        href={`/learn/${report.lesson.moduleSlug}/${report.lesson.topicSlug}#discussion`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                      >
                        {report.lesson.title}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </Link>
                      {report.comment.deleted ? (
                        <Badge variant="muted">Comment deleted</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reported by{" "}
                      <Link
                        href={`/users/${report.comment.author.username}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        @{report.comment.author.username}
                      </Link>{" "}
                      · {formatRelative(report.createdAt)}
                    </p>
                  </div>
                  {report.status === "OPEN" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void resolve(report)}
                      disabled={resolvingId === report.id}
                    >
                      {resolvingId === report.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="size-3.5" />
                      )}
                      Resolve
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Resolved{" "}
                      {report.resolvedAt
                        ? formatRelative(report.resolvedAt)
                        : ""}
                    </p>
                  )}
                </div>

                <blockquote className="mt-3 rounded-lg border-l-2 border-border bg-muted/20 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  {report.comment.excerpt || "(empty comment)"}
                </blockquote>

                <p className="mt-2 text-xs leading-relaxed">
                  <span className="font-medium">Reason:</span>{" "}
                  <span className="text-muted-foreground">{report.reason}</span>
                </p>
                <p
                  className="mt-1 text-[10px] text-muted-foreground"
                  title={formatDateTime(report.createdAt)}
                >
                  Reported {formatRelative(report.createdAt)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {items.length < total ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load(filter, page + 1, true)}
          disabled={loadingMore}
        >
          {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Load more reports
        </Button>
      ) : null}
    </div>
  );
}
