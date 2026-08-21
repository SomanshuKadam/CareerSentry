import savedEvidenceJson from "../../../docs/evidence/revrag-verified.json";

import {
  evaluateHealth,
  normalizeJobRecord,
  type HealthEvaluation,
  type JobRecord,
} from "../domain";
import { jobRecordSchema } from "../domain/schemas";
import {
  REVRAG_ALLOWED_ORIGIN,
  REVRAG_ALLOWED_PATH_PREFIX,
  REVRAG_COLLECTOR_ID,
  REVRAG_SOURCE_CATALOG_URL,
} from "../brightdata/revrag-collection";

const REVRAG_COMPANY_ID = "revrag-ai" as const;
const REVRAG_COMPANY_NAME = "RevRag AI" as const;
const SAVED_EVIDENCE_DATE = "2026-08-22" as const;
const SAVED_EVIDENCE_COLLECTED_AT = `${SAVED_EVIDENCE_DATE}T00:00:00.000Z` as const;
const SAVED_EVIDENCE_LABEL = "Saved verified RevRag evidence (fallback)" as const;

export type DashboardSourceKind = "persisted_last_known_good" | "saved_evidence";

export type DashboardFallbackReason =
  | "persistence_not_configured"
  | "no_last_known_good_snapshot"
  | "persistence_unavailable"
  | "persisted_snapshot_not_usable";

export type DashboardSource = {
  kind: DashboardSourceKind;
  label: string;
  isPersisted: boolean;
  isSavedEvidence: boolean;
  note: string;
  fallbackReason?: DashboardFallbackReason;
};

export type DashboardProvenance = {
  companyId: typeof REVRAG_COMPANY_ID;
  companyName: typeof REVRAG_COMPANY_NAME;
  corporateUrl: "https://www.revrag.ai/";
  careersUrl: typeof REVRAG_SOURCE_CATALOG_URL;
  catalogUrl: typeof REVRAG_SOURCE_CATALOG_URL;
  relationship: "corporate-to-careers";
  allowedOrigins: readonly [typeof REVRAG_ALLOWED_ORIGIN];
  allowedPathPrefixes: readonly [typeof REVRAG_ALLOWED_PATH_PREFIX];
  detailUrlPattern: "https://www.revrag.ai/careers/<role-slug>";
};

export type DashboardHealth = Pick<
  HealthEvaluation,
  "status" | "healthy" | "degraded" | "reasons" | "checks" | "metrics"
> & {
  basis: "persisted_last_known_good" | "saved_evidence";
};

export type DashboardRunMetadata = {
  snapshotId?: string;
  runId?: string;
  status: "succeeded" | "saved_evidence";
  collectorId: typeof REVRAG_COLLECTOR_ID;
  collectedAt: string;
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
  isPersisted: boolean;
  isLastKnownGood: boolean;
  timestampPrecision: "instant" | "day";
  note?: string;
};

export type DashboardCollectorMetadata = {
  collectorId: typeof REVRAG_COLLECTOR_ID;
  collectorType: "discovery";
  sourceCatalogUrl: typeof REVRAG_SOURCE_CATALOG_URL;
  status: "healthy" | "unavailable";
  hasPersistedLastKnownGood: boolean;
};

/**
 * The dashboard contract deliberately uses canonical JobRecord values. Raw
 * Scraper Studio rows, platform metadata, and application URLs never cross
 * this boundary.
 */
export type DashboardReadModel = {
  source: DashboardSource;
  provenance: DashboardProvenance;
  collector: DashboardCollectorMetadata;
  run: DashboardRunMetadata;
  health: DashboardHealth;
  records: readonly JobRecord[];
};

/**
 * Shape expected from a future persistence implementation. The reader is
 * injected so this module remains database- and network-free.
 */
export type PersistedRevRagSnapshot = {
  snapshotId: string;
  runId?: string;
  collectorId: string;
  sourceCatalogUrl: string;
  collectedAt: string;
  startedAt?: string;
  completedAt?: string;
  rowCount?: number;
  validRowCount?: number;
  errorRowCount?: number;
  health: HealthEvaluation;
  records: readonly JobRecord[];
};

export type PersistedRevRagSnapshotReader =
  | {
      getLastKnownGoodSnapshot(): Promise<PersistedRevRagSnapshot | null>;
    }
  | {
      getLastKnownGoodRevRagSnapshot(): Promise<PersistedRevRagSnapshot | null>;
    };

export type SavedRevRagEvidence = {
  evidenceDate: string;
  records: readonly JobRecord[];
};

export type DashboardReadModelOptions = {
  /** Either name is accepted while the persistence layer is being designed. */
  snapshotStore?: PersistedRevRagSnapshotReader;
  persistedSnapshotStore?: PersistedRevRagSnapshotReader;
  savedEvidence?: SavedRevRagEvidence;
};

type SavedEvidenceRole = {
  jobId: string;
  company_job_url: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_text: string;
};

type SavedEvidenceDocument = {
  evidence_type: string;
  snapshot_label: string;
  collector_id: string;
  source_catalog_url: string;
  roles: SavedEvidenceRole[];
};

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Saved RevRag evidence is missing ${label}`);
  }
  return value.trim();
}

function isRevRagDetailUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.origin === REVRAG_ALLOWED_ORIGIN &&
      url.pathname.startsWith(`${REVRAG_ALLOWED_PATH_PREFIX}/`) &&
      url.pathname.slice(`${REVRAG_ALLOWED_PATH_PREFIX}/`.length).split("/")[0] !== ""
    );
  } catch {
    return false;
  }
}

function sanitizeRecords(records: readonly JobRecord[]): JobRecord[] {
  if (records.length === 0) {
    throw new Error("RevRag dashboard snapshot contains no canonical records");
  }

  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  return records.map((candidate, index) => {
    const parsed = jobRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error(`RevRag dashboard row ${index} is not canonical`);
    }

    const record = normalizeJobRecord(parsed.data);
    if (
      record.companyId !== REVRAG_COMPANY_ID ||
      record.collectorId !== REVRAG_COLLECTOR_ID ||
      record.sourceCatalogUrl !== REVRAG_SOURCE_CATALOG_URL ||
      !isRevRagDetailUrl(record.companyJobUrl)
    ) {
      throw new Error(`RevRag dashboard row ${index} failed provenance validation`);
    }

    if (seenIds.has(record.jobId) || seenUrls.has(record.companyJobUrl)) {
      throw new Error(`RevRag dashboard row ${index} duplicated a canonical job`);
    }
    seenIds.add(record.jobId);
    seenUrls.add(record.companyJobUrl);

    // JobRecord permits applyUrl for other sources, but the RevRag dashboard
    // contract excludes all application URLs. Unknown/raw fields were already
    // rejected by the strict schema above.
    const safeRecord: JobRecord = { ...record };
    delete safeRecord.applyUrl;
    return safeRecord;
  });
}

function dashboardHealth(
  health: HealthEvaluation,
  basis: DashboardHealth["basis"],
): DashboardHealth {
  return {
    status: health.status,
    healthy: health.healthy,
    degraded: health.degraded,
    reasons: [...health.reasons],
    checks: { ...health.checks },
    metrics: {
      ...health.metrics,
      fieldCoverage: { ...health.metrics.fieldCoverage },
    },
    basis,
  };
}

const provenance: DashboardProvenance = {
  companyId: REVRAG_COMPANY_ID,
  companyName: REVRAG_COMPANY_NAME,
  corporateUrl: "https://www.revrag.ai/",
  careersUrl: REVRAG_SOURCE_CATALOG_URL,
  catalogUrl: REVRAG_SOURCE_CATALOG_URL,
  relationship: "corporate-to-careers",
  allowedOrigins: [REVRAG_ALLOWED_ORIGIN],
  allowedPathPrefixes: [REVRAG_ALLOWED_PATH_PREFIX],
  detailUrlPattern: "https://www.revrag.ai/careers/<role-slug>",
};

function dashboardModel(
  source: DashboardSource,
  run: DashboardRunMetadata,
  health: DashboardHealth,
  records: readonly JobRecord[],
): DashboardReadModel {
  return {
    source,
    provenance,
    collector: {
      collectorId: REVRAG_COLLECTOR_ID,
      collectorType: "discovery",
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      status: health.healthy ? "healthy" : "unavailable",
      hasPersistedLastKnownGood: source.kind === "persisted_last_known_good",
    },
    run,
    health,
    records,
  };
}

function countOrDefault(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value !== undefined && value >= 0
    ? value
    : fallback;
}

function persistedModel(snapshot: PersistedRevRagSnapshot): DashboardReadModel {
  if (
    snapshot.collectorId !== REVRAG_COLLECTOR_ID ||
    snapshot.sourceCatalogUrl !== REVRAG_SOURCE_CATALOG_URL ||
    !snapshot.health.healthy ||
    snapshot.health.status !== "healthy"
  ) {
    throw new Error("Persisted RevRag snapshot is not a healthy last-known-good result");
  }

  const records = sanitizeRecords(snapshot.records);
  const counts = {
    rowCount: countOrDefault(snapshot.rowCount, records.length),
    validRowCount: countOrDefault(snapshot.validRowCount, records.length),
    errorRowCount: countOrDefault(snapshot.errorRowCount, 0),
  };
  if (
    counts.rowCount !== records.length ||
    counts.validRowCount !== records.length ||
    counts.errorRowCount !== 0
  ) {
    throw new Error("Persisted RevRag snapshot counts do not describe a complete healthy run");
  }

  return dashboardModel(
    {
      kind: "persisted_last_known_good",
      label: "Persisted last-known-good RevRag snapshot",
      isPersisted: true,
      isSavedEvidence: false,
      note: "Canonical records loaded from the injected persisted snapshot.",
    },
    {
      snapshotId: snapshot.snapshotId,
      runId: snapshot.runId,
      status: "succeeded",
      collectorId: REVRAG_COLLECTOR_ID,
      collectedAt: snapshot.collectedAt,
      rowCount: counts.rowCount,
      validRowCount: counts.validRowCount,
      errorRowCount: counts.errorRowCount,
      isPersisted: true,
      isLastKnownGood: true,
      timestampPrecision: "instant",
    },
    dashboardHealth(snapshot.health, "persisted_last_known_good"),
    records,
  );
}

function savedEvidenceModel(
  evidence: SavedRevRagEvidence,
  fallbackReason: DashboardFallbackReason,
): DashboardReadModel {
  const records = sanitizeRecords(evidence.records);
  const health = evaluateHealth(records);

  return dashboardModel(
    {
      kind: "saved_evidence",
      label: SAVED_EVIDENCE_LABEL,
      isPersisted: false,
      isSavedEvidence: true,
      note: "Saved verified evidence only; this is not a live refresh or durable snapshot.",
      fallbackReason,
    },
    {
      status: "saved_evidence",
      collectorId: REVRAG_COLLECTOR_ID,
      collectedAt: `${evidence.evidenceDate}T00:00:00.000Z`,
      rowCount: records.length,
      validRowCount: records.length,
      errorRowCount: 0,
      isPersisted: false,
      isLastKnownGood: false,
      timestampPrecision: "day",
      note: "The evidence records a verified date, not a live collection instant.",
    },
    dashboardHealth(health, "saved_evidence"),
    records,
  );
}

function buildDefaultSavedEvidence(): SavedRevRagEvidence {
  const document = savedEvidenceJson as unknown as SavedEvidenceDocument;
  if (
    document.evidence_type !== "saved_verified_public_career_recovery" ||
    document.collector_id !== REVRAG_COLLECTOR_ID ||
    document.source_catalog_url !== REVRAG_SOURCE_CATALOG_URL
  ) {
    throw new Error("Saved RevRag evidence does not match the approved source");
  }

  const records = document.roles.map((role) => {
    const record = jobRecordSchema.parse({
      companyId: REVRAG_COMPANY_ID,
      jobId: requiredText(role.jobId, "jobId"),
      title: requiredText(role.title, "title"),
      location: requiredText(role.location, "location"),
      workplaceType: "onsite",
      department: requiredText(role.department, "department"),
      employmentType: requiredText(role.employment_type, "employment_type"),
      experienceText: requiredText(role.experience_text, "experience_text"),
      companyJobUrl: requiredText(role.company_job_url, "company_job_url"),
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      collectorId: REVRAG_COLLECTOR_ID,
      collectedAt: SAVED_EVIDENCE_COLLECTED_AT,
    });
    return record;
  });

  return {
    evidenceDate: SAVED_EVIDENCE_DATE,
    records: sanitizeRecords(records),
  };
}

export const defaultSavedRevRagEvidence = buildDefaultSavedEvidence();

async function readPersistedSnapshot(
  store: PersistedRevRagSnapshotReader,
): Promise<PersistedRevRagSnapshot | null> {
  if ("getLastKnownGoodSnapshot" in store) {
    return store.getLastKnownGoodSnapshot();
  }
  return store.getLastKnownGoodRevRagSnapshot();
}

/**
 * Read-only server model for the dashboard. A persistence implementation can
 * be injected later; this function itself performs no database or network I/O.
 * Any missing, unavailable, invalid, or non-healthy persisted result falls
 * back to explicitly labeled saved evidence rather than claiming freshness.
 */
export async function getDashboardReadModel(
  options: DashboardReadModelOptions = {},
): Promise<DashboardReadModel> {
  const store = options.snapshotStore ?? options.persistedSnapshotStore;
  const evidence = options.savedEvidence ?? defaultSavedRevRagEvidence;

  if (!store) {
    return savedEvidenceModel(evidence, "persistence_not_configured");
  }

  let persisted: PersistedRevRagSnapshot | null;
  try {
    persisted = await readPersistedSnapshot(store);
  } catch {
    return savedEvidenceModel(evidence, "persistence_unavailable");
  }

  if (persisted === null) {
    return savedEvidenceModel(evidence, "no_last_known_good_snapshot");
  }

  try {
    return persistedModel(persisted);
  } catch {
    return savedEvidenceModel(evidence, "persisted_snapshot_not_usable");
  }
}

export const readDashboardModel = getDashboardReadModel;
export const buildDashboardReadModel = getDashboardReadModel;
