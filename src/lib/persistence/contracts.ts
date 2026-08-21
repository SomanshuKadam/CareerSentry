import type { HealthEvaluation, JobRecord } from "../domain";

export const persistenceRunStatuses = [
  "healthy",
  "degraded",
  "rejected",
  "failed",
] as const;

export type PersistenceRunStatus = (typeof persistenceRunStatuses)[number];

export const persistenceIncidentStatuses = [
  "degraded",
  "rejected",
  "failed",
  "needs_review",
] as const;

export type PersistenceIncidentStatus = (typeof persistenceIncidentStatuses)[number];

export type PersistedCheckStatus = "pass" | "fail" | "not_evaluated";

export type PersistedHealthCheck = {
  status: PersistedCheckStatus;
  value?: number | boolean | string;
  baseline?: number | boolean | string;
  threshold?: number | boolean | string;
  message?: string;
};

/**
 * Deliberately smaller than HealthEvaluation. It excludes duplicate records,
 * raw collector rows, and any other source payload that could contain data we
 * do not need for the read-only dashboard or incident queue.
 */
export type PersistedHealthSummary = {
  status: "healthy" | "degraded";
  reasons: string[];
  metrics: {
    rowCount: number;
    baselineRowCount?: number;
    countRatio?: number;
    countDropRatio?: number;
    validRecordCount: number;
    invalidRecordCount: number;
    duplicateCount: number;
    duplicateRate: number;
    fieldCoverage: Record<string, number>;
  };
  checks: Record<string, PersistedHealthCheck>;
};

export type PersistedSnapshotError = {
  code: string;
  rowIndex?: number;
  message: string;
  errorCode?: string;
};

export type PersistedEvidence = Record<string, unknown>;

export type PersistenceIncidentInput = {
  status?: PersistenceIncidentStatus;
  reasons?: readonly string[];
  evidence?: PersistedEvidence;
  healPrompt?: string;
};

export type PersistenceRunInput = {
  /** Supplying an ID makes retries and tests deterministic. */
  runId?: string;
  incidentId?: string;
  collectorId: string;
  companyId: string;
  sourceCatalogUrl: string;
  snapshotId: string;
  status: PersistenceRunStatus;
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
  /** Records are written only when `status` is `healthy`. */
  records?: readonly JobRecord[];
  health?: HealthEvaluation | PersistedHealthSummary;
  errors?: readonly PersistedSnapshotError[];
  incident?: PersistenceIncidentInput;
  startedAt?: string;
  completedAt?: string;
};

export type HealthySnapshotInput = Omit<PersistenceRunInput, "status"> & {
  status?: "healthy";
  records: readonly JobRecord[];
};

export type UnhealthyRunInput = Omit<PersistenceRunInput, "status"> & {
  /** Kept broad for response-shaped collector results; the repository rejects healthy values at runtime. */
  status: PersistenceRunStatus;
};

export type PersistedRunSummary = {
  runId: string;
  incidentId?: string;
  collectorId: string;
  companyId: string;
  sourceCatalogUrl: string;
  snapshotId: string;
  status: PersistenceRunStatus;
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
  health?: PersistedHealthSummary;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
};

export type PersistedJobSnapshot = {
  run: PersistedRunSummary;
  jobs: JobRecord[];
};

export type PersistenceWriteResult = {
  run: PersistedRunSummary;
  incidentId?: string;
  canonicalJobCount: number;
};

export type PersistenceReadModel = {
  latestRun: PersistedRunSummary | null;
  lastKnownGood: PersistedJobSnapshot | null;
  latestIncident: PersistedIncident | null;
};

export type PersistedIncident = {
  incidentId: string;
  runId: string;
  collectorId: string;
  snapshotId: string;
  status: PersistenceIncidentStatus;
  reasons: string[];
  evidence?: PersistedEvidence;
  healPrompt?: string;
  createdAt: string;
};

export interface PersistenceRepository {
  /**
   * Writes every run. Healthy runs write canonical jobs in the same
   * transaction; non-healthy runs write only the run and incident.
   */
  persistSnapshot(input: PersistenceRunInput): Promise<PersistenceWriteResult>;
  commitHealthySnapshot(input: HealthySnapshotInput): Promise<PersistenceWriteResult>;
  recordUnhealthyRun(input: UnhealthyRunInput): Promise<PersistenceWriteResult>;
  getLastKnownGoodSnapshot(collectorId: string): Promise<PersistedJobSnapshot | null>;
  getLatestState(collectorId: string): Promise<PersistenceReadModel>;
}
