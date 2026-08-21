import { timingSafeEqual } from "node:crypto";

import {
  BrightDataClient,
  RevRagSnapshotNotHealthyError,
  runRevRagCollection,
  type CollectorRunner,
  type RevRagCollectionResult,
} from "../../../../../src/lib/brightdata";

export type RevRagRouteDependencies = {
  environment?: Record<string, string | undefined>;
  createClient?: (apiToken: string) => CollectorRunner;
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

function publicResult(result: RevRagCollectionResult): Record<string, unknown> {
  return {
    snapshotId: result.snapshotId,
    collectorId: result.collectorId,
    status: result.status,
    healthy: result.healthy,
    counts: result.counts,
    health: result.health,
    records: result.records,
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
      return jsonResponse(publicResult(await runRevRagCollection(client)), 200);
    } catch (error) {
      if (error instanceof RevRagSnapshotNotHealthyError) {
        return jsonResponse(publicResult(error.result), 502);
      }
      return jsonResponse({ error: "Collector service unavailable" }, 503);
    }
  };
}
