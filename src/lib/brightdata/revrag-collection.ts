import type { HealthEvaluation, HealthEvaluationOptions, JobRecord } from "../domain";
import type { CollectorInput, DatasetRow } from "./client";
import {
  ingestRevRagSnapshot,
  type RevRagSnapshotResult,
} from "./revrag";

/**
 * The protected route intentionally has no caller-selectable target. Keeping
 * these values next to the orchestration code makes the allow-list explicit
 * and gives tests a single source of truth.
 */
export const REVRAG_COLLECTOR_ID = "c_mt3ctgtj2rqnwsqm8p" as const;
export const REVRAG_SOURCE_CATALOG_URL = "https://www.revrag.ai/careers" as const;
export const REVRAG_ALLOWED_ORIGIN = "https://www.revrag.ai" as const;
export const REVRAG_ALLOWED_PATH_PREFIX = "/careers" as const;

// Descriptive aliases for callers that use the company name as a prefix.
export const REV_RAG_COLLECTOR_ID = REVRAG_COLLECTOR_ID;
export const REV_RAG_CAREERS_URL = REVRAG_SOURCE_CATALOG_URL;

export type CollectorRunner = {
  runCollector(
    collectorId: string,
    inputs: readonly CollectorInput[],
  ): Promise<{ snapshotId: string; rows: DatasetRow[] }>;
};

export type RevRagCollectionCounts = {
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
};

/**
 * This is a response-shaped result, not a persistence record. The route
 * returns it only after the complete snapshot has passed ingestion and health
 * validation. A non-healthy run is represented by the error subclass below
 * with an empty `records` array so partial rows cannot be mistaken for a
 * committed snapshot.
 */
export type RevRagCollectionResult = {
  snapshotId: string;
  collectorId: typeof REVRAG_COLLECTOR_ID;
  status: RevRagSnapshotResult["status"];
  healthy: boolean;
  counts: RevRagCollectionCounts;
  health: HealthEvaluation;
  records: JobRecord[];
};

export type RevRagCollectionOptions = {
  now?: () => string;
  baselineRecords?: readonly JobRecord[];
  health?: HealthEvaluationOptions;
};

export class RevRagSnapshotNotHealthyError extends Error {
  constructor(readonly result: RevRagCollectionResult) {
    super("RevRag collector returned a non-healthy snapshot");
    this.name = "RevRagSnapshotNotHealthyError";
  }
}

function snapshotResult(
  snapshotId: string,
  snapshot: RevRagSnapshotResult,
  records: JobRecord[],
): RevRagCollectionResult {
  return {
    snapshotId,
    collectorId: REVRAG_COLLECTOR_ID,
    status: snapshot.status,
    healthy: snapshot.healthy,
    counts: {
      rowCount: snapshot.rowCount,
      validRowCount: snapshot.validRowCount,
      errorRowCount: snapshot.errorRowCount,
    },
    health: snapshot.health,
    records,
  };
}

/**
 * Run the fixed one-input RevRag Discovery collector and normalize its whole
 * dataset through the source-specific provenance boundary. This function is
 * deliberately dependency-injected and has no environment or persistence
 * side effects, so route tests can supply a fake client.
 */
export async function runRevRagCollection(
  client: CollectorRunner,
  options: RevRagCollectionOptions = {},
): Promise<RevRagCollectionResult> {
  const collection = await client.runCollector(REVRAG_COLLECTOR_ID, [
    { url: REVRAG_SOURCE_CATALOG_URL },
  ]);
  const snapshot = ingestRevRagSnapshot(
    collection.rows,
    {
      companyId: "revrag-ai",
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      collectorId: REVRAG_COLLECTOR_ID,
      collectedAt: (options.now ?? (() => new Date().toISOString()))(),
      allowedOrigins: [REVRAG_ALLOWED_ORIGIN],
      allowedPathPrefix: REVRAG_ALLOWED_PATH_PREFIX,
      workplaceType: "unknown",
    },
    {
      baselineRecords: options.baselineRecords,
      health: options.health,
    },
  );

  if (!snapshot.healthy) {
    throw new RevRagSnapshotNotHealthyError(
      snapshotResult(collection.snapshotId, snapshot, []),
    );
  }

  return snapshotResult(collection.snapshotId, snapshot, snapshot.records);
}

// A descriptive alias keeps the orchestration service discoverable to route
// callers without creating a second implementation.
export const collectRevRagSnapshot = runRevRagCollection;
