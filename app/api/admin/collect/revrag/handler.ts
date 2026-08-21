import { timingSafeEqual } from "node:crypto";

import {
  BrightDataClient,
  RevRagSnapshotNotHealthyError,
  runRevRagCollection,
  type CollectorRunner,
  type RevRagCollectionResult,
} from "../../../../../src/lib/brightdata";
import type { PersistenceRepository } from "../../../../../src/lib/persistence/contracts";

export type RevRagRouteDependencies = {
  environment?: Record<string, string | undefined>;
  createClient?: (apiToken: string) => CollectorRunner;
  persistence?: PersistenceRepository | null;
  now?: () => string;
};

function sameSecret(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  const length = Math.max(expectedBytes.length, providedBytes.length);
  const expectedPadded = Buffer.alloc(length);
  const providedPadded = Buffer.alloc(length);
  expectedBytes.copy(expectedPadded);
  providedBytes.copy(providedPadded);
  return timingSafeEqual(expectedPadded, providedPadded) && expectedBytes.length === providedBytes.length;
}

export function jsonResponse(body: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function publicResult(result: RevRagCollectionResult, persisted: boolean): Record<string, unknown> {
  return {
    snapshotId: result.snapshotId,
    collectorId: result.collectorId,
    status: result.status,
    healthy: result.healthy,
    counts: result.counts,
    health: result.health,
    records: result.records,
    persisted,
  };
}

export function createRevRagRouteHandler(
  dependencies: RevRagRouteDependencies = {},
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const environment = dependencies.environment ?? process.env;
    const configuredRunKey = environment.CAREERSENTRY_RUN_KEY?.trim() ?? "";
    const suppliedRunKey = request.headers.get("x-careersentry-run-key") ?? "";

    if (!configuredRunKey || !sameSecret(configuredRunKey, suppliedRunKey)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const apiToken = environment.BRIGHT_DATA_API_TOKEN?.trim() ?? "";
    if (!apiToken) {
      return jsonResponse({ error: "Collection service is not configured" }, 503);
    }

    const persistence = dependencies.persistence;
    if (!persistence) {
      return jsonResponse({ error: "Durable storage is not configured" }, 503);
    }

    let client: CollectorRunner;
    try {
      client = dependencies.createClient
        ? dependencies.createClient(apiToken)
        : new BrightDataClient({ apiToken });
    } catch {
      return jsonResponse({ error: "Collection service is not configured" }, 503);
    }

    try {
      // The body is intentionally ignored: callers cannot replace the fixed
      // collector ID or redirect collection to another URL.
      const startedAt = (dependencies.now ?? (() => new Date().toISOString()))();
      const result = await runRevRagCollection(client, { now: () => startedAt });
      const completedAt = (dependencies.now ?? (() => new Date().toISOString()))();
      await persistence.commitHealthySnapshot({
        collectorId: result.collectorId,
        companyId: "revrag-ai",
        sourceCatalogUrl: "https://www.revrag.ai/careers",
        snapshotId: result.snapshotId,
        rowCount: result.counts.rowCount,
        validRowCount: result.counts.validRowCount,
        errorRowCount: result.counts.errorRowCount,
        records: result.records,
        health: result.health,
        startedAt,
        completedAt,
      });
      return jsonResponse(publicResult(result, true), 200);
    } catch (error) {
      if (error instanceof RevRagSnapshotNotHealthyError) {
        try {
          const completedAt = (dependencies.now ?? (() => new Date().toISOString()))();
          await persistence.recordUnhealthyRun({
            collectorId: error.result.collectorId,
            companyId: "revrag-ai",
            sourceCatalogUrl: "https://www.revrag.ai/careers",
            snapshotId: error.result.snapshotId,
            status: error.result.status,
            rowCount: error.result.counts.rowCount,
            validRowCount: error.result.counts.validRowCount,
            errorRowCount: error.result.counts.errorRowCount,
            health: error.result.health,
            completedAt,
            incident: {
              status: error.result.status === "rejected" ? "rejected" : "degraded",
              reasons: error.result.health.reasons,
              evidence: {
                rowCount: error.result.counts.rowCount,
                validRowCount: error.result.counts.validRowCount,
                errorRowCount: error.result.counts.errorRowCount,
              },
            },
          });
          return jsonResponse(publicResult(error.result, true), 502);
        } catch {
          return jsonResponse({ error: "Collector result could not be stored" }, 503);
        }
      }
      return jsonResponse({ error: "Collector service unavailable" }, 503);
    }
  };
}
