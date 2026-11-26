import { beforeEach, describe, expect, it, vi } from "vitest";

const { sql, pingRedis, getWorkerCount, getJudgeQueueCounts, getMigrationStatus } =
  vi.hoisted(() => ({
    sql: vi.fn(),
    pingRedis: vi.fn(),
    getWorkerCount: vi.fn(),
    getJudgeQueueCounts: vi.fn(),
    getMigrationStatus: vi.fn(),
  }));

vi.mock("@/server/db", () => ({ getSql: () => sql }));
vi.mock("@/server/db/migration-status", () => ({ getMigrationStatus }));
vi.mock("@/server/redis", () => ({ pingRedis }));
vi.mock("@/server/worker-heartbeat", () => ({ getWorkerCount }));
vi.mock("@/server/judge/queue-health", () => ({ getJudgeQueueCounts }));

const { GET } = await import("./route");

const ZERO_QUEUE = { waiting: 0, active: 0, prioritized: 0, delayed: 0, failed: 0 };

describe("GET /health", () => {
  beforeEach(() => {
    sql.mockReset();
    pingRedis.mockReset();
    getWorkerCount.mockReset();
    getJudgeQueueCounts.mockReset();
    getMigrationStatus.mockReset();

    sql.mockResolvedValue([{ pending: 2, failed: 1, oldest_pending_seconds: 12 }]);
    getMigrationStatus.mockResolvedValue({ applied: 60, expected: 60, ok: true });
    pingRedis.mockResolvedValue(true);
    getWorkerCount.mockResolvedValue(2);
  });

  it("reports judge queue counts without changing the healthy status", async () => {
    getJudgeQueueCounts.mockResolvedValue({
      waiting: 40,
      active: 8,
      prioritized: 30,
      delayed: 1,
      failed: 2,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.judgeQueue).toEqual({
      waiting: 40,
      active: 8,
      prioritized: 30,
      delayed: 1,
      failed: 2,
    });
    // Existing fields are untouched.
    expect(body.emailOutbox).toEqual({ pending: 2, failed: 1 });
    expect(body.broadcastQueue).toEqual({ pending: 2, oldestPendingSeconds: 12 });
    expect(body.workers).toBe(2);
  });

  it("keeps status ok and HTTP 200 on a large backlog", async () => {
    getJudgeQueueCounts.mockResolvedValue({
      waiting: 50_000,
      active: 8,
      prioritized: 49_000,
      delayed: 500,
      failed: 120,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.judgeQueue.waiting).toBe(50_000);
  });

  it("reports zeroed queue counts when Redis is down", async () => {
    pingRedis.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.redis).toBe(false);
    expect(body.workers).toBe(0);
    expect(body.judgeQueue).toEqual(ZERO_QUEUE);
    expect(getJudgeQueueCounts).not.toHaveBeenCalled();
  });
});
