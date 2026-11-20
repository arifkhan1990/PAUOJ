export type CommentVote = -1 | 0 | 1;

export type ProblemComment = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  myVote: CommentVote;
  canDelete: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    role: "USER" | "TEACHER" | "ADMIN";
  };
  replies: ProblemComment[];
};

export type ProblemCommentSort = "top" | "new";
