/**
 * Pure helpers for the offline admin recovery CLI (`./reset-admin.ts`).
 * No environment, database or logging access here so the guards stay unit
 * testable and the CLI keeps a single, explicit path to the database.
 */

export const DEFAULT_SEED_PASSWORD = "ChangeMe123!";
export const RECOVERY_MIN_PASSWORD_LENGTH = 12;

export class AdminRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminRecoveryError";
  }
}

export type RecoveryIdentifiers = {
  username: string;
  email: string;
};

export type RecoveryUser = {
  id: string;
  username: string;
  email: string;
  role?: string;
};

export type RecoveryPlan =
  | { kind: "create" }
  | { kind: "update"; userId: string }
  | { kind: "conflict"; message: string };

/**
 * Rejects recovery passwords that would leave the new admin as weak as the
 * public defaults: the documented seed password, anything under 12 characters,
 * or a password that is really just the account identifier.
 */
export function assertRecoveryPassword(
  password: string,
  identifiers?: Partial<RecoveryIdentifiers>,
): void {
  if (typeof password !== "string" || password.trim().length === 0) {
    throw new AdminRecoveryError("SEED_ADMIN_PASSWORD must not be empty.");
  }
  if (password === DEFAULT_SEED_PASSWORD) {
    throw new AdminRecoveryError(
      "SEED_ADMIN_PASSWORD is the default seed password; choose a new one for the production admin.",
    );
  }
  if (password.length < RECOVERY_MIN_PASSWORD_LENGTH) {
    throw new AdminRecoveryError(
      `SEED_ADMIN_PASSWORD must be at least ${RECOVERY_MIN_PASSWORD_LENGTH} characters long.`,
    );
  }
  const normalized = password.trim().toLowerCase();
  const reserved = [identifiers?.username, identifiers?.email]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
  if (reserved.includes(normalized)) {
    throw new AdminRecoveryError(
      "SEED_ADMIN_PASSWORD must not be the admin username or email address.",
    );
  }
}

/**
 * A recovery run may legitimately re-promote a demoted admin, but a mistyped
 * identifier must not silently turn an ordinary user into an administrator.
 */
export function assertPromotionAllowed(
  role: string | undefined,
  allowPromote: boolean,
): void {
  if (role === "ADMIN" || allowPromote) return;
  throw new AdminRecoveryError(
    `The matched account has role ${role ?? "UNKNOWN"}; rerun with --promote to promote that exact account.`,
  );
}

/**
 * Decides whether the recovery run creates an admin, updates the single
 * matching account, or must stop because the username and email already belong
 * to two different accounts.
 */
export function planAdminRecovery(rows: RecoveryUser[]): RecoveryPlan {
  const distinct = [...new Map(rows.map((row) => [row.id, row])).values()];
  if (distinct.length === 0) return { kind: "create" };
  const only = distinct[0];
  if (distinct.length === 1 && only) return { kind: "update", userId: only.id };
  return {
    kind: "conflict",
    message:
      "SEED_ADMIN_EMAIL and SEED_ADMIN_USERNAME belong to different accounts; refusing to change either. Fix the identifiers and rerun.",
  };
}
