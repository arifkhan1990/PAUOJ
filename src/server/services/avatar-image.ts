export type DetectedAvatarImage = {
  mime: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_START_OF_FRAME = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
  0xcf,
]);

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! << 8) | bytes[offset + 1]!;
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! * 0x1000000 +
    ((bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!)
  );
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.length < prefix.length) return false;
  return prefix.every((byte, index) => bytes[index] === byte);
}

function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (!hasPrefix(bytes, PNG_SIGNATURE) || bytes.length < 24) return null;
  // 8-byte signature, 4-byte chunk length, "IHDR", then width and height.
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  return width > 0 && height > 0 ? { width, height } : null;
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;

  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    let marker = bytes[offset + 1]!;
    offset += 2;

    // Fill bytes are allowed before a marker.
    while (marker === 0xff) {
      if (offset >= bytes.length) return null;
      marker = bytes[offset]!;
      offset += 1;
    }

    if (
      marker === 0x00 ||
      marker === 0x01 ||
      marker === 0xd8 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }
    // EOI or start of scan before a frame header means no dimensions exist.
    if (marker === 0xd9 || marker === 0xda) return null;
    if (offset + 2 > bytes.length) return null;

    const length = readUint16BE(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;

    if (JPEG_START_OF_FRAME.has(marker)) {
      if (length < 7) return null;
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += length;
  }

  return null;
}

function webpSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 12) return null;
  if (
    String.fromCharCode(...bytes.subarray(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.subarray(8, 12)) !== "WEBP"
  ) {
    return null;
  }

  const chunk = String.fromCharCode(...bytes.subarray(12, 16));
  if (chunk === "VP8 ") {
    if (bytes.length < 30) return null;
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null;
    }
    const width = readUint16LE(bytes, 26) & 0x3fff;
    const height = readUint16LE(bytes, 28) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f || bytes.length < 25) return null;
    const bits =
      bytes[21]! |
      (bytes[22]! << 8) |
      (bytes[23]! << 16) |
      (bytes[24]! << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  if (chunk === "VP8X") {
    const width = readUint24LE(bytes, 24) + 1;
    const height = readUint24LE(bytes, 27) + 1;
    return { width, height };
  }

  return null;
}

/**
 * Detects supported avatar formats from their bytes, never from the client
 * MIME or filename. Dimensions are parsed from the header so an oversized
 * image is rejected before we store or serve it.
 */
export function detectAvatarImage(
  bytes: Uint8Array,
): DetectedAvatarImage | null {
  if (bytes.length === 0) return null;

  const png = pngSize(bytes);
  if (png) return { mime: "image/png", ...png };

  const jpeg = jpegSize(bytes);
  if (jpeg) return { mime: "image/jpeg", ...jpeg };

  const webp = webpSize(bytes);
  if (webp) return { mime: "image/webp", ...webp };

  return null;
}
