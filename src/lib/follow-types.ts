export type FollowConnectionType = "followers" | "following";

export type FollowUserItem = {
  username: string;
  displayName: string;
  institution: string | null;
  rating: number;
  isFollowing: boolean;
  isSelf: boolean;
};

export type FollowConnectionPage = {
  owner: { username: string; displayName: string };
  type: FollowConnectionType;
  items: FollowUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type FollowState = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};
