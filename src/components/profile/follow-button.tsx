"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import type { FollowState } from "@/lib/follow-types";
import { followActionAriaLabel, followActionLabel, followMode } from "@/lib/follow-state";

type PendingAction = "follow" | "accept" | "decline";

export function FollowButton({
  username,
  initialState,
  compact = false,
}: {
  username: string;
  initialState: FollowState;
  /** Denser hero treatment; mobile keeps a 44px touch target. */
  compact?: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const buttonClass = compact
    ? "h-11 min-w-0 gap-1.5 rounded-lg px-3 text-xs sm:h-9"
    : "h-11 min-w-28 gap-1.5 rounded-lg px-4 text-sm";

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const mode = followMode(state);
  if (mode === "blocked") return null;

  const path = `/api/v1/users/${encodeURIComponent(username)}/follow`;

  const act = async (
    action: PendingAction,
    request: () => Promise<FollowState>,
    successTitle: (next: FollowState) => string,
  ) => {
    if (pending) return;
    setPending(action);
    try {
      const next = await request();
      setState(next);
      toast({ title: successTitle(next), variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Follow action failed",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Could not update the follow state.",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  const toggleFollow = () => {
    if (mode === "following") {
      return act(
        "follow",
        () => apiDelete<FollowState>(path),
        () => `Unfollowed @${username}`,
      );
    }
    if (mode === "requested") {
      return act(
        "follow",
        () => apiDelete<FollowState>(path),
        () => "Follow request cancelled",
      );
    }
    return act(
      "follow",
      () => apiPost<FollowState>(path, {}),
      (next) =>
        next.requested && !next.following
          ? `Request sent to @${username}`
          : `Following @${username}`,
    );
  };

  const accept = () =>
    act(
      "accept",
      () => apiPost<FollowState>(`${path}/accept`, {}),
      () => "Follow request accepted",
    );

  const decline = () =>
    act(
      "decline",
      () => apiPost<FollowState>(`${path}/decline`, {}),
      () => "Follow request declined",
    );

  if (mode === "incoming") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => void accept()}
          disabled={pending !== null}
          aria-busy={pending === "accept"}
          aria-label={followActionAriaLabel("incoming", username)}
          className={buttonClass}
        >
          {pending === "accept" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserCheck className="size-4" aria-hidden="true" />
          )}
          Accept request
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void decline()}
          disabled={pending !== null}
          aria-busy={pending === "decline"}
          aria-label={`Decline follow request from @${username}`}
          className={buttonClass}
        >
          {pending === "decline" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
          Decline
        </Button>
      </div>
    );
  }

  const Icon =
    mode === "following" ? UserCheck : mode === "requested" ? Clock : UserPlus;

  return (
    <Button
      type="button"
      onClick={() => void toggleFollow()}
      disabled={pending !== null}
      aria-busy={pending !== null}
      aria-pressed={mode === "following"}
      aria-label={followActionAriaLabel(mode, username)}
      variant={mode === "none" ? "default" : "outline"}
      className={buttonClass}
    >
      {pending !== null ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="size-4" aria-hidden="true" />
      )}
      {followActionLabel(mode)}
    </Button>
  );
}
