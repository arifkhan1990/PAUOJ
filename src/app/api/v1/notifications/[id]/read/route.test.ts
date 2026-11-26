import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const { assertSameOrigin, requireApiUser, enforceRateLimit, markNotificationRead } =
  vi.hoisted(() => ({
    assertSameOrigin: vi.fn(),
    requireApiUser: vi.fn(),
    enforceRateLimit: vi.fn(),
    markNotificationRead: vi.fn(),
  }));

vi.mock("@/server/api/auth", () => ({ assertSameOrigin, requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/notification-read", () => ({ markNotificationRead }));

const { PATCH } = await import("./route");

function request(): NextRequest {
  return {
    url: "http://localhost:3000/api/v1/notifications/note-1/read",
    headers: new Headers(),
  } as unknown as NextRequest;
}

function context(id = "note-1") {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/v1/notifications/[id]/read", () => {
  beforeEach(() => {
    assertSameOrigin.mockReset();
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    markNotificationRead.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("marks the notification and returns its timestamp and unread count", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    markNotificationRead.mockResolvedValue({
      readAt: "2026-01-02T03:04:05.000Z",
      unread: 4,
    });

    const response = await PATCH(request(), context());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      data: { ok: true, readAt: "2026-01-02T03:04:05.000Z", unread: 4 },
    });
    expect(markNotificationRead).toHaveBeenCalledWith("user-1", "note-1");
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "notifications:read:user-1",
      120,
      60,
    );
  });

  it("returns 404 for a foreign or unknown id", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    markNotificationRead.mockRejectedValue(
      errors.notFound("That notification could not be found."),
    );

    const response = await PATCH(request(), context("someone-elses"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await PATCH(request(), context());

    expect(response.status).toBe(401);
    expect(markNotificationRead).not.toHaveBeenCalled();
  });
});
