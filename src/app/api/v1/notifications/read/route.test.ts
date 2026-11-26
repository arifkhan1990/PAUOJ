import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const { assertSameOrigin, requireApiUser, enforceRateLimit, markAllNotificationsRead } =
  vi.hoisted(() => ({
    assertSameOrigin: vi.fn(),
    requireApiUser: vi.fn(),
    enforceRateLimit: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  }));

vi.mock("@/server/api/auth", () => ({ assertSameOrigin, requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/notifications", () => ({
  markAllNotificationsRead,
}));

const { PATCH } = await import("./route");

function request(): NextRequest {
  return {
    url: "http://localhost:3000/api/v1/notifications/read",
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("PATCH /api/v1/notifications/read", () => {
  beforeEach(() => {
    assertSameOrigin.mockReset();
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    markAllNotificationsRead.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("marks every unread row and returns the count", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    markAllNotificationsRead.mockResolvedValue(5);

    const response = await PATCH(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      data: { ok: true, marked: 5, unread: 0 },
    });
    expect(assertSameOrigin).toHaveBeenCalled();
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "notifications:read-all:user-1",
      60,
      60,
    );
    expect(markAllNotificationsRead).toHaveBeenCalledWith("user-1");
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await PATCH(request());

    expect(response.status).toBe(401);
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("maps the limiter to 429", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await PATCH(request());

    expect(response.status).toBe(429);
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });
});
