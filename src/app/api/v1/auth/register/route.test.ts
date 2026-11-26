import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const {
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
  getClientUserAgent,
  parseJson,
  registerUser,
  createSession,
  sendVerificationForUser,
  notifyUser,
} = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  getClientUserAgent: vi.fn(),
  parseJson: vi.fn(),
  registerUser: vi.fn(),
  createSession: vi.fn(),
  sendVerificationForUser: vi.fn(),
  notifyUser: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ assertSameOrigin }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/api/request", () => ({ getClientIp, getClientUserAgent }));
vi.mock("@/server/api/validation", () => ({ parseJson }));
vi.mock("@/server/services/auth", () => ({ registerUser }));
vi.mock("@/server/auth/session", () => ({ createSession }));
vi.mock("@/server/auth/email-flows", () => ({ sendVerificationForUser }));
vi.mock("@/server/services/notifications", () => ({ notifyUser }));

const { POST } = await import("./route");

const INPUT = {
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
  password: "secret123",
};

const USER = { id: "user-1", username: "alice" };

function request(): NextRequest {
  return {} as NextRequest;
}

describe("POST /api/v1/auth/register", () => {
  beforeEach(() => {
    assertSameOrigin.mockReset();
    enforceRateLimit.mockReset();
    getClientIp.mockReset();
    getClientUserAgent.mockReset();
    parseJson.mockReset();
    registerUser.mockReset();
    createSession.mockReset();
    sendVerificationForUser.mockReset();
    notifyUser.mockReset();

    getClientIp.mockReturnValue("203.0.113.9");
    getClientUserAgent.mockReturnValue("vitest");
    parseJson.mockResolvedValue(INPUT);
    enforceRateLimit.mockResolvedValue({ allowed: true });
    registerUser.mockResolvedValue(USER);
    createSession.mockResolvedValue(undefined);
    sendVerificationForUser.mockResolvedValue(undefined);
    notifyUser.mockResolvedValue(undefined);
  });

  it("lets two different students register from the same NAT address", async () => {
    parseJson
      .mockResolvedValueOnce(INPUT)
      .mockResolvedValueOnce({ ...INPUT, username: "bob", email: "bob@example.com" });

    const first = await POST(request());
    const second = await POST(request());

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(registerUser).toHaveBeenCalledTimes(2);
    // Both attempts charge the same two buckets; the username is not a key.
    expect(enforceRateLimit).toHaveBeenCalledTimes(4);
    expect(enforceRateLimit.mock.calls.map(([key]) => key)).toEqual([
      "auth:register:ip:203.0.113.9",
      "auth:register:global",
      "auth:register:ip:203.0.113.9",
      "auth:register:global",
    ]);
  });

  it("checks the per-IP bucket before the platform bucket", async () => {
    await POST(request());

    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      1,
      "auth:register:ip:203.0.113.9",
      600,
      15 * 60,
    );
    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      2,
      "auth:register:global",
      6_000,
      15 * 60,
    );
  });

  it("uses the unknown bucket when no client IP is available", async () => {
    getClientIp.mockReturnValue(null);

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      1,
      "auth:register:ip:unknown",
      600,
      15 * 60,
    );
  });

  it("propagates a 429 from the per-IP limiter", async () => {
    enforceRateLimit.mockRejectedValueOnce(errors.rateLimited());

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(parseJson).not.toHaveBeenCalled();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("propagates a 429 from the platform limiter", async () => {
    enforceRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockRejectedValueOnce(errors.rateLimited());

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(enforceRateLimit).toHaveBeenNthCalledWith(
      2,
      "auth:register:global",
      6_000,
      15 * 60,
    );
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("keeps the success path unchanged", async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: USER });
    expect(registerUser).toHaveBeenCalledWith(INPUT);
    expect(createSession).toHaveBeenCalledWith("user-1", {
      ip: "203.0.113.9",
      userAgent: "vitest",
    });
    expect(sendVerificationForUser).toHaveBeenCalledWith(USER);
    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "WELCOME",
        dedupeKey: "welcome",
      }),
    );
  });
});
