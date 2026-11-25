import type { FollowState, FollowUserItem } from "./follow-types";

export type FollowMode =
  | "none"
  | "requested"
  | "following"
  | "incoming"
  | "blocked";

type FollowFlags = Pick<
  FollowState,
  "following" | "requested" | "incomingRequest" | "blocked"
>;

/**
 * Collapses the raw follow flags into the single action the button offers.
 * An incoming request wins over an outgoing one because accepting is the only
 * useful action in that state; a block disables every social action.
 */
export function followMode(state: FollowFlags): FollowMode {
  if (state.blocked) return "blocked";
  if (state.incomingRequest) return "incoming";
  if (state.requested) return "requested";
  if (state.following) return "following";
  return "none";
}

export function followActionLabel(mode: FollowMode): string {
  switch (mode) {
    case "following":
      return "Following";
    case "requested":
      return "Requested";
    case "incoming":
      return "Accept request";
    default:
      return "Follow";
  }
}

export function followActionAriaLabel(
  mode: FollowMode,
  username: string,
): string {
  switch (mode) {
    case "following":
      return `Unfollow @${username}`;
    case "requested":
      return `Cancel follow request to @${username}`;
    case "incoming":
      return `Accept follow request from @${username}`;
    default:
      return `Follow @${username}`;
  }
}

/**
 * Connection rows only carry the accepted-follow flag. The button reads the
 * follow flags, so the unused counters are filled with zeros.
 */
export function followStateForItem(
  item: Pick<FollowUserItem, "isFollowing">,
): FollowState {
  return {
    following: item.isFollowing,
    requested: false,
    incomingRequest: false,
    followerCount: 0,
    followingCount: 0,
    blocked: false,
    canMessage: false,
  };
}
