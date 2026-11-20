export type ProblemRatingSummary = {
  average: number | null;
  count: number;
  myRating: number | null;
};

export type ProblemResourceItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  isVerified: boolean;
  createdAt: string;
  author: { username: string; displayName: string } | null;
};

export type RelatedProblemItem = {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  points: number;
  sharedTags: number;
};
