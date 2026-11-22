type ErrorWithCause = {
  code?: unknown;
  cause?: unknown;
};

/** Reads a Postgres error code, following Drizzle's `cause` chain. */
export function postgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return undefined;
    const { code, cause } = current as ErrorWithCause;
    if (typeof code === "string") return code;
    current = cause;
  }
  return undefined;
}

/** True when the database is missing the tables/columns this feature needs. */
export function isMissingMigrationError(error: unknown): boolean {
  const code = postgresErrorCode(error);
  return code === "42P01" || code === "42703";
}

/** True for a unique-constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return postgresErrorCode(error) === "23505";
}
