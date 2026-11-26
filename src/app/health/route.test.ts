import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  sql,
  pingRedis,
  redisGet,
  getWorkerCount,
  getJudgeQueueCounts,
  getMigrationStatus,
  readNetworkSettings,
} = vi.hoisted(() => ({
  sql: vi.fn(),
  pingRedis: vi.fn(),
  redisGet: vi.fn(),
  getWorkerCount: vi.fn(),
  getJudgeQueueCounts: vi.fn(),
  getMigrationStatus: vi.fn(),
  readNetworkSettings: vi.fn(),
}));

vi.mock("@/server/db", () => ({ getSql: () => sql }));
vi.mock("@/server/db/migration-status", () => ({ getMigrationStatus }));
vi.mock("@/server/redis", () => ({
  pingRedis,
  getRedis: () => ({ get: redisGet }),
}));
vi.mock("@/server/worker-heartbeat", () => ({ getWorkerCount }));
vi.mock("@/server/judge/queue-health", () => ({ getJudgeQueueCounts }));
vi.mock("@/server/health/environment", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/health/environment")>();
  return { ...actual, readNetworkSettings };
});

const { GET } = await import("./route");

const ZERO_QUEUE = { waiting: 0, active: 0, prioritized: 0, delayed: 0, failed: 0 };
const NETWORK = { somaxconn: 16384, tcpMaxSynBacklog: 16384 };

describe("GET /health", () => {
  beforeEach(() => {
    sql.mockReset();
    pingRedis.mockReset();
    redisGet.mockReset();
    getWorkerCount.mockReset();
    getJudgeQueueCounts.mockReset();
    getMigrationStatus.mockReset();
    readNetworkSettings.mockReset();

    sql.mockResolvedValue([{ pending: 2, failed: 1, oldest_pending_seconds: 12 }]);
    getMigrationStatus.mockResolvedValue({ applied: 60, expected: 60, ok: true });
    pingRedis.mockResolvedValue(true);
    getWorkerCount.mockResolvedValue(2);
    readNetworkSettings.mockReturnValue({ ...NETWORK });
    redisGet.mockResolvedValue(null);
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
    expect(typeof body.judgeSlots).toBe("number");
    expect(body.judgeSlots).toBeGreaterThan(0);
    expect(typeof body.memory.rssMb).toBe("number");
    expect(body.memory.rssMb).toBeGreaterThan(0);
    expect(typeof body.memory.heapUsedMb).toBe("number");
    expect(typeof body.memory.limitMb).toBe("number");
  });

  it("reports numeric network backlog settings", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.network).toEqual({
      somaxconn: 16384,
      tcpMaxSynBacklog: 16384,
    });
    expect(Number.isInteger(body.network.somaxconn)).toBe(true);
    expect(Number.isInteger(body.network.tcpMaxSynBacklog)).toBe(true);
  });

  it("converts the shared edge memory budget to MiB", async () => {
    redisGet.mockResolvedValue("2147483648");

    const response = await GET();
    const body = await response.json();

    expect(redisGet).toHaveBeenCalledWith("pauoj:edge:caddy:memory");
    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.edge).toEqual({ caddyMemoryLimitMb: 2048 });
  });

  it("reports a zero edge budget for a missing or bad key", async () => {
    const missing = await GET();
    expect((await missing.json()).edge).toEqual({ caddyMemoryLimitMb: 0 });

    redisGet.mockResolvedValue("not-a-byte-count");
    const bad = await GET();
    const body = await bad.json();

    expect(body.edge).toEqual({ caddyMemoryLimitMb: 0 });
    // Operational signal only: a bad key never degrades the service.
    expect(bad.status).toBe(200);
    expect(body.status).toBe("ok");
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
    expect(body.edge).toEqual({ caddyMemoryLimitMb: 0 });
    expect(redisGet).not.toHaveBeenCalled();
    expect(getJudgeQueueCounts).not.toHaveBeenCalled();
  });
});
