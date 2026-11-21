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
