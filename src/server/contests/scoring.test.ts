import { describe, expect, it } from "vitest";
import { computeScoreboard, type ScoringSubmission } from "./scoring";

const problems = [
  { id: "p1", label: "A" },
  { id: "p2", label: "B" },
];

const participants = [
  { userId: "u1", username: "alice", displayName: "Alice" },
  { userId: "u2", username: "bob", displayName: "Bob" },
];

const startAt = new Date("2026-01-01T10:00:00.000Z");

function at(minutes: number): Date {
  return new Date(startAt.getTime() + minutes * 60_000);
}

function submission(
  userId: string,
  problemId: string,
  status: ScoringSubmission["status"],
  minutes: number,
): ScoringSubmission {
  return { userId, problemId, status, createdAt: at(minutes) };
}

describe("computeScoreboard", () => {
  it("returns zeroed rows for every registered participant", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.solved).toBe(0);
    expect(rows[0]?.problems.A).toEqual({
      solved: false,
      attempts: 0,
      solveTimeMinutes: null,
      firstBlood: false,
    });
  });

  it("adds 20 penalty minutes per rejected attempt before acceptance", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [
        submission("u1", "p1", "WRONG_ANSWER", 5),
        submission("u1", "p1", "RUNTIME_ERROR", 7),
        submission("u1", "p1", "ACCEPTED", 10),
      ],
    });
    const alice = rows.find((row) => row.user.username === "alice");
    expect(alice?.solved).toBe(1);
    expect(alice?.penalty).toBe(10 + 2 * 20);
    expect(alice?.problems.A?.attempts).toBe(2);
    expect(alice?.problems.A?.solveTimeMinutes).toBe(10);
  });

  it("flags the first accepted solve of each problem", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [
        submission("u1", "p1", "WRONG_ANSWER", 5),
        submission("u2", "p1", "ACCEPTED", 10),
        submission("u1", "p1", "ACCEPTED", 15),
      ],
    });
    const alice = rows.find((row) => row.user.username === "alice");
    const bob = rows.find((row) => row.user.username === "bob");
    expect(bob?.problems.A?.firstBlood).toBe(true);
    expect(alice?.problems.A?.firstBlood).toBe(false);
    expect(alice?.problems.B?.firstBlood).toBe(false);
  });

  it("ignores compilation errors in the penalty", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [
        submission("u1", "p1", "COMPILATION_ERROR", 1),
        submission("u1", "p1", "ACCEPTED", 5),
      ],
    });
    const alice = rows.find((row) => row.user.username === "alice");
    expect(alice?.penalty).toBe(5);
    expect(alice?.problems.A?.attempts).toBe(0);
  });

  it("ranks by solved count, then penalty, then last acceptance", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [
        submission("u1", "p1", "ACCEPTED", 30),
        submission("u2", "p1", "ACCEPTED", 10),
        submission("u2", "p2", "ACCEPTED", 20),
      ],
    });
    expect(rows[0]?.user.username).toBe("bob");
    expect(rows[1]?.user.username).toBe("alice");
  });

  it("only counts the first accepted submission per problem", () => {
    const rows = computeScoreboard({
      startAt,
      problems,
      participants,
      submissions: [
        submission("u1", "p1", "ACCEPTED", 5),
        submission("u1", "p1", "ACCEPTED", 10),
      ],
    });
    const alice = rows.find((row) => row.user.username === "alice");
    expect(alice?.solved).toBe(1);
    expect(alice?.penalty).toBe(5);
  });
});
