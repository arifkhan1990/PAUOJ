import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";
import type { PublicAnnouncement } from "@/lib/notification-types";

const { enforceRateLimit, getClientIp, getCachedPublicAnnouncements } =
  vi.hoisted(() => ({
    enforceRateLimit: vi.fn(),
    getClientIp: vi.fn(),
    getCachedPublicAnnouncements: vi.fn(),
  }));

vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/api/request", () => ({ getClientIp }));
vi.mock("@/server/services/public-announcements-cache", () => ({
  getCachedPublicAnnouncements,
}));

const { GET } = await import("./route");

const ANNOUNCEMENTS: PublicAnnouncement[] = [
  {
    id: "announcement-1",
    title: "Contest reminder",
    body: "Round 1 starts at 20:00.",
    href: "/contests/round-1",
    createdAt: "2026-11-27T10:00:00.000Z",
  },
];

function request(query = ""): NextRequest {
  return {
    url: `http://localhost:3000/api/v1/announcements${query}`,
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("GET /api/v1/announcements", () => {
  beforeEach(() => {
    enforceRateLimit.mockReset();
    getClientIp.mockReset();
    getCachedPublicAnnouncements.mockReset();

    getClientIp.mockReturnValue("203.0.113.9");
    enforceRateLimit.mockResolvedValue({ allowed: true });
    getCachedPublicAnnouncements.mockResolvedValue(ANNOUNCEMENTS);
  });

  it("serves the cached feed with the shared CDN cache header", async () => {
    const response = await GET(request("?limit=15"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=60, stale-while-revalidate=300",
    );
    await expect(response.json()).resolves.toEqual({ data: ANNOUNCEMENTS });
    expect(getCachedPublicAnnouncements).toHaveBeenCalledWith(15);
  });

  it("charges the per-egress bucket before the global backstop", async () => {
    await GET(request());

    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      1,
      "announcements:ip:203.0.113.9",
      12_000,
      60,
    );
    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      2,
      "announcements:global",
      30_000,
      60,
    );
    // No query limit falls back to the drawer default.
    expect(getCachedPublicAnnouncements).toHaveBeenCalledWith(10);
  });

  it("uses the unknown bucket when no client IP is available", async () => {
    getClientIp.mockReturnValue(null);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      1,
      "announcements:ip:unknown",
      12_000,
      60,
    );
  });

  it("propagates a 429 from the per-IP limiter", async () => {
    enforceRateLimit.mockRejectedValueOnce(errors.rateLimited());

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(getCachedPublicAnnouncements).not.toHaveBeenCalled();
  });

  it("propagates a 429 from the global limiter", async () => {
    enforceRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockRejectedValueOnce(errors.rateLimited());

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(enforceRateLimit).toHaveBeenCalledTimes(2);
    expect(getCachedPublicAnnouncements).not.toHaveBeenCalled();
  });

  it("accepts an explicit limit up to 20", async () => {
    const response = await GET(request("?limit=20"));

    expect(response.status).toBe(200);
    expect(getCachedPublicAnnouncements).toHaveBeenCalledWith(20);
  });

  it("rejects an out-of-range or non-numeric limit before touching the cache", async () => {
    for (const query of ["?limit=0", "?limit=21", "?limit=abc"]) {
      const response = await GET(request(query));
      expect(response.status).toBe(422);
    }
    expect(getCachedPublicAnnouncements).not.toHaveBeenCalled();
  });
});
