import { describe, expect, it } from "vitest";
import {
  countStudyDifficulties,
  estimateStudyMinutes,
  formatStudyDuration,
  isReservedStudyListSlug,
  pickNextStudyProblem,
  studyListLevelMeta,
  studyProgressPercent,
  uniqueStudyTopics,
} from "./study-list";
import type { StudyListProblem } from "./study-list-types";

function problem(
  overrides: Partial<StudyListProblem> & Pick<StudyListProblem, "slug">,
): StudyListProblem {
  return {
    title: overrides.slug,
    difficulty: "EASY",
    points: 10,
    position: 1,
    sectionId: "section-1",
    sectionTitle: "Warm-up",
    solved: false,
    attempted: false,
    note: null,
    ...overrides,
  };
}

describe("study list helpers", () => {
  it("estimates duration from difficulty", () => {
    expect(
      estimateStudyMinutes([
        { difficulty: "EASY" },
        { difficulty: "MEDIUM" },
        { difficulty: "HARD" },
        { difficulty: "EXPERT" },
      ]),
    ).toBe(140);
  });

  it("formats durations for the catalog", () => {
    expect(formatStudyDuration(45)).toBe("45 min");
    expect(formatStudyDuration(60)).toBe("1h");
    expect(formatStudyDuration(95)).toBe("1h 35m");
    expect(formatStudyDuration(0)).toBe("—");
  });

  it("counts difficulties and derives progress", () => {
    expect(
      countStudyDifficulties([
        { difficulty: "EASY" },
        { difficulty: "EASY" },
        { difficulty: "HARD" },
      ]),
    ).toEqual({ EASY: 2, MEDIUM: 0, HARD: 1, EXPERT: 0 });
    expect(studyProgressPercent(3, 5)).toBe(60);
    expect(studyProgressPercent(0, 0)).toBe(0);
  });

  it("picks the first unsolved problem in order", () => {
    const next = pickNextStudyProblem([
      problem({ slug: "second", position: 2 }),
      problem({ slug: "first", position: 1, solved: true }),
      problem({ slug: "third", position: 3 }),
    ]);
    expect(next?.slug).toBe("second");
    expect(pickNextStudyProblem([problem({ slug: "done", solved: true })]))
      .toBeNull();
  });

  it("normalises level metadata and topics", () => {
    expect(studyListLevelMeta("ADVANCED").label).toBe("Advanced");
    expect(studyListLevelMeta("unknown").value).toBe("BEGINNER");
    expect(uniqueStudyTopics(["Arrays", "arrays", "DP", "Graphs"], 3)).toEqual(
      ["Arrays", "DP", "Graphs"],
    );
  });

  it("reserves static-route slugs", () => {
    expect(isReservedStudyListSlug("new")).toBe(true);
    expect(isReservedStudyListSlug("getting-started")).toBe(false);
  });
});
