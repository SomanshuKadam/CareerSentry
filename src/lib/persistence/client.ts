import "server-only";

import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { persistenceSchema } from "./schema";

export type PersistenceDatabase = PostgresJsDatabase<typeof persistenceSchema> & {
  $client: Sql;
};

export class DatabaseConfigurationError extends Error {
  constructor(message = "DATABASE_URL is not configured") {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

/** Read only the server environment; this module is marked server-only. */
export function readDatabaseUrl(
  environment: Record<string, string | undefined> = process.env,
): string | null {
  const value = environment.DATABASE_URL?.trim();
  return value ? value : null;
}

/**
 * Construct a lazy PostgreSQL/Drizzle client. `postgres` does not connect
 * until a query is executed, so local imports and unit tests make no network
 * call. Callers own the returned client and may close `$client` in workers.
 */
export function createPersistenceDatabase(databaseUrl?: string): PersistenceDatabase {
  const url = databaseUrl?.trim();
  if (!url) {
    throw new DatabaseConfigurationError();
  }

  const sql = postgres(url, {
    // A short-lived server request should not create an unbounded pool.
    max: 1,
    prepare: false,
  });
  return drizzle(sql, { schema: persistenceSchema });
}
