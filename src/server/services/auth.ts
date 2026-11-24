import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { SafeUser } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toSafeUser } from "@/server/auth/session";
import { ApiError, errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import type {
  ChangePasswordInput,
  LoginInput,
  ProfileInput,
  RegisterInput,
} from "@/lib/schemas/auth";

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$OulsjTMKeI3lXP8BOnpcNw$rcgRDzOctAWPlsFo4zFyzNU08JET1I8yEuTwuSDkIcs";

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const db = getDb();
  const existing = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, input.username), eq(users.email, input.email)))
    .limit(1);

  if (existing[0]?.username === input.username) {
    throw errors.conflict("That username is already taken.");
  }
  if (existing[0]?.email === input.email) {
    throw errors.conflict("An account with that email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const rows = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    })
    .returning();

  const user = rows[0];
  if (!user) throw new ApiError("REGISTRATION_FAILED", "Could not create the account.", 500);
  return toSafeUser(user);
}

export async function authenticateUser(
  input: LoginInput,
): Promise<SafeUser> {
  const identifier = input.identifier.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  const user = rows[0];
  const valid = await verifyPassword(
    user?.passwordHash ?? DUMMY_HASH,
    input.password,
  );

  if (!user || !valid) {
    throw new ApiError(
      "INVALID_CREDENTIALS",
      "Incorrect username or password.",
      401,
    );
  }
  if (user.isBanned) {
    throw errors.forbidden("This account has been suspended.");
  }
  return toSafeUser(user);
}

export async function getUserWithHash(
  userId: string,
): Promise<{ user: SafeUser; passwordHash: string } | null> {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { user: toSafeUser(row), passwordHash: row.passwordHash };
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
): Promise<SafeUser> {
  const textValues = {
    ...(input.bio === undefined
      ? {}
      : { bio: input.bio.trim() ? input.bio.trim() : null }),
    ...(input.country === undefined
      ? {}
      : { country: input.country.trim() ? input.country.trim() : null }),
    ...(input.institution === undefined
      ? {}
      : {
          institution: input.institution.trim()
            ? input.institution.trim()
            : null,
        }),
    ...(input.address === undefined
      ? {}
      : { address: input.address?.trim() ? input.address.trim() : null }),
    ...(input.phone === undefined
      ? {}
      : { phone: input.phone?.trim() ? input.phone.trim() : null }),
    ...(input.companyName === undefined
      ? {}
      : {
          companyName: input.companyName?.trim()
            ? input.companyName.trim()
            : null,
        }),
    ...(input.jobTitle === undefined
      ? {}
      : { jobTitle: input.jobTitle?.trim() ? input.jobTitle.trim() : null }),
  };
  const detailValues = {
    ...(input.currentStatus === undefined
      ? {}
      : { currentStatus: input.currentStatus }),
    ...(input.tshirtSize === undefined
      ? {}
      : { tshirtSize: input.tshirtSize }),
    ...(input.skills === undefined ? {} : { skills: input.skills }),
  };
  const linkValues = {
    ...(input.website === undefined ? {} : { website: input.website }),
    ...(input.github === undefined ? {} : { github: input.github }),
    ...(input.linkedin === undefined ? {} : { linkedin: input.linkedin }),
  };
  const rows = await getDb()
    .update(users)
    .set({
      displayName: input.displayName,
      ...textValues,
      ...detailValues,
      ...linkValues,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  const row = rows[0];
  if (!row) throw errors.notFound("User not found.");
  return toSafeUser(row);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const current = await getUserWithHash(userId);
  if (!current) throw errors.notFound("User not found.");

  const valid = await verifyPassword(current.passwordHash, input.currentPassword);
  if (!valid) {
    throw new ApiError(
      "INVALID_PASSWORD",
      "Your current password is incorrect.",
      401,
    );
  }
  if (input.currentPassword === input.newPassword) {
    throw errors.validation("Choose a password different from your current one.");
  }

  const passwordHash = await hashPassword(input.newPassword);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
  });
}

export async function listAdminUsers(
  input: PaginationInput & { q?: string },
): Promise<{ items: SafeUser[]; total: number }> {
  const db = getDb();
  const where = input.q
    ? or(
        ilike(users.username, `%${input.q}%`),
        ilike(users.displayName, `%${input.q}%`),
        ilike(users.email, `%${input.q}%`),
      )
    : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(users)
    .where(where);

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(input.pageSize)
    .offset(toOffset(input));

  return {
    items: rows.map((row) => toSafeUser(row)),
    total: Number(totalRow?.value ?? 0),
  };
}

async function countAdmins(): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "ADMIN"));
  return Number(row?.value ?? 0);
}

export async function updateUserRole(
  actorId: string,
  targetId: string,
  role: "USER" | "TEACHER" | "ADMIN",
): Promise<void> {
  if (actorId === targetId && role !== "ADMIN") {
    throw errors.validation("You cannot remove your own admin access.");
  }

  const rows = await getDb()
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  const target = rows[0];
  if (!target) throw errors.notFound("User not found.");

  if (target.role === "ADMIN" && role !== "ADMIN" && (await countAdmins()) <= 1) {
    throw errors.conflict("At least one administrator must remain.");
  }

  await getDb()
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, targetId));
}

export async function setUserBanned(
  actorId: string,
  targetId: string,
  banned: boolean,
): Promise<void> {
  if (actorId === targetId) {
    throw errors.validation("You cannot suspend your own account.");
  }
  const rows = await getDb()
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  const target = rows[0];
  if (!target) throw errors.notFound("User not found.");

  if (banned && target.role === "ADMIN" && (await countAdmins()) <= 1) {
    throw errors.conflict("At least one administrator must remain.");
  }

  await getDb()
    .update(users)
    .set({ isBanned: banned, updatedAt: new Date() })
    .where(eq(users.id, targetId));

  if (banned) {
    await getDb().delete(sessions).where(eq(sessions.userId, targetId));
  }
}

export async function findUserByUsername(username: string): Promise<SafeUser | null> {
  const rows = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.username, username.toLowerCase())))
    .limit(1);
  const row = rows[0];
  return row ? toSafeUser(row) : null;
}
