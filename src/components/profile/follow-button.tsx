"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import type { FollowState } from "@/lib/follow-types";

export function FollowButton({
  username,
  initialFollowing,
  canFollow,
}: {
  username: string;
  initialFollowing: boolean;
  canFollow: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  if (!canFollow) return null;

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    try {
      const state = following
        ? await apiDelete<FollowState>(`/api/v1/users/${username}/follow`)
        : await apiPost<FollowState>(`/api/v1/users/${username}/follow`, {});
      setFollowing(state.following);
      toast({
        title: state.following
          ? `Following @${username}`
          : `Unfollowed @${username}`,
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not update the follow state.";
      toast({
        title: "Follow action failed",
        description: message,
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={following}
      aria-busy={pending}
      aria-label={
        following ? `Unfollow @${username}` : `Follow @${username}`
      }
      variant={following ? "outline" : "default"}
      className="h-11 min-w-28 gap-1.5 rounded-lg px-4 text-sm"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : following ? (
        <UserCheck className="size-4" aria-hidden="true" />
      ) : (
        <UserPlus className="size-4" aria-hidden="true" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
