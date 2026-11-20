"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import type { ContestProblemApprovalItem } from "@/lib/contest-approval-types";
import { formatDateTime, formatRelative } from "@/lib/utils";

export function ContestApprovalList({
  items,
}: {
  items: ContestProblemApprovalItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeclineOpen, setBulkDeclineOpen] = useState(false);
  const [bulkNote, setBulkNote] = useState("");

  const decide = async (
    item: ContestProblemApprovalItem,
    action: "approve" | "reject",
    reviewNote?: string,
  ) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/v1/contest-problem-approvals/${item.id}`, {
        action,
        reviewNote: reviewNote ?? "",
      });
      toast({
        title: action === "approve" ? "Problem approved" : "Problem declined",
        description:
          action === "approve"
            ? `"${item.problemTitle}" can be used in "${item.contestTitle}".`
            : "The contest creator has been notified.",
        variant: action === "approve" ? "success" : "warning",
      });
      setRejectingId(null);
      setRejectNote("");
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Could not update the request.",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const bulkDecide = async (action: "approve" | "reject") => {
    const selected = items.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) return;
    if (action === "reject" && bulkNote.trim().length < 3) {
      toast({
        title: "Add a reason",
        description: "Explain why these problems should not be used.",
        variant: "warning",
      });
      return;
    }
    setBulkBusy(true);
    let succeeded = 0;
    let failed = 0;
    for (const item of selected) {
      try {
        await apiPatch(`/api/v1/contest-problem-approvals/${item.id}`, {
          action,
          reviewNote: bulkNote,
        });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    toast({
      title: action === "approve" ? "Bulk approval finished" : "Bulk decline finished",
      description: `${succeeded} ${action === "approve" ? "approved" : "declined"}${failed ? `, ${failed} failed` : ""}.`,
      variant: failed ? "warning" : action === "approve" ? "success" : "warning",
    });
    setSelectedIds(new Set());
    setBulkDeclineOpen(false);
    setBulkNote("");
    setBulkBusy(false);
    router.refresh();
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <label className="inline-flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) =>
              setSelectedIds(
                event.target.checked
                  ? new Set(items.map((item) => item.id))
                  : new Set(),
              )
            }
            className="size-3.5 accent-[var(--primary)]"
          />
          Select all
        </label>
        <span className="text-xs text-muted-foreground">
          {selectedIds.size} selected
        </span>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button
            type="button"
            size="sm"
            variant="success"
            disabled={selectedIds.size === 0 || bulkBusy || busyId !== null}
            onClick={() => void bulkDecide("approve")}
          >
            <Check className="size-3.5" /> Approve selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedIds.size === 0 || bulkBusy || busyId !== null}
            onClick={() => setBulkDeclineOpen((value) => !value)}
          >
            <X className="size-3.5" /> Decline selected
          </Button>
        </div>
      </div>

      {bulkDeclineOpen ? (
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/40">
          <Textarea
            autoFocus
            value={bulkNote}
            onChange={(event) => setBulkNote(event.target.value)}
            rows={2}
            maxLength={1_000}
            placeholder="Why should the selected problems not be used?"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={bulkBusy || bulkNote.trim().length < 3}
              onClick={() => void bulkDecide("reject")}
            >
              Confirm decline
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setBulkDeclineOpen(false);
                setBulkNote("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {items.map((item) => {
        const busy = busyId === item.id;
        return (
          <Card key={item.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Select ${item.problemTitle}`}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  <Badge variant="warning">Author approval needed</Badge>
                  <Badge variant="outline">
                    <ShieldCheck className="size-3" />
                    Contest problem
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {item.contestTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Wants to use{" "}
                  <span className="font-medium text-foreground">
                    {item.problemTitle}
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Starts {formatDateTime(item.contestStartAt)}
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Requested by{" "}
              {item.requester ? (
                <span className="font-medium text-foreground">
                  {item.requester.displayName}
                </span>
              ) : (
                "a setter"
              )}{" "}
              · {formatRelative(item.createdAt)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Button
                type="button"
                size="sm"
                variant="success"
                disabled={busy}
                onClick={() => void decide(item, "approve")}
              >
                <Check className="size-3.5" /> Allow in contest
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  setRejectingId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                <X className="size-3.5" /> Decline
              </Button>
            </div>

            {rejectingId === item.id ? (
              <div className="mt-3 space-y-2 rounded-md border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/40">
                <Textarea
                  autoFocus
                  value={rejectNote}
                  onChange={(event) => setRejectNote(event.target.value)}
                  rows={2}
                  maxLength={1_000}
                  placeholder="Why should this problem not be used in the contest?"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy || rejectNote.trim().length < 3}
                    onClick={() => void decide(item, "reject", rejectNote)}
                  >
                    Confirm decline
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
