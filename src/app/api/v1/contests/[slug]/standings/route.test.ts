import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContestScoreboard } from "@/lib/contest-detail-types";
import { errors } from "@/server/api/errors";

const { optionalApiUser, getScoreboard } = vi.hoisted(() => ({
  optionalApiUser: vi.fn(),
  getScoreboard: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ optionalApiUser }));
vi.mock("@/server/services/contests", () => ({ getScoreboard }));

const { GET } = await import("./route");

function board(overrides: Partial<ContestScoreboard> = {}): ContestScoreboard {
  return {
    contest: {
      slug: "round-1",
      title: "Round 1",
      startAt: "2026-11-26T09:00:00.000Z",
      endAt: "2026-11-26T12:00:00.000Z",
      status: "RUNNING",
      freezeMinutes: 0,
      format: "SINGLE",
      teamSize: 1,
      ratingFinalizedAt: null,
      ratingReviewEndsAt: "2026-11-26T13:00:00.000Z",
    },
    frozen: false,
    freezeAt: null,
    labels: ["A"],
    generatedAt: "2026-11-26T10:00:00.000Z",
    pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    rows: [
      {
        rank: 1,
        user: { username: "ada", displayName: "Ada" },
        team: null,
        solved: 1,
        penalty: 5,
        problems: {},
      },
    ],
    ...overrides,
  };
}

function request(query = "", headers: Record<string, string> = {}): NextRequest {
  return {
    url: `http://localhost:3000/api/v1/contests/round-1/standings${query}`,
    headers: new Headers(headers),
  } as unknown as NextRequest;
}

const context = { params: Promise.resolve({ slug: "round-1" }) };

describe("GET /api/v1/contests/[slug]/standings", () => {
  beforeEach(() => {
    optionalApiUser.mockReset();
    getScoreboard.mockReset();
    optionalApiUser.mockResolvedValue(null);
    getScoreboard.mockResolvedValue(board());
  });

  it("serves the first page with no-store caching and an ETag", async () => {
    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/);
    await expect(response.json()).resolves.toEqual({ data: board() });
    expect(getScoreboard).toHaveBeenCalledWith("round-1", false, {
      page: 1,
      pageSize: 50,
    });
  });

  it("parses page and pageSize", async () => {
    await GET(request("?page=3&pageSize=50"), context);

    expect(getScoreboard).toHaveBeenCalledWith("round-1", false, {
      page: 3,
      pageSize: 50,
    });
  });

  it("falls back to defaults for blank query values", async () => {
    await GET(request("?page=&pageSize="), context);

    expect(getScoreboard).toHaveBeenCalledWith("round-1", false, {
      page: 1,
      pageSize: 50,
    });
  });

  it("treats admins as admins", async () => {
    optionalApiUser.mockResolvedValue({ role: "ADMIN" });

    await GET(request(), context);

    expect(getScoreboard).toHaveBeenCalledWith("round-1", true, {
      page: 1,
      pageSize: 50,
    });
  });

  it("returns 304 with no body when the ETag matches", async () => {
    const first = await GET(request(), context);
    const etag = first.headers.get("etag");
    expect(etag).not.toBeNull();

    const second = await GET(
      request("", { "if-none-match": etag as string }),
      context,
    );

    expect(second.status).toBe(304);
    expect(second.headers.get("etag")).toBe(etag);
    expect(second.headers.get("cache-control")).toBe("private, no-store");
    await expect(second.text()).resolves.toBe("");
  });

  it("matches a weak ETag and a wildcard", async () => {
    const first = await GET(request(), context);
    const etag = first.headers.get("etag") as string;

    const weak = await GET(
      request("", { "if-none-match": `W/${etag}` }),
      context,
    );
    expect(weak.status).toBe(304);

    const wildcard = await GET(
      request("", { "if-none-match": "*" }),
      context,
    );
    expect(wildcard.status).toBe(304);
  });

  it("ignores generatedAt when computing the ETag", async () => {
    const first = await GET(request(), context);
    const etag = first.headers.get("etag");

    // A refreshed snapshot with a newer timestamp but an unchanged board.
    getScoreboard.mockResolvedValue(
      board({ generatedAt: "2026-11-26T10:00:05.000Z" }),
    );
    const second = await GET(
      request("", { "if-none-match": etag as string }),
      context,
    );

    expect(second.headers.get("etag")).toBe(etag);
    expect(second.status).toBe(304);
    await expect(second.text()).resolves.toBe("");
  });

  it("changes the ETag when the served page changes", async () => {
    const first = await GET(request(), context);
    const etag = first.headers.get("etag");

    getScoreboard.mockResolvedValue(
      board({
        rows: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 },
      }),
    );
    const second = await GET(request(), context);

    expect(second.headers.get("etag")).not.toBe(etag);
    expect(second.status).toBe(200);
  });

  it("returns 200 when the ETag differs", async () => {
    getScoreboard.mockResolvedValue(
      board({
        pagination: { page: 2, pageSize: 100, total: 250, totalPages: 3 },
      }),
    );

    const response = await GET(
      request("?page=2", { "if-none-match": '"something-else"' }),
      context,
    );

    expect(response.status).toBe(200);
  });

  it.each(["page=0", "page=-1", "pageSize=10", "pageSize=201", "page=abc"])(
    "rejects invalid query %s with 422",
    async (query) => {
      const response = await GET(request(`?${query}`), context);

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "VALIDATION_ERROR" },
      });
      expect(getScoreboard).not.toHaveBeenCalled();
    },
  );

  it("keeps the error envelope for domain errors", async () => {
    getScoreboard.mockRejectedValue(errors.notFound("Contest not found."));

    const response = await GET(request(), context);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: "NOT_FOUND", message: "Contest not found." },
    });
  });
});
