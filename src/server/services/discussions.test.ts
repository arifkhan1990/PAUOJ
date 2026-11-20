import { describe, expect, it } from "vitest";
import { assembleComments } from "./discussion-mapper";

function row(overrides: {
  id: string;
  parentId?: string | null;
  authorId?: string;
  score?: number;
  myVote?: number;
}) {
  return {
    id: overrides.id,
    parentId: overrides.parentId ?? null,
    body: `body ${overrides.id}`,
    createdAt: new Date("2026-11-18T10:00:00Z"),
    updatedAt: new Date("2026-11-18T10:00:00Z"),
    authorId: overrides.authorId ?? "user-1",
    username: "coder",
    displayName: "Coder",
    role: "USER" as const,
    score: overrides.score ?? 0,
    myVote: overrides.myVote ?? 0,
  };
}

describe("assembleComments", () => {
  it("groups replies under their parent and keeps order", () => {
    const result = assembleComments(
      [row({ id: "a", score: 4 }), row({ id: "b" })],
      [row({ id: "a-1", parentId: "a" }), row({ id: "a-2", parentId: "a" })],
      null,
    );

    expect(result.map((comment) => comment.id)).toEqual(["a", "b"]);
    expect(result[0]?.replies.map((reply) => reply.id)).toEqual([
      "a-1",
      "a-2",
    ]);
    expect(result[1]?.replies).toEqual([]);
  });

  it("marks ownership and admin moderation permissions", () => {
    const comments = [row({ id: "a", authorId: "owner" })];
    const ownerView = assembleComments(comments, [], {
      id: "owner",
      role: "USER",
    });
    const adminView = assembleComments(comments, [], {
      id: "admin",
      role: "ADMIN",
    });
    const strangerView = assembleComments(comments, [], {
      id: "stranger",
      role: "USER",
    });

    expect(ownerView[0]?.canDelete).toBe(true);
    expect(adminView[0]?.canDelete).toBe(true);
    expect(strangerView[0]?.canDelete).toBe(false);
  });

  it("normalizes scores and votes from the database", () => {
    const [comment] = assembleComments(
      [row({ id: "a", score: 3, myVote: -1 })],
      [],
      { id: "viewer", role: "USER" },
    );

    expect(comment?.score).toBe(3);
    expect(comment?.myVote).toBe(-1);
  });

  it("ignores replies whose parent is not on the page", () => {
    const result = assembleComments(
      [row({ id: "a" })],
      [row({ id: "orphan", parentId: "missing" })],
      null,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.replies).toEqual([]);
  });
});
