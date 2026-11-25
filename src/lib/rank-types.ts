import type { PresenceInfo } from "./follow-types";

/** Sort order for the global ranking board; the `rank` column stays global. */
export type RankSort = "points" | "solved" | "name";

export type RankFacet = { value: string; count: number };

export type RankFacets = {
  institutions: RankFacet[];
  countries: RankFacet[];
  rankedCoders: number;
};

/** Global standing for one coder, or null when nothing counted yet. */
export type RankStanding = {
  rank: number;
  points: number;
  solvedCount: number;
} | null;

export type RankRow = {
  rank: number;
  username: string;
  displayName: string;
  institution: string | null;
  country: string | null;
  points: number;
  solvedCount: number;
  submissionCount: number;
  acceptanceRate: number;
  lastAcceptedAt: string | null;
  presence: PresenceInfo;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};
