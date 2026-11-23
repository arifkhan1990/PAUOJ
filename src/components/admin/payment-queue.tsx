"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCheck,
  Loader2,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import {
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
} from "@/lib/learning/payments";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

type Order = {
  id: string;
  kind: "PURCHASE" | "FREE_REQUEST";
  product: "MODULE" | "BUNDLE";
  moduleSlug: string | null;
  amountBdt: number;
  trxId: string | null;
  senderNumber: string | null;
  userNote: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: { username: string; displayName: string };
  label: string;
};

type Filter = "pending" | "all";

const GRANT_OPTIONS = [
  { value: "BUNDLE", label: `All 5 premium modules (৳${BUNDLE_PRICE_BDT} value)` },
  ...PAID_MODULES.map((module) => ({
    value: module.slug,
    label: `Module ${module.order}: ${module.title} (৳${MODULE_PRICE_BDT})`,
  })),
];

export function PaymentQueue() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [grantUser, setGrantUser] = useState("");
  const [grantProduct, setGrantProduct] = useState("BUNDLE");
  const [granting, setGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<string | null>(null);

  const load = useCallback(
    async (nextFilter: Filter, nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await apiGetPage<Order>(
          `/api/v1/admin/payments?status=${nextFilter}&page=${nextPage}`,
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
            : "Could not load payments.",
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

  const review = async (order: Order, action: "APPROVE" | "REJECT") => {
    if (busyId) return;
    let note: string | undefined;
    if (action === "REJECT") {
      const reason = window.prompt("Why are you rejecting this payment?");
      if (!reason || reason.trim().length < 3) return;
      note = reason.trim();
    } else if (
      !window.confirm(
        order.kind === "PURCHASE"
          ? `Approve ৳${order.amountBdt} from @${order.user.username}?`
          : `Grant free access to @${order.user.username}?`,
      )
    ) {
      return;
    }
    setBusyId(order.id);
    setError(null);
    try {
      const updated = await apiPatch<Order>(
        `/api/v1/admin/payments/${order.id}`,
        { action, ...(note ? { note } : {}) },
      );
      setItems((current) =>
        filter === "pending"
          ? current.filter((item) => item.id !== order.id)
          : current.map((item) => (item.id === order.id ? updated : item)),
      );
      setTotal((current) =>
        filter === "pending" ? Math.max(0, current - 1) : current,
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not review this payment.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const grant = async () => {
    if (granting || grantUser.trim().length < 3) return;
    setGranting(true);
    setGrantMessage(null);
    setError(null);
    try {
      const payload =
        grantProduct === "BUNDLE"
          ? { product: "BUNDLE" as const, moduleSlug: null }
          : { product: "MODULE" as const, moduleSlug: grantProduct };
      const result = await apiPost<{ modules: string[]; granted: number }>(
        "/api/v1/admin/entitlements",
        { username: grantUser.trim(), ...payload },
      );
      setGrantMessage(
        `Granted ${result.granted} module${result.granted === 1 ? "" : "s"} to @${grantUser.trim()}.`,
      );
      setGrantUser("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not grant access.",
      );
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Payment status filter"
          className="inline-flex rounded-lg border border-border bg-card p-1"
        >
          {(
            [
              ["pending", "Pending"],
              ["all", "All"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {total} {total === 1 ? "entry" : "entries"}
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
          {[0, 1].map((index) => (
            <Card key={index} className="h-32 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6">
          <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Nothing waiting</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              TrxID submissions and free-access requests appear here for manual
              approval.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((order) => (
            <li key={order.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          order.kind === "FREE_REQUEST" ? "outline" : "secondary"
                        }
                      >
                        {order.kind === "FREE_REQUEST"
                          ? "Free request"
                          : "Payment"}
                      </Badge>
                      <span className="text-sm font-medium">{order.label}</span>
                      <Badge
                        variant={
                          order.status === "PENDING"
                            ? "warning"
                            : order.status === "APPROVED"
                              ? "success"
                              : "muted"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Link
                        href={`/users/${order.user.username}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        @{order.user.username}
                      </Link>{" "}
                      · {order.user.displayName} ·{" "}
                      {formatRelative(order.createdAt)}
                    </p>
                  </div>
                  {order.amountBdt > 0 ? (
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      ৳{order.amountBdt}
                    </p>
                  ) : null}
                </div>

                {order.kind === "PURCHASE" ? (
                  <dl className="mt-3 grid gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">TrxID</dt>
                      <dd className="font-mono font-semibold">{order.trxId}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Sender</dt>
                      <dd className="font-mono">{order.senderNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd>{formatDateTime(order.createdAt)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 rounded-lg border-l-2 border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    {order.userNote || "(no reason provided)"}
                  </p>
                )}

                {order.adminNote ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Admin note: {order.adminNote}
                  </p>
                ) : null}

                {order.status === "PENDING" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void review(order, "APPROVE")}
                      disabled={busyId === order.id}
                    >
                      {busyId === order.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="size-3.5" />
                      )}
                      Approve &amp; unlock
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void review(order, "REJECT")}
                      disabled={busyId === order.id}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                ) : null}
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
          Load more
        </Button>
      ) : null}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Grant free access</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Scholarship/manual unlock without a payment. {PAID_MODULES.length}{" "}
          premium modules are available.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end">
          <div>
            <label className="text-xs font-medium" htmlFor="grant-user">
              Username
            </label>
            <Input
              id="grant-user"
              value={grantUser}
              onChange={(event) => setGrantUser(event.target.value)}
              placeholder="coder123"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="grant-product">
              Access
            </label>
            <SearchableSelect
              id="grant-product"
              options={GRANT_OPTIONS}
              value={grantProduct}
              onValueChange={setGrantProduct}
              className="mt-1.5"
            />
          </div>
          <Button
            type="button"
            onClick={() => void grant()}
            disabled={granting || grantUser.trim().length < 3}
          >
            {granting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Grant
          </Button>
        </div>
        {grantMessage ? (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
            {grantMessage}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
