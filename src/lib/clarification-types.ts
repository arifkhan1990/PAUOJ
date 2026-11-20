export type ContestClarificationItem = {
  id: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
  problem: { id: string; label: string; title: string; slug: string } | null;
  asker: { username: string; displayName: string };
  answerer: { username: string; displayName: string } | null;
  canAnswer: boolean;
};

export type ContestProblemOption = {
  id: string;
  label: string;
  title: string;
};
