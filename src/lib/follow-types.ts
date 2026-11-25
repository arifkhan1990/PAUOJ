export type FollowConnectionType = "followers" | "following";

export type PresenceState = "ONLINE" | "RECENT" | "OFFLINE" | "HIDDEN";

export type PresenceInfo = {
  state: PresenceState;
  /** Human-readable, server-computed label: "Online now", "Active 3h ago". */
  label: string | null;
};

export type FollowUserItem = {
  username: string;
  displayName: string;
  institution: string | null;
  rating: number;
  isFollowing: boolean;
  isSelf: boolean;
  presence: PresenceInfo;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export type FollowConnectionPage = {
  owner: {
    username: string;
    displayName: string;
    avatarPreset: string | null;
    avatarImageUpdatedAt: string | null;
  };
  type: FollowConnectionType;
  items: FollowUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type FollowState = {
  /** An accepted edge from the viewer to this profile. */
  following: boolean;
  /** The viewer has a pending follow request waiting for approval. */
  requested: boolean;
  /** This profile has a pending request to follow the viewer. */
  incomingRequest: boolean;
  followerCount: number;
  followingCount: number;
  /** Either side blocked the other; social actions are unavailable. */
  blocked: boolean;
  /** An accepted follow edge exists in either direction, so DMs are open. */
  canMessage: boolean;
};

export type FollowRequestItem = {
  username: string;
  displayName: string;
  institution: string | null;
  rating: number;
  requestedAt: string;
  presence: PresenceInfo;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export type FollowRequestPage = {
  items: FollowRequestItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlockedUserItem = {
  username: string;
  displayName: string;
  blockedAt: string;
};
