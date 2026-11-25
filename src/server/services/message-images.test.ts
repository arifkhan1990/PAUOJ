import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  MESSAGE_ATTACHMENT_RATE_LIMIT,
  MESSAGE_IMAGE_MAX_BYTES,
  MESSAGE_IMAGE_MAX_DIMENSION,
  MESSAGE_IMAGE_RATE_LIMIT,
  MESSAGE_IMAGE_RATE_WINDOW_SECONDS,
  validateMessageImageBytes,
} from "./message-images";

/** 8-byte signature + IHDR chunk with the given dimensions. */
function png(width: number, height: number): Uint8Array {
  const header = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
  ]);
  const dimensions = new Uint8Array(8);
  new DataView(dimensions.buffer).setUint32(0, width);
  new DataView(dimensions.buffer).setUint32(4, height);
  return new Uint8Array([...header, ...dimensions, 0, 0, 0, 0]);
}

function capturedError(fn: () => unknown): ApiError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to throw an ApiError");
}

describe("validateMessageImageBytes", () => {
  it("accepts a supported PNG and reads its dimensions", () => {
    expect(validateMessageImageBytes(png(640, 480))).toEqual({
      mime: "image/png",
      width: 640,
      height: 480,
    });
  });

  it("rejects empty uploads", () => {
    const error = capturedError(() =>
      validateMessageImageBytes(new Uint8Array()),
    );
    expect(error.status).toBe(422);
  });

  it("rejects files above the 5 MiB cap before sniffing", () => {
    const error = capturedError(() =>
      validateMessageImageBytes(new Uint8Array(MESSAGE_IMAGE_MAX_BYTES + 1)),
    );
    expect(error.status).toBe(422);
    expect(error.message).toContain("5 MB");
  });

  it("rejects content that is not a supported image", () => {
    expect(() =>
      validateMessageImageBytes(new TextEncoder().encode("<svg></svg>")),
    ).toThrowError(ApiError);
    expect(() =>
      validateMessageImageBytes(
        new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
      ),
    ).toThrowError(ApiError);
  });

  it("rejects images above 4096 pixels on either side", () => {
    const error = capturedError(() =>
      validateMessageImageBytes(png(MESSAGE_IMAGE_MAX_DIMENSION + 1, 100)),
    );
    expect(error.status).toBe(422);
    expect(
      validateMessageImageBytes(png(MESSAGE_IMAGE_MAX_DIMENSION, 100)),
    ).toMatchObject({ width: 4096 });
  });
});

describe("image message limits", () => {
  it("allows 10 uploads per minute and 240 reads", () => {
    expect(MESSAGE_IMAGE_RATE_LIMIT).toBe(10);
    expect(MESSAGE_IMAGE_RATE_WINDOW_SECONDS).toBe(60);
    expect(MESSAGE_ATTACHMENT_RATE_LIMIT).toBe(240);
  });
});
