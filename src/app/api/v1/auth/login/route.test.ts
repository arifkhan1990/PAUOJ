import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, errors } from "@/server/api/errors";

const {
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
  getClientUserAgent,
  parseJson,
  authenticateUser,
  createSession,
} = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  getClientUserAgent: vi.fn(),
  parseJson: vi.fn(),
  authenticateUser: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ assertSameOrigin }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/api/request", () => ({ getClientIp, getClientUserAgent }));
vi.mock("@/server/api/validation", () => ({ parseJson }));
vi.mock("@/server/services/auth", () => ({ authenticateUser }));
vi.mock("@/server/auth/session", () => ({ createSession }));

const { POST } = await import("./route");

function request(): NextRequest {
  return {} as NextRequest;
}

describe("POST /api/v1/auth/login", () => {
  beforeEach(() => {
    assertSameOrigin.mockReset();
    enforceRateLimit.mockReset();
    getClientIp.mockReset();
    getClientUserAgent.mockReset();
    parseJson.mockReset();
    authenticateUser.mockReset();
    createSession.mockReset();

    getClientIp.mockReturnValue("203.0.113.9");
    getClientUserAgent.mockReturnValue("vitest");
    parseJson.mockResolvedValue({ identifier: "Alice", password: "secret" });
    enforceRateLimit.mockResolvedValue({ allowed: true });
    createSession.mockResolvedValue(undefined);
  });

  it("does not charge successful sign-ins to the shared egress IP", async () => {
    authenticateUser.mockResolvedValue({ id: "user-1", username: "alice" });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "auth:login:id:alice",
      10,
      15 * 60,
    );
    expect(createSession).toHaveBeenCalledWith("user-1", {
      ip: "203.0.113.9",
      userAgent: "vitest",
    });
  });

  it("counts a failed password against the shared egress IP", async () => {
    authenticateUser.mockRejectedValue(
      new ApiError("INVALID_CREDENTIALS", "Incorrect username or password.", 401),
    );

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(enforceRateLimit).toHaveBeenLastCalledWith(
      "auth:login:fail:203.0.113.9",
      50,
      15 * 60,
      expect.any(String),
    );
    expect(createSession).not.toHaveBeenCalled();
  });

  it("keeps the per-account throttle ahead of password verification", async () => {
    enforceRateLimit.mockRejectedValueOnce(errors.rateLimited());

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(authenticateUser).not.toHaveBeenCalled();
  });
});
