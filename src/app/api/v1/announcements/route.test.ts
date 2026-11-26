import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const { enforceRateLimit, getClientIp, listPublicAnnouncements } = vi.hoisted(
  () => ({
    enforceRateLimit: vi.fn(),
    getClientIp: vi.fn(),
    listPublicAnnouncements: vi.fn(),
  }),
);

vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/api/request", () => ({ getClientIp }));
vi.mock("@/server/services/public-updates", () => ({ listPublicAnnouncements }));

const { GET } = await import("./route");

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
    listPublicAnnouncements.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
    getClientIp.mockReturnValue("203.0.113.9");
  });

  it("returns the public feed with a shared cache header", async () => {
    listPublicAnnouncements.mockResolvedValue([
      {
        id: "a1",
        title: "Maintenance",
        body: "Sunday 02:00 UTC",
        href: "/contests",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=60, stale-while-revalidate=300",
    );
    await expect(response.json()).resolves.toMatchObject({
      data: [{ id: "a1", href: "/contests" }],
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "announcements:global",
      1200,
      60,
    );
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "announcements:203.0.113.9",
      60,
      60,
    );
    expect(listPublicAnnouncements).toHaveBeenCalledWith(10);
  });

  it("accepts an explicit limit up to 20", async () => {
    listPublicAnnouncements.mockResolvedValue([]);

    const response = await GET(request("?limit=20"));

    expect(response.status).toBe(200);
    expect(listPublicAnnouncements).toHaveBeenCalledWith(20);
  });

  it("falls back to the unknown bucket without a client ip", async () => {
    getClientIp.mockReturnValue(null);
    listPublicAnnouncements.mockResolvedValue([]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "announcements:unknown",
      60,
      60,
    );
  });

  it("rejects an out-of-range or non-numeric limit with 422", async () => {
    for (const query of ["?limit=0", "?limit=21", "?limit=abc"]) {
      const response = await GET(request(query));
      expect(response.status).toBe(422);
    }
    expect(listPublicAnnouncements).not.toHaveBeenCalled();
  });

  it("maps the limiter to 429", async () => {
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(listPublicAnnouncements).not.toHaveBeenCalled();
  });
});
