import { describe, expect, it, vi } from "vitest";

const evalMock = vi.fn();

vi.mock("@/server/redis", () => ({
  getRedis: () => ({ eval: evalMock }),
}));

import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("uses the atomic Redis window when available", async () => {
    evalMock.mockResolvedValueOnce([2, 42]);
    const result = await rateLimit("test:redis", 5, 60);
    expect(result).toMatchObject({
      allowed: true,
      remaining: 3,
      retryAfterSeconds: 42,
    });
  });

  it("falls back to a bounded in-process window when Redis fails", async () => {
    evalMock.mockRejectedValue(new Error("redis down"));
    const first = await rateLimit("test:fallback", 2, 60);
    const second = await rateLimit("test:fallback", 2, 60);
    const third = await rateLimit("test:fallback", 2, 60);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});
