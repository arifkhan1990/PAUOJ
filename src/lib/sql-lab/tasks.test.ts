import { describe, expect, it } from "vitest";
import { SQL_LAB_TASKS, isTaskUnlocked, rowsMatch } from "@/lib/sql-lab/tasks";

describe("SQL lab tasks", () => {
  it("ships three basic and three advanced project tasks", () => {
    expect(SQL_LAB_TASKS).toHaveLength(6);
    expect(SQL_LAB_TASKS.filter((task) => task.level === "basic")).toHaveLength(3);
    expect(SQL_LAB_TASKS.filter((task) => task.level === "advanced")).toHaveLength(3);
  });

  it("keeps every expected row aligned with its columns", () => {
    for (const task of SQL_LAB_TASKS) {
      for (const row of task.expected) {
        expect(row, task.id).toHaveLength(task.columns.length);
      }
    }
  });

  it("gates only advanced tasks", () => {
    for (const task of SQL_LAB_TASKS) {
      expect(isTaskUnlocked(task, false)).toBe(task.level === "basic");
      expect(isTaskUnlocked(task, true)).toBe(true);
    }
  });

  it("compares rows strictly, including order", () => {
    expect(rowsMatch([[1, "a"]], [[1, "a"]])).toBe(true);
    expect(rowsMatch([[1, "a"]], [["a", 1]])).toBe(false);
    expect(rowsMatch([[1], [2]], [[2], [1]])).toBe(false);
  });
});
