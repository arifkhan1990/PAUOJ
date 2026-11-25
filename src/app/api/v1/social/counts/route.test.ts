import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const { requireApiUser, enforceRateLimit, getSocialCounts } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  enforceRateLimit: vi.fn(),
  getSocialCounts: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/social-counts", () => ({ getSocialCounts }));

const { GET } = await import("./route");

describe("GET /api/v1/social/counts", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    getSocialCounts.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("returns the three viewer-scoped counts with no-store caching", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    getSocialCounts.mockResolvedValue({
      messages: 2,
      notifications: 7,
      requests: 1,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      data: { messages: 2, notifications: 7, requests: 1 },
    });
    expect(getSocialCounts).toHaveBeenCalledWith("user-1");
    expect(enforceRateLimit).toHaveBeenCalledWith("social-counts:user-1", 120, 60);
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getSocialCounts).not.toHaveBeenCalled();
  });

  it("maps the polling limiter to 429", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await GET();

    expect(response.status).toBe(429);
    expect(getSocialCounts).not.toHaveBeenCalled();
  });
});
