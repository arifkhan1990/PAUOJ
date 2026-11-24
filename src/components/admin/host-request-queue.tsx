"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { HostRequestActions } from "@/components/admin/host-request-actions";
import { HostRequestCard } from "@/components/admin/host-request-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabBar, tabId, type TabBarItem } from "@/components/ui/tab-bar";
import { ApiClientError, apiGetPage } from "@/lib/api-client";
import {
  CONTEST_HOST_REQUEST_STATUS_LABEL,
  type ContestHostRequestStatus,
  type ContestHostRequestView,
} from "@/lib/contest-ops";

type Filter = ContestHostRequestStatus | "ALL";

const FILTERS: TabBarItem[] = [
  ...(
    [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "CONVERTED",
    ] as ContestHostRequestStatus[]
  ).map((status) => ({
    value: status,
    label: CONTEST_HOST_REQUEST_STATUS_LABEL[status],
  })),
  { value: "ALL", label: "All" },
];

const PANEL_ID = "host-request-panel";
const PAGE_SIZE = 10;

export function HostRequestQueue() {
  const [filter, setFilter] = useState<Filter>("SUBMITTED");
  const [items, setItems] = useState<ContestHostRequestView[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilter: Filter, nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
      });
      if (nextFilter !== "ALL") query.set("status", nextFilter);
      const result = await apiGetPage<ContestHostRequestView>(
        `/api/v1/admin/host-requests?${query.toString()}`,
      );
      setItems(result.items);
      setPage(result.meta.page);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not load host requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter, 1);
  }, [filter, load]);

  return (
    <div className="space-y-4">
      <TabBar
        idPrefix="host-requests"
        ariaLabel="Host request status"
        items={FILTERS}
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        panelId={PANEL_ID}
      />

      <div
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={tabId("host-requests", filter)}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="font-mono text-[11px] tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {total} {total === 1 ? "request" : "requests"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 sm:min-h-8"
            onClick={() => void load(filter, page)}
            disabled={loading}
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
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
              className="min-h-11 sm:min-h-8"
              onClick={() => void load(filter, page)}
            >
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((index) => (
              <Card key={index} className="h-40 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6">
            <Inbox
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">
                {filter === "SUBMITTED"
                  ? "No new host requests"
                  : "Nothing in this status"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Community members submit a full brief with a ৳3,000–৳5,000
                arrangement fee and transaction reference.
              </p>
              <Link
                href="/contests/host"
                className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-primary hover:underline"
              >
                View the host request form
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((request) => (
              <li key={request.id}>
                <Card className="p-4 sm:p-5">
                  <HostRequestCard
                    request={request}
                    actions={
                      <HostRequestActions
                        request={request}
                        onUpdated={() => {
                          void load(filter, page);
                        }}
                      />
                    }
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-center gap-3"
            aria-label="Host request pages"
          >
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => void load(filter, page - 1)}
              disabled={loading || page <= 1}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Previous
            </Button>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => void load(filter, page + 1)}
              disabled={loading || page >= totalPages}
            >
              Next
            </Button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
