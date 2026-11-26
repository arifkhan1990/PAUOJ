import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const {
  requireApiUser,
  enforceRateLimit,
  listNotifications,
  getUnreadNotificationCount,
} = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  enforceRateLimit: vi.fn(),
  listNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/notifications", () => ({
  NOTIFICATIONS_PAGE_SIZE: 20,
  listNotifications,
  getUnreadNotificationCount,
}));

const { GET } = await import("./route");

function request(query = ""): NextRequest {
  return {
    url: `http://localhost:3000/api/v1/notifications${query}`,
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("GET /api/v1/notifications", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    listNotifications.mockReset();
    getUnreadNotificationCount.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("returns page data with the unread meta and no-store caching", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1", role: "USER" });
    listNotifications.mockResolvedValue({ items: [{ id: "n1" }], total: 41 });
    getUnreadNotificationCount.mockResolvedValue(3);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "n1" }],
      meta: { page: 1, pageSize: 20, total: 41, totalPages: 3, unread: 3 },
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "notifications:list:user-1",
      120,
      60,
    );
    expect(listNotifications).toHaveBeenCalledWith(
      "user-1",
      { page: 1, pageSize: 20 },
      "ALL",
    );
  });

  it("maps the unread filter", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    listNotifications.mockResolvedValue({ items: [], total: 0 });
    getUnreadNotificationCount.mockResolvedValue(0);

    const response = await GET(request("?filter=unread"));

    expect(response.status).toBe(200);
    expect(listNotifications).toHaveBeenCalledWith(
      "user-1",
      { page: 1, pageSize: 20 },
      "UNREAD",
    );
  });

  it("maps the notice filter regardless of case", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    listNotifications.mockResolvedValue({ items: [], total: 0 });
    getUnreadNotificationCount.mockResolvedValue(0);

    const response = await GET(request("?filter=Notice&page=2"));

    expect(response.status).toBe(200);
    expect(listNotifications).toHaveBeenCalledWith(
      "user-1",
      { page: 2, pageSize: 20 },
      "NOTICE",
    );
  });

  it("rejects an unknown filter with 422", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });

    const response = await GET(request("?filter=archived"));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(listNotifications).not.toHaveBeenCalled();
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(listNotifications).not.toHaveBeenCalled();
  });
});
