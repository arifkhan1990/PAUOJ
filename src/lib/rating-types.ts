export type RatingParticipant = {
  userId: string;
  rank: number;
  rating: number;
};

export type RatingChangeResult = {
  userId: string;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
};

export type RatingHistoryItem = {
  contestSlug: string;
  contestTitle: string;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
  createdAt: string;
};
