import { deduplicateJobRecords } from "./deduplication";
import { jobRecordSchema, type JobRecord } from "./schemas";

export type HealthCheckStatus = "pass" | "fail" | "not_evaluated";

export type HealthCheck = {
  status: HealthCheckStatus;
  value?: number | boolean | string;
  baseline?: number | boolean | string;
  threshold?: number | boolean | string;
  message?: string;
};

export type DetailHealthEvidence = {
  url?: string;
  resolved?: boolean;
  hasActiveContent?: boolean;
  /** Short aliases accepted from detail collectors. */
  activeContent?: boolean;
  applicationActionPresent?: boolean;
  applicationAction?: boolean;
};

export type HealthEvaluationOptions = {
  /** Minimum share of rows containing each required field. */
  minimumFieldCoverage?: number;
  /** Maximum allowed duplicate share in the current snapshot. */
  maximumDuplicateRate?: number;
  /** Minimum current/baseline row-count ratio. */
  minimumCountRatio?: number;
  /** Explicit baseline count when the baseline records are not available. */
  baselineCount?: number;
  /** Explicit baseline duplicate rate for spike detection. */
  baselineDuplicateRate?: number;
  /** A rise larger than this value is a duplicate-rate spike. */
  duplicateRateSpikeDelta?: number;
  paginationComplete?: boolean;
  requirePaginationEvidence?: boolean;
  details?: readonly DetailHealthEvidence[];
  detailsResolve?: boolean;
  activeDetailContent?: boolean;
  applicationActionsPresent?: boolean;
  requireApplicationActions?: boolean;
  schemaVersion?: string;
  expectedSchemaVersion?: string;
  requireSchemaVersion?: boolean;
};

export type HealthEvaluationInput = {
  /** Current run rows. `currentRecords` is accepted as a descriptive alias. */
  records?: readonly unknown[];
  currentRecords?: readonly unknown[];
  current?: readonly unknown[];
  baselineRecords?: readonly unknown[];
  previousRecords?: readonly unknown[];
  baseline?: readonly unknown[];
  options?: HealthEvaluationOptions;
} & Partial<HealthEvaluationOptions>;

export type HealthEvaluation = {
  status: "healthy" | "degraded";
  healthy: boolean;
  degraded: boolean;
  reasons: string[];
  checks: {
    rowCount: HealthCheck;
    requiredFieldCoverage: HealthCheck;
    /** Alias retained for adapters that call this check `fieldCoverage`. */
    fieldCoverage: HealthCheck;
    duplicateRate: HealthCheck;
    /** Alias retained for adapters that call this check `duplicates`. */
    duplicates: HealthCheck;
    enumeration: HealthCheck;
    details: HealthCheck;
    schema: HealthCheck;
    applicationActions: HealthCheck;
    schemaVersion: HealthCheck;
  };
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
  duplicateRecords: ReturnType<typeof deduplicateJobRecords>["duplicates"];
};

const REQUIRED_FIELDS = [
  "jobId",
  "title",
  "location",
  "companyJobUrl",
] as const;

const DEFAULTS = {
  minimumFieldCoverage: 0.9,
  maximumDuplicateRate: 0.02,
  minimumCountRatio: 0.8,
  duplicateRateSpikeDelta: 0.1,
};

function hasValue(value: unknown, field: string): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = (value as Record<string, unknown>)[field];
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return false;
  }

  if (field === "companyJobUrl") {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return true;
}

function checkRequiredFieldCoverage(
  records: readonly unknown[],
  threshold: number,
): { check: HealthCheck; coverage: Record<string, number> } {
  if (records.length === 0) {
    return {
      check: {
        status: "not_evaluated",
        message: "No rows were available for field coverage evaluation",
      },
      coverage: Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, 0])),
    };
  }

  const coverage = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [
      field,
      records.filter((record) => hasValue(record, field)).length / records.length,
    ]),
  );
  const lowestCoverage = Math.min(...Object.values(coverage));
  const failedFields = REQUIRED_FIELDS.filter((field) => coverage[field] < threshold);

  return {
    check: {
      status: failedFields.length === 0 ? "pass" : "fail",
      value: lowestCoverage,
      threshold,
      message:
        failedFields.length === 0
          ? "All required fields meet the coverage threshold"
          : `Required field coverage below threshold: ${failedFields.join(", ")}`,
    },
    coverage,
  };
}

function evaluateDetails(
  details: readonly DetailHealthEvidence[] | undefined,
  options: HealthEvaluationOptions,
): HealthCheck {
  const explicitChecks: boolean[] = [];

  if (options.detailsResolve !== undefined) {
    explicitChecks.push(options.detailsResolve);
  }
  if (options.activeDetailContent !== undefined) {
    explicitChecks.push(options.activeDetailContent);
  }
  for (const detail of details ?? []) {
    if (detail.resolved !== undefined) explicitChecks.push(detail.resolved);
    if (detail.hasActiveContent !== undefined) explicitChecks.push(detail.hasActiveContent);
    if (detail.activeContent !== undefined) explicitChecks.push(detail.activeContent);
  }

  if (explicitChecks.length === 0) {
    return { status: "not_evaluated", message: "No detail health evidence supplied" };
  }

  return explicitChecks.every(Boolean)
    ? { status: "pass", value: true, message: "Detail pages contain active job evidence" }
    : { status: "fail", value: false, message: "A detail resolved without active job content" };
}

function evaluateApplicationActions(
  details: readonly DetailHealthEvidence[] | undefined,
  options: HealthEvaluationOptions,
): HealthCheck {
  const explicitChecks: boolean[] = [];

  if (options.applicationActionsPresent !== undefined) {
    explicitChecks.push(options.applicationActionsPresent);
  }
  for (const detail of details ?? []) {
    if (detail.applicationActionPresent !== undefined) {
      explicitChecks.push(detail.applicationActionPresent);
    }
    if (detail.applicationAction !== undefined) {
      explicitChecks.push(detail.applicationAction);
    }
  }

  if (explicitChecks.length === 0) {
    return options.requireApplicationActions
      ? {
          status: "fail",
          value: false,
          message: "Application-action evidence was required but not supplied",
        }
      : { status: "not_evaluated", message: "No application-action evidence supplied" };
  }

  return explicitChecks.every(Boolean)
    ? { status: "pass", value: true, message: "Application actions are present" }
    : { status: "fail", value: false, message: "An active detail is missing its application action" };
}

function evaluateSchemaVersion(options: HealthEvaluationOptions): HealthCheck {
  const { schemaVersion, expectedSchemaVersion } = options;

  if (schemaVersion === undefined && expectedSchemaVersion === undefined) {
    return { status: "not_evaluated", message: "No schema version evidence supplied" };
  }
  if (schemaVersion === undefined || expectedSchemaVersion === undefined) {
    return options.requireSchemaVersion
      ? { status: "fail", value: false, message: "Schema version evidence is incomplete" }
      : { status: "not_evaluated", message: "Schema version evidence is incomplete" };
  }

  const matches = schemaVersion === expectedSchemaVersion;
  return {
    status: matches ? "pass" : "fail",
    value: schemaVersion,
    baseline: expectedSchemaVersion,
    message: matches ? "Schema version is unchanged" : "Unexpected schema version change",
  };
}

function evaluateHealthInput(
  records: readonly unknown[],
  baselineRecords: readonly unknown[] | undefined,
  options: HealthEvaluationOptions,
): HealthEvaluation {
  const minimumFieldCoverage = options.minimumFieldCoverage ?? DEFAULTS.minimumFieldCoverage;
  const maximumDuplicateRate = options.maximumDuplicateRate ?? DEFAULTS.maximumDuplicateRate;
  const minimumCountRatio = options.minimumCountRatio ?? DEFAULTS.minimumCountRatio;
  const duplicateRateSpikeDelta = options.duplicateRateSpikeDelta ?? DEFAULTS.duplicateRateSpikeDelta;
  const deduplicated = deduplicateJobRecords(
    records.filter((record): record is JobRecord => jobRecordSchema.safeParse(record).success),
  );
  const validRecords = records.filter((record) => jobRecordSchema.safeParse(record).success);
  const invalidRecordCount = records.length - validRecords.length;
  const coverage = checkRequiredFieldCoverage(records, minimumFieldCoverage);
  const baselineRowCount = options.baselineCount ?? baselineRecords?.length;
  const countRatio = baselineRowCount && baselineRowCount > 0 ? records.length / baselineRowCount : undefined;
  const rowCount: HealthCheck =
    baselineRowCount === undefined
      ? { status: "not_evaluated", value: records.length, message: "No baseline row count supplied" }
      : baselineRowCount === 0
        ? { status: "pass", value: records.length, baseline: 0, message: "No non-empty baseline exists" }
        : {
            status:
              records.length === 0 || (countRatio ?? 0) < minimumCountRatio ? "fail" : "pass",
            value: records.length,
            baseline: baselineRowCount,
            threshold: minimumCountRatio,
            message:
              records.length === 0
                ? "Current run is empty after a non-empty baseline"
                : (countRatio ?? 0) < minimumCountRatio
                  ? "Current row count dropped below the plausible baseline ratio"
                  : "Current row count is within the plausible baseline range",
          };

  const baselineDuplicateRate =
    options.baselineDuplicateRate ??
    (baselineRecords ? deduplicateJobRecords(
      baselineRecords.filter((record): record is JobRecord => jobRecordSchema.safeParse(record).success),
    ).duplicateRate : undefined);
  const duplicateSpike =
    baselineDuplicateRate !== undefined &&
    deduplicated.duplicateRate - baselineDuplicateRate > duplicateRateSpikeDelta;
  const duplicateRate: HealthCheck = {
    status:
      deduplicated.duplicateRate > maximumDuplicateRate || duplicateSpike ? "fail" : "pass",
    value: deduplicated.duplicateRate,
    baseline: baselineDuplicateRate,
    threshold: maximumDuplicateRate,
    message:
      deduplicated.duplicateRate > maximumDuplicateRate
        ? "Duplicate rate exceeds the allowed threshold"
        : duplicateSpike
          ? "Duplicate rate spiked relative to the baseline"
          : "Duplicate rate is within the allowed range",
  };

  const enumeration: HealthCheck =
    options.paginationComplete === undefined
      ? options.requirePaginationEvidence
        ? { status: "fail", value: false, message: "Pagination completion evidence is required" }
        : { status: "not_evaluated", message: "No pagination completion evidence supplied" }
      : {
          status: options.paginationComplete ? "pass" : "fail",
          value: options.paginationComplete,
          message: options.paginationComplete
            ? "Pagination/Load More completion was confirmed"
            : "Pagination/Load More completion was not confirmed",
        };

  const schema: HealthCheck = {
    status: invalidRecordCount === 0 ? "pass" : "fail",
    value: validRecords.length,
    baseline: records.length,
    message:
      invalidRecordCount === 0
        ? "All rows satisfy the canonical JobRecord schema"
        : `${invalidRecordCount} row(s) failed the canonical JobRecord schema`,
  };
  const details = evaluateDetails(options.details, options);
  const applicationActions = evaluateApplicationActions(options.details, options);
  const schemaVersion = evaluateSchemaVersion(options);
  const checks = {
    rowCount,
    requiredFieldCoverage: coverage.check,
    fieldCoverage: coverage.check,
    duplicateRate,
    duplicates: duplicateRate,
    enumeration,
    details,
    schema,
    applicationActions,
    schemaVersion,
  };

  const reasons = Object.entries({
    rowCount,
    requiredFieldCoverage: coverage.check,
    duplicateRate,
    enumeration,
    details,
    schema,
    applicationActions,
    schemaVersion,
  })
    .filter(([, check]) => check.status === "fail")
    .map(([name, check]) => `${name}: ${check.message ?? "check failed"}`);
  const degraded = reasons.length > 0;

  return {
    status: degraded ? "degraded" : "healthy",
    healthy: !degraded,
    degraded,
    reasons,
    checks,
    metrics: {
      rowCount: records.length,
      baselineRowCount,
      countRatio,
      countDropRatio: countRatio === undefined ? undefined : 1 - countRatio,
      validRecordCount: validRecords.length,
      invalidRecordCount,
      duplicateCount: deduplicated.duplicateCount,
      duplicateRate: deduplicated.duplicateRate,
      fieldCoverage: coverage.coverage,
    },
    duplicateRecords: deduplicated.duplicates,
  };
}

/**
 * Evaluate a collector run against the previous snapshot and explicit
 * navigation/detail evidence. The array overload is convenient for ingestion;
 * the object overload keeps adapters from having to remember argument order.
 */
export function evaluateHealth(
  input: HealthEvaluationInput,
): HealthEvaluation;
export function evaluateHealth(
  records: readonly unknown[],
  baselineRecords?: readonly unknown[],
  options?: HealthEvaluationOptions,
): HealthEvaluation;
export function evaluateHealth(
  inputOrRecords: HealthEvaluationInput | readonly unknown[],
  baselineRecordsOrOptions?: readonly unknown[] | HealthEvaluationOptions,
  maybeOptions: HealthEvaluationOptions = {},
): HealthEvaluation {
  if (Array.isArray(inputOrRecords)) {
    const baselineRecords = Array.isArray(baselineRecordsOrOptions)
      ? baselineRecordsOrOptions
      : undefined;
    const options: HealthEvaluationOptions = Array.isArray(baselineRecordsOrOptions)
      ? maybeOptions
      : ((baselineRecordsOrOptions as HealthEvaluationOptions | undefined) ?? maybeOptions);
    return evaluateHealthInput(inputOrRecords, baselineRecords, options);
  }

  const input = inputOrRecords as HealthEvaluationInput;
  const {
    records,
    currentRecords,
    current,
    baselineRecords,
    previousRecords,
    baseline,
    options,
    ...directOptions
  } = input;

  return evaluateHealthInput(
    records ?? currentRecords ?? current ?? [],
    baselineRecords ?? previousRecords ?? baseline,
    { ...directOptions, ...options },
  );
}

export const evaluateCollectorHealth = evaluateHealth;
export const assessHealth = evaluateHealth;
export const evaluateCollectorRunHealth = evaluateHealth;
