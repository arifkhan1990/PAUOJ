import { eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { authTokens, sessions, users } from "@/server/db/schema";
import type { SafeUser } from "@/server/auth/session";
import { hashPassword } from "@/server/auth/password";
import { consumeAuthToken, issueAuthToken } from "@/server/auth/tokens";
import { logger } from "@/server/logger";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/server/mail";

export async function sendVerificationForUser(user: SafeUser): Promise<boolean> {
  if (user.emailVerifiedAt) return true;
  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION");
  const sent = await sendVerificationEmail({
    to: user.email,
    displayName: user.displayName,
    token,
  });
  if (!sent) {
    logger.warn("Verification email was not delivered", { userId: user.id });
  }
  return sent;
}

export async function sendPasswordResetForEmail(email: string): Promise<void> {
  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      isBanned: users.isBanned,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  const user = rows[0];
  if (!user || user.isBanned) return;
  const token = await issueAuthToken(user.id, "PASSWORD_RESET");
  const sent = await sendPasswordResetEmail({
    to: user.email,
    displayName: user.displayName,
    token,
  });
  if (!sent) {
    logger.warn("Password reset email was not delivered", { userId: user.id });
  }
}

export async function verifyEmailToken(token: string): Promise<void> {
  const userId = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!userId) {
    throw errors.validation("This verification link is invalid or has expired.");
  }
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<void> {
  const userId = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!userId) {
    throw errors.validation("This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(newPassword);
  await getDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(authTokens).where(eq(authTokens.userId, userId));
  });
}
