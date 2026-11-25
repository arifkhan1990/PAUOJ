import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const { requireApiUser, enforceRateLimit, getConversationSharedContent } =
  vi.hoisted(() => ({
    requireApiUser: vi.fn(),
    enforceRateLimit: vi.fn(),
    getConversationSharedContent: vi.fn(),
  }));

vi.mock("@/server/api/auth", () => ({ requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/message-shared", () => ({
  getConversationSharedContent,
}));

const { GET } = await import("./route");

const CONVERSATION_ID = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

function context(id = CONVERSATION_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/v1/messages/conversations/[id]/info", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    getConversationSharedContent.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("returns shared media and links without caching", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    const content = {
      media: [
        {
          id: "attachment-1",
          url: "/api/v1/messages/attachments/attachment-1",
          mime: "image/png",
          width: 800,
          height: 600,
          createdAt: "2026-02-01T10:00:00.000Z",
        },
      ],
      links: [],
    };
    getConversationSharedContent.mockResolvedValue(content);

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toEqual({ data: content });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "message-info:user-1",
      120,
      60,
    );
    expect(getConversationSharedContent).toHaveBeenCalledWith(
      "user-1",
      CONVERSATION_ID,
    );
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(401);
    expect(getConversationSharedContent).not.toHaveBeenCalled();
  });

  it("hides missing, blocked and banned conversations behind a 404", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    getConversationSharedContent.mockResolvedValue(null);

    const response = await GET({} as NextRequest, context("not-a-uuid"));

    expect(response.status).toBe(404);
  });

  it("maps the info limiter to 429", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(429);
    expect(getConversationSharedContent).not.toHaveBeenCalled();
  });
});
