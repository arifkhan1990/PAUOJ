import "dotenv/config";
import { eq, or } from "drizzle-orm";
import { hashPassword } from "@/server/auth/password";
import { getEnv } from "../env";
import {
  AdminRecoveryError,
  assertPromotionAllowed,
  assertRecoveryPassword,
  planAdminRecovery,
} from "./admin-recovery";
import { closeDb, getDb } from "./index";
import { auditLogs, authTokens, sessions, users } from "./schema";

const USAGE =
  "Usage: pnpm admin:reset -- --confirm [--promote]\n" +
  "  Reads SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then creates or resets that admin account.\n" +
  "  --promote is required when the matched account is currently not an admin.";

type RecoveryResult = {
  userId: string;
  created: boolean;
  username: string;
  email: string;
  revokedSessions: number;
  revokedTokens: number;
};

async function applyRecovery(allowPromote: boolean): Promise<RecoveryResult> {
  const env = getEnv();
  // Login normalises identifiers to lower case, so recovery must look up the
  // same keys or it would create an account the login form can never reach.
  const username = env.SEED_ADMIN_USERNAME.trim().toLowerCase();
  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();

  assertRecoveryPassword(env.SEED_ADMIN_PASSWORD, { username, email });
  // Argon2 is slow by design: hash before the transaction so no row lock is held.
  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);

  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(2);

    const plan = planAdminRecovery(rows);
    if (plan.kind === "conflict") throw new AdminRecoveryError(plan.message);
    if (plan.kind === "update") {
      const existing = rows.find((row) => row.id === plan.userId);
      assertPromotionAllowed(existing?.role, allowPromote);
    }

    const now = new Date();
    let userId: string;
    let created = false;

    if (plan.kind === "create") {
      const inserted = await tx
        .insert(users)
        .values({
          username,
          email,
          displayName: "PAU OJ Admin",
          passwordHash,
          role: "ADMIN",
          emailVerifiedAt: now,
          isBanned: false,
          updatedAt: now,
        })
        .returning({ id: users.id });
      const row = inserted[0];
      if (!row) {
        throw new AdminRecoveryError("Could not create the recovery administrator.");
      }
      userId = row.id;
      created = true;
    } else {
      userId = plan.userId;
      const updated = await tx
        .update(users)
        .set({
          passwordHash,
          role: "ADMIN",
          emailVerifiedAt: now,
          isBanned: false,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      if (!updated[0]) {
        throw new AdminRecoveryError(
          "The matched account disappeared before it could be updated.",
        );
      }
    }

    // Any session created with the old password must stop working immediately,
    // and stale verification/password-reset links must not outlive recovery.
    const revoked = await tx
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ id: sessions.id });
    const revokedTokens = await tx
      .delete(authTokens)
      .where(eq(authTokens.userId, userId))
      .returning({ id: authTokens.id });

    await tx.insert(auditLogs).values({
      actorId: null,
      action: "admin.recovery",
      entityType: "user",
      entityId: userId,
      metadata: { username, email, created },
    });

    return {
      userId,
      created,
      username,
      email,
      revokedSessions: revoked.length,
      revokedTokens: revokedTokens.length,
    };
  });
}

function report(result: RecoveryResult): void {
  const verb = result.created ? "Created" : "Reset";
  process.stdout.write(
    [
      `${verb} admin "${result.username}" <${result.email}> (role ADMIN, email verified, not banned).`,
      `Revoked ${result.revokedSessions} session(s) and ${result.revokedTokens} pending auth token(s).`,
      `Audit: action=admin.recovery entityId=${result.userId}`,
      "",
    ].join("\n"),
  );
}

async function main(): Promise<number> {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const allowed = new Set(["--confirm", "--promote"]);
  const unknown = args.filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) {
    process.stderr.write(`Unknown argument(s): ${unknown.join(" ")}\n${USAGE}\n`);
    return 1;
  }
  // Never reset implicitly: the flag is the operator's explicit confirmation.
  if (!args.includes("--confirm")) {
    process.stderr.write(`Refusing to reset the admin without --confirm.\n${USAGE}\n`);
    return 1;
  }

  const result = await applyRecovery(args.includes("--promote"));
  report(result);
  return 0;
}

main()
  .then(async (code) => {
    await closeDb();
    process.exitCode = code;
  })
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Admin recovery failed: ${message}\n`);
    await closeDb();
    process.exitCode = 1;
  });
