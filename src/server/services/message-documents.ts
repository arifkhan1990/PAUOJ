import { errors } from "@/server/api/errors";
import type {
  MessageDocumentMime,
  MessageItem,
} from "@/lib/message-types";
import { normalizeMessageCaption } from "./message-helpers";
import { deliverMessage, loadMessageSendTarget, type MessageViewer } from "./message-send";

export const MESSAGE_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
/** 5 MiB file plus multipart framing, checked before the body is buffered. */
export const MESSAGE_DOCUMENT_MAX_UPLOAD_BYTES =
  MESSAGE_DOCUMENT_MAX_BYTES + 1024 * 1024;
export const MESSAGE_DOCUMENT_MAX_NAME_LENGTH = 120;
export const MESSAGE_DOCUMENT_RATE_LIMIT = 10;
export const MESSAGE_DOCUMENT_RATE_WINDOW_SECONDS = 60;

/**
 * Allow-listed extensions only; the MIME type is derived from the extension,
 * never trusted from the client. Legacy Office binaries stay out.
 */
export const MESSAGE_DOCUMENT_TYPES: Readonly<
  Record<string, MessageDocumentMime>
> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".zip": "application/zip",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const ZIP_FAMILY: ReadonlySet<MessageDocumentMime> = new Set([
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const TEXT_MIMES: ReadonlySet<MessageDocumentMime> = new Set([
  "text/plain",
  "text/csv",
]);

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

/** C0/C1 and bidi controls are stripped; NUL is rejected below. */
const CONTROL_CHARACTERS =
  /[\u0001-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

const INVALID_FILE_NAME = "That file name is not allowed.";
const UNSUPPORTED_FILE_TYPE =
  "Use a PDF, TXT, CSV, ZIP, DOCX, XLSX or PPTX file.";

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.byteLength < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function isStrictUtf8Text(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a client-supplied file name to a display-only value. Path
 * separators, `..` and NUL are rejected rather than silently rewritten; other
 * control characters are stripped. The extension decides the MIME type.
 */
export function sanitizeDocumentFileName(raw: string): {
  fileName: string;
  mime: MessageDocumentMime;
} {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw errors.validation("Choose a file to send.");
  }
  if (
    trimmed.includes("\u0000") ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("..")
  ) {
    throw errors.validation(INVALID_FILE_NAME);
  }
  const fileName = trimmed.replace(CONTROL_CHARACTERS, "").trim();
  if (fileName.length === 0) {
    throw errors.validation(INVALID_FILE_NAME);
  }
  if ([...fileName].length > MESSAGE_DOCUMENT_MAX_NAME_LENGTH) {
    throw errors.validation(
      `File names can be at most ${MESSAGE_DOCUMENT_MAX_NAME_LENGTH} characters.`,
    );
  }
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) {
    throw errors.validation(UNSUPPORTED_FILE_TYPE);
  }
  const mime = MESSAGE_DOCUMENT_TYPES[fileName.slice(dot).toLowerCase()];
  if (!mime) {
    throw errors.validation(UNSUPPORTED_FILE_TYPE);
  }
  return { fileName, mime };
}

/**
 * Content sniffing for documents: PDF and the ZIP family must carry their
 * signature, TXT/CSV must decode as strict UTF-8 text without NUL bytes.
 */
export function validateMessageDocumentBytes(
  bytes: Uint8Array,
  mime: MessageDocumentMime,
): void {
  if (bytes.byteLength === 0) {
    throw errors.validation("That file is empty.");
  }
  if (bytes.byteLength > MESSAGE_DOCUMENT_MAX_BYTES) {
    throw errors.validation("Files must be at most 5 MB.");
  }
  const matches =
    mime === "application/pdf"
      ? startsWith(bytes, PDF_SIGNATURE)
      : ZIP_FAMILY.has(mime)
        ? startsWith(bytes, ZIP_SIGNATURE)
        : TEXT_MIMES.has(mime)
          ? isStrictUtf8Text(bytes)
          : false;
  if (!matches) {
    throw errors.validation(
      "The file contents do not match its extension.",
    );
  }
}

/**
 * RFC 5987 header value: UTF-8 percent-encoding with the four characters
 * `encodeURIComponent` leaves alone that the grammar does not allow.
 */
export function documentContentDisposition(fileName: string): string {
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
  return `attachment; filename*=UTF-8''${encoded}`;
}

/**
 * Mirrors sendMessageImage: same participant/banned/block checks, one
 * transaction, one unread burst notification. The caption may be empty.
 */
export async function sendMessageDocument(
  viewer: MessageViewer,
  conversationId: string,
  bytes: Uint8Array,
  rawFileName: string,
  caption: string,
): Promise<MessageItem> {
  const { fileName, mime } = sanitizeDocumentFileName(rawFileName);
  validateMessageDocumentBytes(bytes, mime);
  const normalizedCaption = normalizeMessageCaption(caption);
  const target = await loadMessageSendTarget(viewer.id, conversationId);
  return deliverMessage({
    viewer,
    target,
    body: normalizedCaption,
    attachment: {
      kind: "DOCUMENT",
      mime,
      fileName,
      sizeBytes: bytes.byteLength,
      bytes,
    },
  });
}
