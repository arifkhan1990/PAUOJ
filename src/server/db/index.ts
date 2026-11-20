import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "../env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
type SqlClient = ReturnType<typeof postgres>;

type DatabaseCache = {
  sql: SqlClient;
  db: Database;
};

const globalForDb = globalThis as typeof globalThis & {
  __pauojDb?: DatabaseCache;
};

function createDatabase(): DatabaseCache {
  const env = getEnv();
  const sql = postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => undefined,
  });
  const db = drizzle(sql, { schema });
  return { sql, db };
}

export function getDb(): Database {
  if (!globalForDb.__pauojDb) {
    globalForDb.__pauojDb = createDatabase();
  }
  return globalForDb.__pauojDb.db;
}

export function getSql(): SqlClient {
  if (!globalForDb.__pauojDb) {
    globalForDb.__pauojDb = createDatabase();
  }
  return globalForDb.__pauojDb.sql;
}

export async function closeDb(): Promise<void> {
  if (globalForDb.__pauojDb) {
    await globalForDb.__pauojDb.sql.end({ timeout: 5 });
    globalForDb.__pauojDb = undefined;
  }
}

export { schema };
