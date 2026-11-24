import type { FollowConnectionType } from "./follow-types";

/** Unknown or missing `?tab=` values fall back to the followers list. */
export function readFollowTab(
  value: string | string[] | undefined,
): FollowConnectionType {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "following" ? "following" : "followers";
}

export function followTabLabel(type: FollowConnectionType): string {
  return type === "followers" ? "Followers" : "Following";
}
