import type {
  CommentVote,
  ProblemComment,
} from "@/lib/types";
import type { SafeUser } from "@/server/auth/session";

export type DiscussionViewer = Pick<SafeUser, "id" | "role"> | null;

export type CommentRow = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  username: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | null;
  score: number | string;
  myVote: number | string;
};

export function assembleComments(
  topLevel: CommentRow[],
  replies: CommentRow[],
  viewer: DiscussionViewer,
): ProblemComment[] {
  const mapped = new Map<string, ProblemComment>();
  const mapRow = (row: CommentRow): ProblemComment => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    score: Number(row.score) || 0,
    myVote: (Number(row.myVote) || 0) as CommentVote,
    canDelete: Boolean(
      viewer && (viewer.id === row.authorId || viewer.role === "ADMIN"),
    ),
    author: {
      id: row.authorId,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      avatarPreset: row.avatarPreset,
      avatarImageUpdatedAt: row.avatarImageUpdatedAt?.toISOString() ?? null,
    },
    replies: [],
  });

  for (const row of topLevel) {
    mapped.set(row.id, mapRow(row));
  }
  for (const row of replies) {
    const parent = row.parentId ? mapped.get(row.parentId) : undefined;
    if (parent) parent.replies.push(mapRow(row));
  }
  return [...mapped.values()];
}
