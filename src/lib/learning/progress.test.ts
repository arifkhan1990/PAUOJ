import { describe, expect, it } from "vitest";
import {
  buildLearningCheckpointView,
  checkpointStatus,
  computeProgress,
  isCheckpointComplete,
  isModuleUnlocked,
  moduleUnlockHint,
  progressForProblemViews,
  toLearningProblemViews,
} from "./progress";
import type {
  LearningCheckpointDefinition,
  LearningProblemView,
} from "@/lib/learning/types";

const now = new Date("2026-01-10T12:00:00.000Z");

describe("computeProgress", () => {
  it("returns zero percent when there is nothing to solve", () => {
    expect(computeProgress(0, 0)).toEqual({ solved: 0, total: 0, percent: 0 });
    expect(computeProgress(3, 0)).toEqual({ solved: 0, total: 0, percent: 0 });
  });

  it("rounds the percentage and clamps out-of-range counts", () => {
    expect(computeProgress(1, 3)).toEqual({ solved: 1, total: 3, percent: 33 });
    expect(computeProgress(2, 3)).toEqual({ solved: 2, total: 3, percent: 67 });
    expect(computeProgress(5, 2)).toEqual({ solved: 2, total: 2, percent: 100 });
    expect(computeProgress(-1, 2)).toEqual({ solved: 0, total: 2, percent: 0 });
  });
});

describe("checkpointStatus", () => {
  it("reports NOT_STARTED without an attempt", () => {
    expect(checkpointStatus(now, null)).toBe("NOT_STARTED");
  });

  it("reports COMPLETED even after the window closed", () => {
    const attempt = {
      startedAt: new Date("2026-01-10T10:00:00.000Z"),
      endsAt: new Date("2026-01-10T11:00:00.000Z"),
      completedAt: new Date("2026-01-10T10:40:00.000Z"),
    };
    expect(checkpointStatus(now, attempt)).toBe("COMPLETED");
  });

  it("stays ACTIVE inside the window", () => {
    const attempt = {
      startedAt: new Date("2026-01-10T11:30:00.000Z"),
      endsAt: new Date("2026-01-10T12:15:00.000Z"),
      completedAt: null,
    };
    expect(checkpointStatus(now, attempt)).toBe("ACTIVE");
  });

  it("expires exactly at endsAt", () => {
    const attempt = {
      startedAt: new Date("2026-01-10T11:00:00.000Z"),
      endsAt: now,
      completedAt: null,
    };
    expect(checkpointStatus(now, attempt)).toBe("EXPIRED");
  });

  it("expires after the window", () => {
    const attempt = {
      startedAt: new Date("2026-01-10T09:00:00.000Z"),
      endsAt: new Date("2026-01-10T09:45:00.000Z"),
      completedAt: null,
    };
    expect(checkpointStatus(now, attempt)).toBe("EXPIRED");
  });
});

describe("isCheckpointComplete", () => {
  const required = ["a", "b", "c"];

  it("requires every checkpoint problem", () => {
    expect(isCheckpointComplete(["a", "b", "c"], required)).toBe(true);
    expect(isCheckpointComplete(["a", "b"], required)).toBe(false);
  });

  it("ignores duplicate solved slugs", () => {
    expect(isCheckpointComplete(["a", "a", "b", "b", "c"], required)).toBe(true);
  });

  it("ignores unrelated solved slugs", () => {
    expect(isCheckpointComplete(["a", "b", "c", "extra"], required)).toBe(true);
    expect(isCheckpointComplete(["extra"], required)).toBe(false);
  });

  it("is not complete when there is no required problem", () => {
    expect(isCheckpointComplete(["a"], [])).toBe(false);
  });
});

function problemView(slug: string, solved: boolean): LearningProblemView {
  return {
    slug,
    title: `Problem ${slug}`,
    difficulty: "EASY",
    points: 100,
    solved,
    attempted: solved,
  };
}

describe("progressForProblemViews", () => {
  it("counts duplicate slugs once", () => {
    const views = [
      problemView("a", true),
      problemView("a", true),
      problemView("b", false),
    ];
    expect(progressForProblemViews(views)).toEqual({
      solved: 1,
      total: 2,
      percent: 50,
    });
  });
});

describe("toLearningProblemViews", () => {
  it("keeps curriculum order and skips problems missing from the database", () => {
    const rows = new Map([
      ["b", { slug: "b", title: "B", difficulty: "MEDIUM" as const, points: 200 }],
      ["a", { slug: "a", title: "A", difficulty: "EASY" as const, points: 100 }],
    ]);
    const views = toLearningProblemViews(["a", "missing", "b"], rows, {
      solved: new Set(["b"]),
      attempted: new Set(["a", "b"]),
    });
    expect(views.map((view) => view.slug)).toEqual(["a", "b"]);
    expect(views[1]).toMatchObject({ solved: true, attempted: true, points: 200 });
  });
});

describe("module unlock", () => {
  it("keeps track 1 open and gates later tracks on the previous badge", () => {
    expect(isModuleUnlocked(1, false)).toBe(true);
    expect(isModuleUnlocked(2, false)).toBe(false);
    expect(isModuleUnlocked(2, true)).toBe(true);
    expect(isModuleUnlocked(7, false)).toBe(false);
  });

  it("explains whether the previous checkpoint or the previous track is missing", () => {
    expect(moduleUnlockHint("Basic Programming & Math", true, false)).toBe(
      "Complete the Basic Programming & Math checkpoint to unlock this track.",
    );
    expect(moduleUnlockHint("Basic Data Structures", false, false)).toBe(
      "Basic Data Structures is still in production.",
    );
    expect(moduleUnlockHint("Basic Programming & Math", true, true)).toBeNull();
  });
});

describe("buildLearningCheckpointView", () => {
  const checkpoint: LearningCheckpointDefinition = {
    title: "Checkpoint",
    titleBn: "চেকপয়েন্ট",
    description: "Finish three problems.",
    durationMinutes: 45,
    problemSlugs: ["a", "b", "c"],
    badge: { slug: "badge", name: "Badge", description: "Earned." },
  };
  const rows = new Map([
    ["a", { slug: "a", title: "A", difficulty: "EASY" as const, points: 100 }],
    ["b", { slug: "b", title: "B", difficulty: "MEDIUM" as const, points: 200 }],
    ["c", { slug: "c", title: "C", difficulty: "HARD" as const, points: 300 }],
  ]);
  const attempt = {
    startedAt: new Date("2026-01-10T11:30:00.000Z"),
    endsAt: new Date("2026-01-10T12:15:00.000Z"),
    completedAt: null,
  };

  it("uses in-window solves for an active attempt, not all-time solves", () => {
    const view = buildLearningCheckpointView(
      checkpoint,
      attempt,
      rows,
      { solved: new Set(["a", "b"]), attempted: new Set(["a", "b", "c"]) },
      now,
      new Set(["c"]),
    );
    expect(view.solvedCount).toBe(1);
    expect(view.problems.find((problem) => problem.slug === "a")?.solved).toBe(
      false,
    );
    expect(view.problems.find((problem) => problem.slug === "c")?.solved).toBe(
      true,
    );
    expect(view.status).toBe("ACTIVE");
  });

  it("falls back to all-time solves before an attempt starts", () => {
    const view = buildLearningCheckpointView(
      checkpoint,
      null,
      rows,
      { solved: new Set(["a"]), attempted: new Set(["a"]) },
      now,
    );
    expect(view.solvedCount).toBe(1);
    expect(view.status).toBe("NOT_STARTED");
  });
});
