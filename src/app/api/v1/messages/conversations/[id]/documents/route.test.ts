import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errors } from "@/server/api/errors";

const {
  assertSameOrigin,
  requireApiUser,
  enforceRateLimit,
  sendMessageDocument,
} = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  requireApiUser: vi.fn(),
  enforceRateLimit: vi.fn(),
  sendMessageDocument: vi.fn(),
}));

vi.mock("@/server/api/auth", () => ({ assertSameOrigin, requireApiUser }));
vi.mock("@/server/api/rate-limit", () => ({ enforceRateLimit }));
vi.mock("@/server/services/message-documents", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/server/services/message-documents")
    >();
  return { ...actual, sendMessageDocument };
});

const { POST } = await import("./route");

const CONVERSATION_ID = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
const USER = { id: "user-1", username: "ada", displayName: "Ada" };

function context(id = CONVERSATION_ID) {
  return { params: Promise.resolve({ id }) };
}

type UploadOverrides = {
  file?: File;
  caption?: string | Blob;
  contentLength?: string;
  brokenMultipart?: boolean;
};

function uploadRequest(overrides: UploadOverrides = {}): NextRequest {
  const form = new FormData();
  if (overrides.file !== undefined) {
    form.append("file", overrides.file);
  }
  if (overrides.caption !== undefined) {
    form.append("caption", overrides.caption);
  }
  const headers = new Headers();
  if (overrides.contentLength !== undefined) {
    headers.set("content-length", overrides.contentLength);
  }
  return {
    headers,
    formData: async () => {
      if (overrides.brokenMultipart) throw new Error("bad multipart");
      return form;
    },
  } as unknown as NextRequest;
}

function pdfFile(
  name = "report.pdf",
  bytes: number[] | Uint8Array = [0x25, 0x50, 0x44, 0x46, 0x2d],
) {
  return new File([new Uint8Array(bytes)], name, {
    type: "application/pdf",
  });
}

describe("POST /api/v1/messages/conversations/[id]/documents", () => {
  beforeEach(() => {
    assertSameOrigin.mockReset();
    requireApiUser.mockReset();
    enforceRateLimit.mockReset();
    sendMessageDocument.mockReset();
    requireApiUser.mockResolvedValue(USER);
    enforceRateLimit.mockResolvedValue({ allowed: true });
    sendMessageDocument.mockResolvedValue({ id: "message-1" });
  });

  it("sends a document with its caption and returns 201", async () => {
    const response = await POST(
      uploadRequest({ file: pdfFile(), caption: "  lab notes  " }),
      context(),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: { id: "message-1" },
    });
    expect(enforceRateLimit).toHaveBeenCalledWith(
      "message-document:user-1",
      10,
      60,
      expect.any(String),
    );
    const [viewer, conversationId, bytes, fileName, caption] =
      sendMessageDocument.mock.calls[0];
    expect(viewer).toBe(USER);
    expect(conversationId).toBe(CONVERSATION_ID);
    expect(Array.from(bytes as Uint8Array)).toEqual([
      0x25, 0x50, 0x44, 0x46, 0x2d,
    ]);
    expect(fileName).toBe("report.pdf");
    expect(caption).toBe("  lab notes  ");
  });

  it("defaults the caption to an empty string", async () => {
    await POST(uploadRequest({ file: pdfFile() }), context());

    expect(sendMessageDocument.mock.calls[0][4]).toBe("");
  });

  it("ignores a non-text caption field", async () => {
    await POST(
      uploadRequest({ file: pdfFile(), caption: new Blob(["x"]) }),
      context(),
    );

    expect(sendMessageDocument.mock.calls[0][4]).toBe("");
  });

  it("rejects anonymous callers with 401", async () => {
    requireApiUser.mockRejectedValue(errors.unauthorized());

    const response = await POST(uploadRequest({ file: pdfFile() }), context());

    expect(response.status).toBe(401);
    expect(sendMessageDocument).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests with 403", async () => {
    assertSameOrigin.mockImplementation(() => {
      throw errors.forbidden("Cross-origin request blocked.");
    });

    const response = await POST(uploadRequest({ file: pdfFile() }), context());

    expect(response.status).toBe(403);
  });

  it("rejects a missing file with 422", async () => {
    const response = await POST(uploadRequest(), context());

    expect(response.status).toBe(422);
    expect(sendMessageDocument).not.toHaveBeenCalled();
  });

  it("rejects an empty file with 422", async () => {
    const response = await POST(uploadRequest({ file: pdfFile("empty.pdf", []) }), context());

    expect(response.status).toBe(422);
  });

  it("rejects a file above 5 MiB with 422", async () => {
    const file = pdfFile(
      "big.pdf",
      new Uint8Array(5 * 1024 * 1024 + 1),
    );

    const response = await POST(uploadRequest({ file }), context());

    expect(response.status).toBe(422);
  });

  it("rejects an oversized declared body before parsing", async () => {
    const response = await POST(
      uploadRequest({
        file: pdfFile(),
        contentLength: String(6 * 1024 * 1024 + 1),
      }),
      context(),
    );

    expect(response.status).toBe(422);
    expect(sendMessageDocument).not.toHaveBeenCalled();
  });

  it("rejects malformed multipart bodies with 422", async () => {
    const response = await POST(
      uploadRequest({ brokenMultipart: true }),
      context(),
    );

    expect(response.status).toBe(422);
  });

  it("maps service gates to 404, 403 and 422", async () => {
    sendMessageDocument.mockRejectedValueOnce(errors.notFound());
    expect(
      (await POST(uploadRequest({ file: pdfFile() }), context())).status,
    ).toBe(404);

    sendMessageDocument.mockRejectedValueOnce(errors.forbidden());
    expect(
      (await POST(uploadRequest({ file: pdfFile() }), context())).status,
    ).toBe(403);

    sendMessageDocument.mockRejectedValueOnce(
      errors.validation("The file contents do not match its extension."),
    );
    expect(
      (await POST(uploadRequest({ file: pdfFile() }), context())).status,
    ).toBe(422);
  });

  it("maps the upload limiter to 429", async () => {
    enforceRateLimit.mockRejectedValue(errors.rateLimited());

    const response = await POST(uploadRequest({ file: pdfFile() }), context());

    expect(response.status).toBe(429);
    expect(sendMessageDocument).not.toHaveBeenCalled();
  });
});
