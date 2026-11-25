import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";
import { documentContentDisposition } from "@/server/services/message-documents";

const { requireApiUser, enforceRateLimit, getMessageAttachment } = vi.hoisted(
  () => ({
    requireApiUser: vi.fn(),
    enforceRateLimit: vi.fn(),
    getMessageAttachment: vi.fn(),
  }),
);

vi.mock("@/server/api/auth", () => ({ requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/message-images", () => ({
  getMessageAttachment,
  MESSAGE_ATTACHMENT_RATE_LIMIT: 240,
  MESSAGE_ATTACHMENT_RATE_WINDOW_SECONDS: 60,
}));

const { GET } = await import("./route");

const ATTACHMENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function context(id = ATTACHMENT_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/v1/messages/attachments/[id]", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    getMessageAttachment.mockReset();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("serves an image inline with its image MIME type", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    const bytes = new Uint8Array([1, 2, 3]);
    getMessageAttachment.mockResolvedValue({
      kind: "IMAGE",
      mime: "image/png",
      fileName: null,
      bytes,
    });

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toBe("inline");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-length")).toBe("3");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "message-attachment:user-1",
      240,
      60,
    );
  });

  it("downloads a document as opaque bytes with an encoded filename", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    getMessageAttachment.mockResolvedValue({
      kind: "DOCUMENT",
      mime: "application/pdf",
      fileName: "রিপোর্ট (final).pdf",
      bytes: new Uint8Array([4, 5]),
    });

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/octet-stream",
    );
    expect(response.headers.get("content-disposition")).toBe(
      documentContentDisposition("রিপোর্ট (final).pdf"),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("hides missing, deleted, blocked and non-participant attachments", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    getMessageAttachment.mockResolvedValue(null);

    const response = await GET({} as NextRequest, context("not-a-uuid"));

    expect(response.status).toBe(404);
  });

  it("rejects anonymous callers", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(401);
    expect(getMessageAttachment).not.toHaveBeenCalled();
  });

  it("maps the attachment limiter to 429", async () => {
    requireApiUser.mockResolvedValue({ id: "user-1" });
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await GET({} as NextRequest, context());

    expect(response.status).toBe(429);
    expect(getMessageAttachment).not.toHaveBeenCalled();
  });
});
