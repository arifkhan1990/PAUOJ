"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, TrendingUp, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { ReportButton } from "@/features/moderation/report-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type { FollowRequestItem, FollowState } from "@/lib/follow-types";
import { formatDate } from "@/lib/utils";

type Action = "accept" | "decline";
type Pending = { username: string; action: Action };

export function FollowRequestList({ items }: { items: FollowRequestItem[] }) {
  const [handled, setHandled] = useState<Record<string, true>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const respond = async (username: string, action: Action) => {
    if (pending) return;
    setPending({ username, action });
    try {
      await apiPost<FollowState>(
        `/api/v1/users/${encodeURIComponent(username)}/follow/${action}`,
        {},
      );
      setHandled((current) => ({ ...current, [username]: true }));
      toast({
        title:
          action === "accept"
            ? `Accepted @${username}`
            : `Declined @${username}`,
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update the request",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again in a moment.",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  const visible = items.filter((item) => !handled[item.username]);

  if (visible.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        All caught up — no pending follow requests.
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {visible.map((item) => {
        const rowPending =
          pending?.username === item.username ? pending.action : null;
        const locked = pending !== null;
        return (
          <li
            key={item.username}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
              <UserAvatar
                name={item.displayName}
                username={item.username}
                size="md"
                avatarPreset={item.avatarPreset}
                avatarImageAt={item.avatarImageUpdatedAt}
              />
              <div className="min-w-0">
                <Link
                  href={`/users/${item.username}`}
                  className="block truncate text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.displayName}
                </Link>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  @{item.username}
                </p>
                {item.institution ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.institution}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PresenceIndicator presence={item.presence} variant="compact" />
                  <span className="text-[11px] text-muted-foreground">
                    Requested {formatDate(item.requestedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] font-medium tabular-nums">
                <TrendingUp
                  className="size-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">Rating </span>
                {item.rating.toLocaleString("en-US")}
              </span>
              <Button
                type="button"
                onClick={() => void respond(item.username, "accept")}
                disabled={locked}
                aria-busy={rowPending === "accept"}
                aria-label={`Accept follow request from @${item.username}`}
                className="h-11 flex-1 gap-1.5 rounded-lg px-3 text-xs sm:flex-none"
              >
                {rowPending === "accept" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void respond(item.username, "decline")}
                disabled={locked}
                aria-busy={rowPending === "decline"}
                aria-label={`Decline follow request from @${item.username}`}
                className="h-11 flex-1 gap-1.5 rounded-lg px-3 text-xs sm:flex-none"
              >
                {rowPending === "decline" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
                Decline
              </Button>
              <ReportButton
                kind="FOLLOW_REQUEST"
                username={item.username}
                label="Report"
                ariaLabel={`Report follow request from @${item.username}`}
                className="shrink-0"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
