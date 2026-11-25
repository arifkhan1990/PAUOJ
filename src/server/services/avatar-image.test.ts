import { describe, expect, it } from "vitest";
import { detectAvatarImage } from "./avatar-image";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

/** 8-byte signature + IHDR chunk with the given dimensions. */
function png(width: number, height: number): Uint8Array {
  const header = bytes(
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52,
  );
  const dimensions = new Uint8Array(8);
  new DataView(dimensions.buffer).setUint32(0, width);
  new DataView(dimensions.buffer).setUint32(4, height);
  return new Uint8Array([...header, ...dimensions, 0, 0, 0, 0]);
}

/** SOI + SOF0 with the given dimensions. */
function jpeg(width: number, height: number): Uint8Array {
  return bytes(
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9,
  );
}

function webpVp8l(width: number, height: number): Uint8Array {
  const bits = (width - 1) | ((height - 1) << 14);
  return bytes(
    0x52,
    0x49,
    0x46,
    0x46, // RIFF
    0x16,
    0x00,
    0x00,
    0x00,
    0x57,
    0x45,
    0x42,
    0x50, // WEBP
    0x56,
    0x50,
    0x38,
    0x4c, // VP8L
    0x05,
    0x00,
    0x00,
    0x00,
    0x2f,
    bits & 0xff,
    (bits >> 8) & 0xff,
    (bits >> 16) & 0xff,
    (bits >> 24) & 0xff,
    0x00,
  );
}

function webpVp8x(width: number, height: number): Uint8Array {
  return bytes(
    0x52,
    0x49,
    0x46,
    0x46,
    0x16,
    0x00,
    0x00,
    0x00,
    0x57,
    0x45,
    0x42,
    0x50,
    0x56,
    0x50,
    0x38,
    0x58,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    (width - 1) & 0xff,
    ((width - 1) >> 8) & 0xff,
    ((width - 1) >> 16) & 0xff,
    (height - 1) & 0xff,
    ((height - 1) >> 8) & 0xff,
    ((height - 1) >> 16) & 0xff,
  );
}

describe("detectAvatarImage", () => {
  it("reads PNG dimensions from the IHDR header", () => {
    expect(detectAvatarImage(png(512, 512))).toEqual({
      mime: "image/png",
      width: 512,
      height: 512,
    });
  });

  it("reads JPEG dimensions from the frame header", () => {
    expect(detectAvatarImage(jpeg(300, 200))).toEqual({
      mime: "image/jpeg",
      width: 300,
      height: 200,
    });
  });

  it("reads both lossless and extended WebP dimensions", () => {
    expect(detectAvatarImage(webpVp8l(640, 480))).toEqual({
      mime: "image/webp",
      width: 640,
      height: 480,
    });
    expect(detectAvatarImage(webpVp8x(1024, 768))).toEqual({
      mime: "image/webp",
      width: 1024,
      height: 768,
    });
  });

  it("rejects unsupported, empty and truncated files", () => {
    expect(detectAvatarImage(new Uint8Array())).toBeNull();
    expect(detectAvatarImage(new TextEncoder().encode("<svg></svg>"))).toBeNull();
    expect(detectAvatarImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull();
    expect(detectAvatarImage(png(512, 512).slice(0, 16))).toBeNull();
    expect(detectAvatarImage(jpeg(300, 200).slice(0, 8))).toBeNull();
  });
});
