import { AVATAR_IMAGE_OUTPUT_SIZE } from "@/lib/avatars";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the HTMLImageElement path.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That image could not be read."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Crops any accepted image to a square and downscales it to 512px before
 * upload. Keeps requests small and strips EXIF metadata in the browser.
 */
export async function prepareAvatarFile(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPG or WebP image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That image is too large. Choose a file under 8 MB.");
  }

  const image = await loadImage(file);
  const width = image.width;
  const height = image.height;
  if (!width || !height) {
    throw new Error("That image could not be read.");
  }

  const side = Math.min(width, height);
  const sourceX = (width - side) / 2;
  const sourceY = (height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_IMAGE_OUTPUT_SIZE;
  canvas.height = AVATAR_IMAGE_OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process that image.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if ("close" in image) image.close();

  let blob = await toBlob(canvas, "image/webp", 0.9);
  let extension = "webp";
  if (!blob) {
    blob = await toBlob(canvas, "image/jpeg", 0.9);
    extension = "jpg";
  }
  if (!blob) {
    throw new Error("Your browser could not process that image.");
  }

  return new File([blob], `avatar.${extension}`, { type: blob.type });
}
