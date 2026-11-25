import type { PresenceInfo } from "./follow-types";

/** Sort order for the contest rating board; the `rank` column stays global. */
export type RatingSort = "rating" | "peak" | "contests" | "name";

export type RatingRow = {
  rank: number;
  username: string;
  displayName: string;
  institution: string | null;
  country: string | null;
  rating: number;
  maxRating: number;
  contestCount: number;
  lastDelta: number;
  lastContestAt: string; // ISO
  lastContestSlug: string;
  lastContestTitle: string;
  presence: PresenceInfo;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export type RatingFacet = { value: string; count: number };

export type RatingFacets = {
  institutions: RatingFacet[];
  countries: RatingFacet[];
  ratedCoders: number;
};

/** Global rating standing for one coder, or null when they are not rated. */
export type RatingStanding = {
  rank: number;
  rating: number;
  maxRating: number;
  contestCount: number;
} | null;
