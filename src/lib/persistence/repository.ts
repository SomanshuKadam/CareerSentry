import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  jobRecordSchema,
  type HealthEvaluation,
  type JobRecord,
} from "../domain";
import type {
  CanonicalJobRow,
  CollectorRunRow,
  HealthIncidentRow,
} from "./schema";
import { canonicalJobs, collectorRuns, healthIncidents, persistenceSchema } from "./schema";
import type {
  HealthySnapshotInput,
  PersistedEvidence,
  PersistedHealthCheck,
  PersistedHealthSummary,
  PersistedIncident,
  PersistedJobSnapshot,
  PersistedRunSummary,
  PersistenceReadModel,
  PersistenceRepository,
  PersistenceRunInput,
  PersistenceRunStatus,
  PersistenceWriteResult,
  UnhealthyRunInput,
  PersistedSnapshotError,
  PersistenceIncidentStatus,
} from "./contracts";

export type PersistenceDatabase = PostgresJsDatabase<typeof persistenceSchema>;

export type PersistenceRepositoryOptions = {
  now?: () => string;
  createRunId?: () => string;
  createIncidentId?: () => string;
};

const MAX_TEXT_LENGTH = 500;
const MAX_REASONS = 32;
const MAX_ERRORS = 100;

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new PersistenceInputError(`${field} must not be empty`);
  return normalized;
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new PersistenceInputError(`${field} must be a non-negative integer`);
  }
  return value;
}

function isoInstant(value: string | undefined, fallback: string, field: string): string {
  const candidate = (value ?? fallback).trim();
  if (!candidate || Number.isNaN(Date.parse(candidate))) {
    throw new PersistenceInputError(`${field} must be an ISO-compatible timestamp`);
  }
  return new Date(candidate).toISOString();
}

/** Remove control characters and redact common credential-shaped values. */
export function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  const text = String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(
      /((?:api[_-]?key|access[_-]?key|token|secret|password|authorization|bearer)\s*[:=]\s*)([^\s,;]+)/gi,
      "$1[redacted]",
    )
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function sanitizeJson(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === undefined) return undefined;
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const text = sanitizeText(value);
    // Query strings and fragments are not needed in incident evidence and may
    // carry credentials supplied by an upstream service.
    if (/^https?:\/\//i.test(text)) {
      try {
        const url = new URL(text);
        return `${url.origin}${url.pathname}`;
      } catch {
        return text;
      }
    }
    return text;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 32).map((entry) => sanitizeJson(entry, depth + 1));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value).slice(0, 32)) {
      const safe = sanitizeJson(entry, depth + 1);
      if (safe !== undefined) result[sanitizeText(key, 80)] = safe;
    }
    return result;
  }
  return undefined;
}

export function sanitizeEvidence(value: PersistedEvidence | undefined): PersistedEvidence | undefined {
  const safe = sanitizeJson(value);
  return safe && typeof safe === "object" && !Array.isArray(safe)
    ? (safe as PersistedEvidence)
    : undefined;
}

function persistedCheck(value: unknown): PersistedHealthCheck {
  const object = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const status = object.status === "pass" || object.status === "fail" || object.status === "not_evaluated"
    ? object.status
    : "not_evaluated";
  const result: PersistedHealthCheck = { status };
  for (const key of ["value", "baseline", "threshold"] as const) {
    const candidate = object[key];
    if (typeof candidate === "string" || typeof candidate === "boolean" || typeof candidate === "number") {
      result[key] = typeof candidate === "string" ? sanitizeText(candidate) : candidate;
    }
  }
  if (typeof object.message === "string") result.message = sanitizeText(object.message);
  return result;
}

function healthSummary(health: HealthEvaluation | PersistedHealthSummary | undefined): PersistedHealthSummary | undefined {
  if (!health || typeof health !== "object") return undefined;
  const source = health as unknown as Record<string, unknown>;
  const metricsSource = source.metrics && typeof source.metrics === "object"
    ? source.metrics as Record<string, unknown>
    : {};
  const checksSource = source.checks && typeof source.checks === "object"
    ? source.checks as Record<string, unknown>
    : {};
  const fieldCoverageSource = metricsSource.fieldCoverage && typeof metricsSource.fieldCoverage === "object"
    ? metricsSource.fieldCoverage as Record<string, unknown>
    : {};

  const fieldCoverage: Record<string, number> = {};
  for (const [key, value] of Object.entries(fieldCoverageSource).slice(0, 32)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      fieldCoverage[sanitizeText(key, 80)] = value;
    }
  }

  const checks: Record<string, PersistedHealthCheck> = {};
  for (const [key, value] of Object.entries(checksSource).slice(0, 32)) {
    checks[sanitizeText(key, 80)] = persistedCheck(value);
  }

  const rawReasons = Array.isArray(source.reasons) ? source.reasons : [];
  return {
    status: source.status === "healthy" ? "healthy" : "degraded",
    reasons: rawReasons.slice(0, MAX_REASONS).map((reason) => sanitizeText(reason)),
    metrics: {
      rowCount: finiteNumber(metricsSource.rowCount),
      baselineRowCount: typeof metricsSource.baselineRowCount === "number" ? metricsSource.baselineRowCount : undefined,
      countRatio: typeof metricsSource.countRatio === "number" ? metricsSource.countRatio : undefined,
      countDropRatio: typeof metricsSource.countDropRatio === "number" ? metricsSource.countDropRatio : undefined,
      validRecordCount: finiteNumber(metricsSource.validRecordCount),
      invalidRecordCount: finiteNumber(metricsSource.invalidRecordCount),
      duplicateCount: finiteNumber(metricsSource.duplicateCount),
      duplicateRate: finiteNumber(metricsSource.duplicateRate),
      fieldCoverage,
    },
    checks,
  };
}

function snapshotErrors(errors: readonly PersistedSnapshotError[] | undefined): PersistedSnapshotError[] {
  return (errors ?? []).slice(0, MAX_ERRORS).map((error) => ({
    code: sanitizeText(error.code, 100),
    rowIndex: typeof error.rowIndex === "number" && Number.isInteger(error.rowIndex) && error.rowIndex >= 0
      ? error.rowIndex
      : undefined,
    message: sanitizeText(error.message),
    errorCode: error.errorCode ? sanitizeText(error.errorCode, 100) : undefined,
  }));
}

function safeStatus(value: PersistenceRunStatus): PersistenceRunStatus {
  if (value === "healthy" || value === "degraded" || value === "rejected" || value === "failed") {
    return value;
  }
  throw new PersistenceInputError(`Unsupported persistence run status: ${String(value)}`);
}

function mapJobToInsert(job: JobRecord, runId: string) {
  const parsed = jobRecordSchema.parse(job);
  return {
    runId,
    companyId: parsed.companyId,
    jobId: parsed.jobId,
    title: parsed.title,
    location: parsed.location,
    workplaceType: parsed.workplaceType,
    department: parsed.department ?? null,
    employmentType: parsed.employmentType ?? null,
    publishedAt: parsed.publishedAt ?? null,
    experienceText: parsed.experienceText ?? null,
    description: parsed.description ?? null,
    companyJobUrl: parsed.companyJobUrl,
    applyUrl: parsed.applyUrl ?? null,
    sourceCatalogUrl: parsed.sourceCatalogUrl,
    collectorId: parsed.collectorId,
    collectedAt: parsed.collectedAt,
    sourceLocation: parsed.sourceLocation ?? null,
  };
}

function validateInput(input: PersistenceRunInput, now: string): {
  runId: string;
  incidentId: string;
  status: PersistenceRunStatus;
  companyId: string;
  collectorId: string;
  sourceCatalogUrl: string;
  snapshotId: string;
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
  records: JobRecord[];
  health?: PersistedHealthSummary;
  errors: PersistedSnapshotError[];
  startedAt: string;
  completedAt: string;
  createdAt: string;
  incident?: {
    status: PersistenceIncidentStatus;
    reasons: string[];
    evidence?: PersistedEvidence;
    healPrompt?: string;
  };
} {
  const status = safeStatus(input.status);
  const companyId = nonEmpty(input.companyId, "companyId");
  const collectorId = nonEmpty(input.collectorId, "collectorId");
  const sourceCatalogUrl = nonEmpty(input.sourceCatalogUrl, "sourceCatalogUrl");
  const snapshotId = nonEmpty(input.snapshotId, "snapshotId");
  const runId = nonEmpty(input.runId ?? `run_${randomUUID()}`, "runId");
  const incidentId = nonEmpty(input.incidentId ?? `incident_${randomUUID()}`, "incidentId");
  const rowCount = nonNegativeInteger(input.rowCount, "rowCount");
  const validRowCount = nonNegativeInteger(input.validRowCount, "validRowCount");
  const errorRowCount = nonNegativeInteger(input.errorRowCount, "errorRowCount");
  const health = healthSummary(input.health);
  const errors = snapshotErrors(input.errors);
  const startedAt = isoInstant(input.startedAt, now, "startedAt");
  const completedAt = isoInstant(input.completedAt, now, "completedAt");
  const records = status === "healthy" ? [...(input.records ?? [])] : [];

  for (const record of records) {
    const parsed = jobRecordSchema.parse(record);
    if (parsed.companyId !== companyId || parsed.collectorId !== collectorId || parsed.sourceCatalogUrl !== sourceCatalogUrl) {
      throw new PersistenceInputError("Healthy job does not belong to the persisted collector/source");
    }
  }

  if (status === "healthy" && input.records === undefined) {
    throw new PersistenceInputError("Healthy snapshots must include canonical records");
  }

  const incidentInput = input.incident;
  const incident = status === "healthy" && !incidentInput
    ? undefined
    : {
        status: incidentInput?.status ?? (status === "healthy" ? "needs_review" : status),
        reasons: (incidentInput?.reasons ?? health?.reasons ?? [`Collector run ${status}`])
          .slice(0, MAX_REASONS)
          .map((reason) => sanitizeText(reason)),
        evidence: sanitizeEvidence(incidentInput?.evidence),
        healPrompt: incidentInput?.healPrompt ? sanitizeText(incidentInput.healPrompt, 1000) : undefined,
      };

  return {
    runId,
    incidentId,
    status,
    companyId,
    collectorId,
    sourceCatalogUrl,
    snapshotId,
    rowCount,
    validRowCount,
    errorRowCount,
    records,
    health,
    errors,
    startedAt,
    completedAt,
    createdAt: now,
    incident,
  };
}

function runSummary(row: CollectorRunRow, incidentId?: string): PersistedRunSummary {
  return {
    runId: row.runId,
    incidentId,
    collectorId: row.collectorId,
    companyId: row.companyId,
    sourceCatalogUrl: row.sourceCatalogUrl,
    snapshotId: row.snapshotId,
    status: row.status,
    rowCount: row.rowCount,
    validRowCount: row.validRowCount,
    errorRowCount: row.errorRowCount,
    health: row.healthSummary ?? undefined,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
  };
}

function jobRecord(row: CanonicalJobRow): JobRecord {
  return jobRecordSchema.parse({
    companyId: row.companyId,
    jobId: row.jobId,
    title: row.title,
    location: row.location,
    workplaceType: row.workplaceType,
    department: row.department ?? undefined,
    employmentType: row.employmentType ?? undefined,
    publishedAt: row.publishedAt ?? undefined,
    experienceText: row.experienceText ?? undefined,
    description: row.description ?? undefined,
    companyJobUrl: row.companyJobUrl,
    applyUrl: row.applyUrl ?? undefined,
    sourceCatalogUrl: row.sourceCatalogUrl,
    collectorId: row.collectorId,
    collectedAt: row.collectedAt,
    sourceLocation: row.sourceLocation ?? undefined,
  });
}

function incidentRecord(row: HealthIncidentRow): PersistedIncident {
  return {
    incidentId: row.incidentId,
    runId: row.runId,
    collectorId: row.collectorId,
    snapshotId: row.snapshotId,
    status: row.status,
    reasons: [...row.reasons],
    evidence: row.evidence ?? undefined,
    healPrompt: row.healPrompt ?? undefined,
    createdAt: row.createdAt,
  };
}

export class PersistenceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceInputError";
  }
}

export function createPostgresPersistenceRepository(
  db: PersistenceDatabase,
  options: PersistenceRepositoryOptions = {},
): PersistenceRepository {
  const now = options.now ?? (() => new Date().toISOString());
  const createRunId = options.createRunId ?? (() => `run_${randomUUID()}`);
  const createIncidentId = options.createIncidentId ?? (() => `incident_${randomUUID()}`);

  async function persistSnapshot(input: PersistenceRunInput): Promise<PersistenceWriteResult> {
    const createdAt = isoInstant(undefined, now(), "createdAt");
    const prepared = validateInput(
      {
        ...input,
        runId: input.runId ?? createRunId(),
        incidentId: input.incidentId ?? createIncidentId(),
      },
      createdAt,
    );

    return db.transaction(async (tx) => {
      const [run] = await tx
        .insert(collectorRuns)
        .values({
          runId: prepared.runId,
          collectorId: prepared.collectorId,
          companyId: prepared.companyId,
          sourceCatalogUrl: prepared.sourceCatalogUrl,
          snapshotId: prepared.snapshotId,
          status: prepared.status,
          rowCount: prepared.rowCount,
          validRowCount: prepared.validRowCount,
          errorRowCount: prepared.errorRowCount,
          healthSummary: prepared.health ?? null,
          errors: prepared.errors.length > 0 ? prepared.errors : null,
          startedAt: prepared.startedAt,
          completedAt: prepared.completedAt,
          createdAt: prepared.createdAt,
        })
        .returning();

      if (!run) throw new Error("Persistence transaction did not return its collector run");

      let incidentId: string | undefined;
      if (prepared.status === "healthy") {
        if (prepared.records.length > 0) {
          await tx.insert(canonicalJobs).values(
            prepared.records.map((record) => mapJobToInsert(record, prepared.runId)),
          );
        }
      } else if (prepared.incident) {
        incidentId = prepared.incidentId;
        await tx.insert(healthIncidents).values({
          incidentId,
          runId: prepared.runId,
          collectorId: prepared.collectorId,
          snapshotId: prepared.snapshotId,
          status: prepared.incident.status,
          reasons: prepared.incident.reasons,
          evidence: prepared.incident.evidence ?? null,
          healPrompt: prepared.incident.healPrompt ?? null,
          createdAt: prepared.createdAt,
        });
      }

      return {
        run: runSummary(run, incidentId),
        incidentId,
        canonicalJobCount: prepared.records.length,
      };
    });
  }

  async function commitHealthySnapshot(input: HealthySnapshotInput): Promise<PersistenceWriteResult> {
    return persistSnapshot({ ...input, status: "healthy" });
  }

  async function recordUnhealthyRun(input: UnhealthyRunInput): Promise<PersistenceWriteResult> {
    if (input.status === "healthy") {
      throw new PersistenceInputError("recordUnhealthyRun cannot persist a healthy status");
    }
    return persistSnapshot(input);
  }

  async function getLastKnownGoodSnapshot(collectorId: string): Promise<PersistedJobSnapshot | null> {
    const [run] = await db
      .select()
      .from(collectorRuns)
      .where(and(eq(collectorRuns.collectorId, nonEmpty(collectorId, "collectorId")), eq(collectorRuns.status, "healthy")))
      .orderBy(desc(collectorRuns.createdAt))
      .limit(1);
    if (!run) return null;

    const jobs = await db
      .select()
      .from(canonicalJobs)
      .where(eq(canonicalJobs.runId, run.runId))
      .orderBy(canonicalJobs.jobId)
      .limit(10_000);
    return { run: runSummary(run), jobs: jobs.map(jobRecord) };
  }

  async function getLatestState(collectorId: string): Promise<PersistenceReadModel> {
    const normalizedCollectorId = nonEmpty(collectorId, "collectorId");
    const [latestRun] = await db
      .select()
      .from(collectorRuns)
      .where(eq(collectorRuns.collectorId, normalizedCollectorId))
      .orderBy(desc(collectorRuns.createdAt))
      .limit(1);
    const [latestIncident] = await db
      .select()
      .from(healthIncidents)
      .where(eq(healthIncidents.collectorId, normalizedCollectorId))
      .orderBy(desc(healthIncidents.createdAt))
      .limit(1);

    return {
      latestRun: latestRun ? runSummary(latestRun, latestIncident?.runId === latestRun.runId ? latestIncident.incidentId : undefined) : null,
      lastKnownGood: await getLastKnownGoodSnapshot(normalizedCollectorId),
      latestIncident: latestIncident ? incidentRecord(latestIncident) : null,
    };
  }

  return {
    persistSnapshot,
    commitHealthySnapshot,
    recordUnhealthyRun,
    getLastKnownGoodSnapshot,
    getLatestState,
  };
}
