import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));

vi.mock("@/server/db", () => ({ getSql: () => sql }));

const { proxy } = await import("./proxy");

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("problem slug proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns a real 404 for an unknown problem slug", async () => {
    sql.mockResolvedValue([]);
    const response = await proxy(request("/problems/this-slug-does-not-exist"));
    expect(response.status).toBe(404);
  });

  it("passes an existing problem slug through to the page", async () => {
    sql.mockResolvedValue([{ "?column?": 1 }]);
    const response = await proxy(request("/problems/a-plus-b"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not query the database for the problem list", async () => {
    const response = await proxy(request("/problems"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("leaves anonymous contribute pages to the sign-in gate", async () => {
    const response = await proxy(
      request("/problems/this-slug-does-not-exist/contribute"),
    );
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("returns 404 for a signed-in unknown contribute slug", async () => {
    sql.mockResolvedValue([]);
    const response = await proxy(
      request(
        "/problems/this-slug-does-not-exist/contribute",
        "pauoj_session=test",
      ),
    );
    expect(response.status).toBe(404);
  });

  it("passes a signed-in existing contribute slug", async () => {
    sql.mockResolvedValue([{ "?column?": 1 }]);
    const response = await proxy(
      request("/problems/a-plus-b/contribute", "pauoj_session=test"),
    );
    expect(response.status).toBe(200);
  });

  it("does not 404 every problem when the lookup fails", async () => {
    sql.mockRejectedValue(new Error("database unavailable"));
    const response = await proxy(request("/problems/a-plus-b"));
    expect(response.status).toBe(200);
  });
});

describe("study plan slug proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns a real 404 for an unknown study plan slug", async () => {
    sql.mockResolvedValue([]);
    const response = await proxy(request("/lists/this-plan-does-not-exist"));
    expect(response.status).toBe(404);
  });

  it("passes an existing study plan slug through to the page", async () => {
    sql.mockResolvedValue([{ is_public: true }]);
    const response = await proxy(request("/lists/getting-started"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns a real 404 for a private study plan without a session", async () => {
    sql.mockResolvedValue([{ is_public: false }]);
    const response = await proxy(request("/lists/private-plan"));
    expect(response.status).toBe(404);
  });

  it("passes a private study plan to its owner", async () => {
    sql.mockResolvedValue([
      {
        is_public: false,
        created_by: "user-1",
        session_user_id: "user-1",
      },
    ]);
    const response = await proxy(
      request("/lists/private-plan", "pauoj_session=owner-token"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns 404 for another user's private study plan", async () => {
    sql.mockResolvedValue([
      {
        is_public: false,
        created_by: "user-1",
        session_user_id: "user-2",
      },
    ]);
    const response = await proxy(
      request("/lists/private-plan", "pauoj_session=other-token"),
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when the session cookie does not resolve to a user", async () => {
    sql.mockResolvedValue([
      { is_public: false, created_by: "user-1", session_user_id: null },
    ]);
    const response = await proxy(
      request("/lists/private-plan", "pauoj_session=expired-token"),
    );
    expect(response.status).toBe(404);
  });

  it("passes an owned plan's edit page", async () => {
    sql.mockResolvedValue([
      {
        is_public: false,
        created_by: "user-1",
        session_user_id: "user-1",
      },
    ]);
    const response = await proxy(
      request("/lists/private-plan/edit", "pauoj_session=owner-token"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns 404 for a non-owner edit page on a public plan", async () => {
    sql.mockResolvedValue([
      {
        is_public: true,
        created_by: "user-1",
        session_user_id: "user-2",
      },
    ]);
    const response = await proxy(
      request("/lists/public-plan/edit", "pauoj_session=other-token"),
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 for a non-owner edit page on a private plan", async () => {
    sql.mockResolvedValue([
      {
        is_public: false,
        created_by: "user-1",
        session_user_id: "user-2",
      },
    ]);
    const response = await proxy(
      request("/lists/private-plan/edit", "pauoj_session=other-token"),
    );
    expect(response.status).toBe(404);
  });

  it("hashes the session token before querying", async () => {
    sql.mockResolvedValue([{ is_public: true }]);
    await proxy(request("/lists/getting-started", "pauoj_session=secret-token"));
    const params = (sql.mock.calls[0] as unknown[]).slice(1);
    expect(params).toContain(
      createHash("sha256").update("secret-token").digest("hex"),
    );
    expect(params).not.toContain("secret-token");
  });

  it("does not query the database for the study plan index", async () => {
    const response = await proxy(request("/lists"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("allows the create-plan page without a slug lookup", async () => {
    const response = await proxy(request("/lists/new"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("does not 404 every study plan when the lookup fails", async () => {
    sql.mockRejectedValue(new Error("database unavailable"));
    const response = await proxy(request("/lists/getting-started"));
    expect(response.status).toBe(200);
  });
});

describe("learning route proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns a real 404 for an unknown track", async () => {
    const response = await proxy(request("/learn/not-a-track"));
    expect(response.status).toBe(404);
  });

  it("returns a real 404 for an unknown topic in a known track", async () => {
    const response = await proxy(
      request("/learn/basic-programming-math/not-a-topic"),
    );
    expect(response.status).toBe(404);
  });

  it("passes known tracks and topics through without a database query", async () => {
    const track = await proxy(request("/learn/basic-programming-math"));
    const topic = await proxy(
      request("/learn/basic-programming-math/complexity"),
    );
    expect(track.status).toBe(200);
    expect(topic.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("does not intercept the learning index", async () => {
    const response = await proxy(request("/learn"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("allows the reserved learning pricing page", async () => {
    const response = await proxy(request("/learn/pricing"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("allows the SQL lab page", async () => {
    const response = await proxy(request("/learn/sql"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("still rejects an unknown slug that looks like a reserved page", async () => {
    const response = await proxy(request("/learn/pricing/extra"));
    expect(response.status).toBe(404);
  });
});

describe("profile username proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns a real 404 for an unknown profile", async () => {
    sql.mockResolvedValue([]);
    const response = await proxy(request("/users/this-user-does-not-exist"));
    expect(response.status).toBe(404);
  });

  it("returns a real 404 for an unknown connections page", async () => {
    sql.mockResolvedValue([]);
    const response = await proxy(
      request("/users/this-user-does-not-exist/connections?tab=followers"),
    );
    expect(response.status).toBe(404);
  });

  it("passes an existing profile and connections page through", async () => {
    sql.mockResolvedValue([{ "?column?": 1 }]);
    const profile = await proxy(request("/users/rakib"));
    const connections = await proxy(
      request("/users/rakib/connections?tab=following"),
    );
    expect(profile.status).toBe(200);
    expect(profile.headers.get("x-middleware-next")).toBe("1");
    expect(connections.status).toBe(200);
  });

  it("redirects mixed-case profile URLs to the lowercase canonical", async () => {
    const response = await proxy(request("/users/RaKib/connections?tab=followers"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "http://localhost/users/rakib/connections?tab=followers",
    );
    expect(sql).not.toHaveBeenCalled();
  });

  it("does not 404 every profile when the lookup fails", async () => {
    sql.mockRejectedValue(new Error("database unavailable"));
    const response = await proxy(request("/users/rakib"));
    expect(response.status).toBe(200);
  });
});

describe("contest slug proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns a real 404 for an unknown contest or tab", async () => {
    sql.mockResolvedValue([]);
    const detail = await proxy(request("/contests/this-contest-does-not-exist"));
    const standings = await proxy(
      request("/contests/this-contest-does-not-exist/standings"),
    );
    expect(detail.status).toBe(404);
    expect(standings.status).toBe(404);
  });

  it("passes an existing contest and its tabs through", async () => {
    sql.mockResolvedValue([{ "?column?": 1 }]);
    const detail = await proxy(request("/contests/pau-intra-2026"));
    const sponsorship = await proxy(
      request("/contests/pau-intra-2026/sponsor"),
    );
    expect(detail.status).toBe(200);
    expect(detail.headers.get("x-middleware-next")).toBe("1");
    expect(sponsorship.status).toBe(200);
  });

  it("does not treat the host page as a contest slug", async () => {
    const response = await proxy(request("/contests/host"));
    expect(response.status).toBe(200);
    expect(sql).not.toHaveBeenCalled();
  });

  it("does not 404 every contest when the lookup fails", async () => {
    sql.mockRejectedValue(new Error("database unavailable"));
    const response = await proxy(request("/contests/pau-intra-2026"));
    expect(response.status).toBe(200);
  });
});

describe("dashboard deep link proxy", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("forwards the full dashboard path with its query string", async () => {
    const response = await proxy(request("/dashboard/messages/abc?page=2"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(
      response.headers.get("x-middleware-request-x-pathname"),
    ).toBe("/dashboard/messages/abc?page=2");
    expect(sql).not.toHaveBeenCalled();
  });

  it("forwards the dashboard root", async () => {
    const response = await proxy(request("/dashboard"));
    expect(response.status).toBe(200);
    expect(
      response.headers.get("x-middleware-request-x-pathname"),
    ).toBe("/dashboard");
    expect(sql).not.toHaveBeenCalled();
  });
});
