import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  documentContentDisposition,
  MESSAGE_DOCUMENT_MAX_BYTES,
  MESSAGE_DOCUMENT_MAX_NAME_LENGTH,
  MESSAGE_DOCUMENT_MAX_UPLOAD_BYTES,
  MESSAGE_DOCUMENT_RATE_LIMIT,
  MESSAGE_DOCUMENT_RATE_WINDOW_SECONDS,
  sanitizeDocumentFileName,
  validateMessageDocumentBytes,
} from "./message-documents";
import { uploadExceedsLimit } from "./message-images";

function capturedError(fn: () => unknown): ApiError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to throw an ApiError");
}

function pdfBytes(padding = 8): Uint8Array {
  const bytes = new Uint8Array(padding);
  bytes.set(new TextEncoder().encode("%PDF-1.7"));
  return bytes;
}

function zipBytes(): Uint8Array {
  return new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
}

describe("sanitizeDocumentFileName", () => {
  it("derives the MIME type from each allowed extension", () => {
    expect(sanitizeDocumentFileName("notes.pdf").mime).toBe("application/pdf");
    expect(sanitizeDocumentFileName("notes.txt").mime).toBe("text/plain");
    expect(sanitizeDocumentFileName("notes.csv").mime).toBe("text/csv");
    expect(sanitizeDocumentFileName("notes.zip").mime).toBe("application/zip");
    expect(sanitizeDocumentFileName("notes.docx").mime).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(sanitizeDocumentFileName("notes.xlsx").mime).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(sanitizeDocumentFileName("notes.pptx").mime).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
  });

  it("is case-insensitive and keeps display Unicode and spaces", () => {
    expect(sanitizeDocumentFileName("  রিপোর্ট Final.PDF  ")).toEqual({
      fileName: "রিপোর্ট Final.PDF",
      mime: "application/pdf",
    });
  });

  it("strips control characters from an otherwise valid name", () => {
    expect(sanitizeDocumentFileName("re\u0007port\u001f.pdf").fileName).toBe(
      "report.pdf",
    );
    expect(sanitizeDocumentFileName("inv\u202eoice.pdf").fileName).toBe(
      "invoice.pdf",
    );
  });

  it("rejects path traversal, separators and NUL", () => {
    for (const name of [
      "../report.pdf",
      "docs/report.pdf",
      "docs\\report.pdf",
      "report..pdf",
      "re\u0000port.pdf",
    ]) {
      expect(capturedError(() => sanitizeDocumentFileName(name)).status).toBe(
        422,
      );
    }
  });

  it("rejects missing, hidden and unknown extensions", () => {
    for (const name of ["report", ".pdf", "report.exe", "report.docx.exe"]) {
      expect(capturedError(() => sanitizeDocumentFileName(name)).status).toBe(
        422,
      );
    }
  });

  it("rejects empty, control-only and over-long names", () => {
    expect(capturedError(() => sanitizeDocumentFileName("   ")).status).toBe(
      422,
    );
    expect(capturedError(() => sanitizeDocumentFileName("\u0007")).status).toBe(
      422,
    );
    const boundary = `${"a".repeat(
      MESSAGE_DOCUMENT_MAX_NAME_LENGTH - 4,
    )}.pdf`;
    expect(sanitizeDocumentFileName(boundary).fileName).toHaveLength(120);
    expect(() =>
      sanitizeDocumentFileName(`${"a".repeat(121)}.pdf`),
    ).toThrowError(ApiError);
  });
});

describe("validateMessageDocumentBytes", () => {
  it("accepts a PDF with its magic header", () => {
    expect(() =>
      validateMessageDocumentBytes(pdfBytes(), "application/pdf"),
    ).not.toThrow();
  });

  it("rejects a PDF whose contents are not a PDF", () => {
    expect(() =>
      validateMessageDocumentBytes(
        new TextEncoder().encode("<html>no</html>"),
        "application/pdf",
      ),
    ).toThrowError(ApiError);
  });

  it("accepts every ZIP-family container with PK\\x03\\x04", () => {
    for (const mime of [
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ] as const) {
      expect(() =>
        validateMessageDocumentBytes(zipBytes(), mime),
      ).not.toThrow();
    }
  });

  it("rejects a ZIP-family file with the wrong signature", () => {
    expect(() =>
      validateMessageDocumentBytes(
        new TextEncoder().encode("plain"),
        "application/zip",
      ),
    ).toThrowError(ApiError);
  });

  it("accepts strict UTF-8 text and rejects NUL or invalid bytes", () => {
    const encoder = new TextEncoder();
    expect(() =>
      validateMessageDocumentBytes(encoder.encode("a,b\n1,2\n"), "text/csv"),
    ).not.toThrow();
    expect(() =>
      validateMessageDocumentBytes(
        encoder.encode("রিপোর্ট"),
        "text/plain",
      ),
    ).not.toThrow();
    expect(() =>
      validateMessageDocumentBytes(new Uint8Array([0x61, 0x00, 0x62]), "text/plain"),
    ).toThrowError(ApiError);
    expect(() =>
      validateMessageDocumentBytes(new Uint8Array([0xff, 0xfe]), "text/plain"),
    ).toThrowError(ApiError);
  });

  it("rejects empty and oversized files at the 5 MiB boundary", () => {
    expect(() =>
      validateMessageDocumentBytes(new Uint8Array(), "application/pdf"),
    ).toThrowError(ApiError);

    const atCap = new Uint8Array(MESSAGE_DOCUMENT_MAX_BYTES);
    atCap.set(new TextEncoder().encode("%PDF-"));
    expect(() =>
      validateMessageDocumentBytes(atCap, "application/pdf"),
    ).not.toThrow();

    const overCap = new Uint8Array(MESSAGE_DOCUMENT_MAX_BYTES + 1);
    overCap.set(new TextEncoder().encode("%PDF-"));
    const error = capturedError(() =>
      validateMessageDocumentBytes(overCap, "application/pdf"),
    );
    expect(error.status).toBe(422);
    expect(error.message).toContain("5 MB");
  });
});

describe("document upload limits", () => {
  it("allows 10 uploads per minute", () => {
    expect(MESSAGE_DOCUMENT_RATE_LIMIT).toBe(10);
    expect(MESSAGE_DOCUMENT_RATE_WINDOW_SECONDS).toBe(60);
  });

  it("shares the 6 MiB pre-parse multipart cap", () => {
    expect(MESSAGE_DOCUMENT_MAX_UPLOAD_BYTES).toBe(6 * 1024 * 1024);
    expect(uploadExceedsLimit(String(MESSAGE_DOCUMENT_MAX_UPLOAD_BYTES))).toBe(
      false,
    );
    expect(
      uploadExceedsLimit(String(MESSAGE_DOCUMENT_MAX_UPLOAD_BYTES + 1)),
    ).toBe(true);
  });
});

describe("documentContentDisposition", () => {
  it("uses an RFC 5987 UTF-8 filename", () => {
    expect(documentContentDisposition("Lab report (final).pdf")).toBe(
      "attachment; filename*=UTF-8''Lab%20report%20%28final%29.pdf",
    );
  });

  it("encodes non-ASCII names", () => {
    expect(documentContentDisposition("রিপোর্ট.pdf")).toBe(
      `attachment; filename*=UTF-8''${encodeURIComponent("রিপোর্ট.pdf")}`,
    );
  });

  it("encodes apostrophes and asterisks the grammar rejects", () => {
    expect(documentContentDisposition("a'b*c.pdf")).toBe(
      "attachment; filename*=UTF-8''a%27b%2Ac.pdf",
    );
  });
});
