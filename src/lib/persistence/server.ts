import "server-only";

import { createPersistenceDatabase, readDatabaseUrl } from "./client";
import { createPostgresPersistenceRepository } from "./repository";
import type { PersistenceRepository } from "./contracts";

let cached: { url: string; repository: PersistenceRepository } | undefined;

/**
 * Resolve persistence only on the server. Missing DATABASE_URL returns null
 * so a route can fail closed for writes while read-only pages choose their
 * explicitly labelled saved-evidence fallback.
 */
export function getPersistenceRepository(
  environment: Record<string, string | undefined> = process.env,
): PersistenceRepository | null {
  const url = readDatabaseUrl(environment);
  if (!url) return null;

  if (!cached || cached.url !== url) {
    cached = {
      url,
      repository: createPostgresPersistenceRepository(createPersistenceDatabase(url)),
    };
  }

  return cached.repository;
}
