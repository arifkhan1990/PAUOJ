import { sql } from "drizzle-orm";
import type { Database } from "@/server/db";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Serialises block, follow, open-conversation and send writes for one user
 * pair. A block that commits before the waiting write makes that write see the
 * block; a write that commits first lands before the block. Advisory locks are
 * released automatically at transaction end.
 */
export function lockUserPair(
  tx: Transaction,
  left: string,
  right: string,
): Promise<unknown> {
  const key = [left, right].sort().join(":");
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${key})::bigint)`,
  );
}
