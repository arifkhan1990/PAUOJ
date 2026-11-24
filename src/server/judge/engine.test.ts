import { describe, expect, it } from "vitest";
import { runJudge } from "./engine";

process.env.DATABASE_URL ??= "postgres://pauoj:pauoj@localhost:5432/pauoj";
process.env.JUDGE_WORK_DIR ??= "/tmp/pauoj-engine-test";

describe("runJudge language guard", () => {
  it("rejects an unknown language with a clear message", async () => {
    await expect(
      runJudge({
        language: "sqlite3" as never,
        source: "SELECT 1;",
        timeLimitMs: 3000,
        memoryLimitMb: 256,
        tests: [
          {
            id: "test-1",
            position: 1,
            input: "",
            expectedOutput: "1",
            isSample: true,
          },
        ],
        checker: { type: "EXACT", source: null, floatTolerance: 1e-6 },
        mode: "submission",
      }),
    ).rejects.toThrow("Unsupported judge language: sqlite3");
  });
});
