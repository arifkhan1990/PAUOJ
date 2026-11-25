import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { userAvatarImages, users } from "@/server/db/schema";
import {
  AVATAR_IMAGE_MAX_BYTES,
  AVATAR_IMAGE_MAX_DIMENSION,
  isAvatarPresetId,
} from "@/lib/avatars";
import { detectAvatarImage } from "./avatar-image";

export type AvatarSelection = {
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | null;
};

const selection = {
  avatarPreset: users.avatarPreset,
  avatarImageUpdatedAt: users.avatarImageUpdatedAt,
};

export async function setAvatarPreset(
  userId: string,
  preset: string | null,
): Promise<AvatarSelection> {
  if (preset !== null && !isAvatarPresetId(preset)) {
    throw errors.validation("Choose one of the available avatar presets.");
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(userAvatarImages).where(eq(userAvatarImages.userId, userId));
    await tx
      .update(users)
      .set({
        avatarPreset: preset,
        avatarImageUpdatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  });

  return { avatarPreset: preset, avatarImageUpdatedAt: null };
}

export async function saveUserAvatarImage(
  userId: string,
  bytes: Uint8Array,
): Promise<AvatarSelection> {
  if (bytes.byteLength === 0 || bytes.byteLength > AVATAR_IMAGE_MAX_BYTES) {
    throw errors.validation("Avatar images must be at most 1 MB.");
  }

  const detected = detectAvatarImage(bytes);
  if (!detected) {
    throw errors.validation("Use a PNG, JPG or WebP image.");
  }
  if (
    detected.width > AVATAR_IMAGE_MAX_DIMENSION ||
    detected.height > AVATAR_IMAGE_MAX_DIMENSION
  ) {
    throw errors.validation(
      `Avatar images must be at most ${AVATAR_IMAGE_MAX_DIMENSION}×${AVATAR_IMAGE_MAX_DIMENSION} pixels.`,
    );
  }

  const db = getDb();
  const now = new Date();
  const digest = createHash("sha256").update(bytes).digest("hex");
  const buffer = Buffer.from(bytes);

  await db.transaction(async (tx) => {
    await tx
      .insert(userAvatarImages)
      .values({
        userId,
        mime: detected.mime,
        bytes: buffer,
        width: detected.width,
        height: detected.height,
        sha256: digest,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userAvatarImages.userId,
        set: {
          mime: detected.mime,
          bytes: buffer,
          width: detected.width,
          height: detected.height,
          sha256: digest,
          updatedAt: now,
        },
      });
    await tx
      .update(users)
      .set({ avatarImageUpdatedAt: now, updatedAt: now })
      .where(eq(users.id, userId));
  });

  const rows = await db
    .select(selection)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? { avatarPreset: null, avatarImageUpdatedAt: now };
}

export async function removeUserAvatarImage(
  userId: string,
): Promise<AvatarSelection> {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(userAvatarImages).where(eq(userAvatarImages.userId, userId));
    await tx
      .update(users)
      .set({ avatarImageUpdatedAt: null, updatedAt: now })
      .where(eq(users.id, userId));
  });

  const rows = await db
    .select(selection)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? { avatarPreset: null, avatarImageUpdatedAt: null };
}

export type PublicAvatarImage = {
  mime: string;
  bytes: Uint8Array;
};

export async function getPublicAvatarImage(
  username: string,
): Promise<PublicAvatarImage | null> {
  const rows = await getDb()
    .select({
      mime: userAvatarImages.mime,
      bytes: userAvatarImages.bytes,
      isBanned: users.isBanned,
    })
    .from(users)
    .innerJoin(userAvatarImages, eq(userAvatarImages.userId, users.id))
    .where(and(eq(users.username, username.toLowerCase()), eq(users.isBanned, false)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { mime: row.mime, bytes: row.bytes };
}
