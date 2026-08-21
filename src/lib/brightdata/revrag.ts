import { z } from "zod";

import {
  evaluateHealth,
  type HealthEvaluation,
  type HealthEvaluationOptions,
} from "../domain/health";
import { normalizeJobRecord } from "../domain/normalization";
import {
  httpUrlSchema,
  jobRecordSchema,
  type JobRecord,
  type WorkplaceType,
} from "../domain/schemas";
import {
  BrightDataIngestionError,
  type BrightDataIngestionErrorCode,
  type BrightDataIngestionMetadata,
} from "./ingestion";

const nonEmptyText = z.string().trim().min(1);

const httpsUrlSchema = httpUrlSchema.refine(
  (value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  },
  "Expected an HTTPS URL",
);

/**
 * The business fields observed in the RevRag Discovery output. The schema is
 * passthrough because the platform may add `job_url`, `input`, and
 * `product_page_url`; the mapper deliberately selects only the fields below.
 *
 * `product_page_url` is the first-party detail URL in the observed output.
 * It is not an application URL and is only used as a canonical company URL
 * after origin and path provenance checks.
 */
export const revRagRowSchema = z
  .object({
    // The first run exposed this stable slug directly. The healed run omits
    // it, so the mapper may derive it from a validated company detail URL.
    job_id_value: nonEmptyText.optional(),
    title: nonEmptyText,
    department: nonEmptyText,
    location: nonEmptyText,
    employment_type: nonEmptyText,
    experience_text: nonEmptyText.optional(),
    summary: nonEmptyText.optional(),
    company_job_url: nonEmptyText.optional(),
    product_page_url: nonEmptyText.optional(),
  })
  .passthrough()
  .superRefine((row, context) => {
    if (Object.prototype.hasOwnProperty.call(row, "error")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["error"],
        message: "Error envelopes are not job records",
      });
    }

    if (Object.prototype.hasOwnProperty.call(row, "error_code")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["error_code"],
        message: "Error envelopes are not job records",
      });
    }

    if (
      row.job_id_value === undefined &&
      row.company_job_url === undefined &&
      row.product_page_url === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["job_id_value"],
        message: "Expected job_id_value or a company job URL for stable identity",
      });
    }
  });

export const rawRevRagRowSchema = revRagRowSchema;
export const revRagRawRowSchema = revRagRowSchema;
export type RevRagRawRow = z.infer<typeof revRagRowSchema>;
export type RawRevRagRow = RevRagRawRow;

export type RevRagIngestionMetadata = BrightDataIngestionMetadata & {
  /** Allowed first-party detail path prefixes, e.g. `/careers`. */
  allowedPathPrefixes?: readonly string[];
  /** Singular convenience form for one careers path. */
  allowedPathPrefix?: string;
  /** Alternate plural/singular names accepted by local callers. */
  allowedPaths?: readonly string[];
  allowedPath?: string;
};

export type RevRagProvenance = RevRagIngestionMetadata;

export type RevRagSnapshotStatus = "healthy" | "degraded" | "rejected";

export type RevRagSnapshotError = {
  rowIndex: number;
  code: BrightDataIngestionErrorCode;
  message: string;
  /** Platform error code, when the rejected row supplied one. */
  errorCode?: string;
};

export type RevRagSnapshotOptions = {
  baselineRecords?: readonly JobRecord[];
  health?: HealthEvaluationOptions;
};

export type RevRagSnapshotResult = {
  status: RevRagSnapshotStatus;
  healthy: boolean;
  degraded: boolean;
  rejected: boolean;
  rowCount: number;
  validRowCount: number;
  errorRowCount: number;
  records: JobRecord[];
  errors: RevRagSnapshotError[];
  health: HealthEvaluation;
};

type RevRagProvenanceContext = {
  origins: Set<string>;
  pathPrefixes: string[];
};

const metadataShape = z.object({
  companyId: nonEmptyText,
  sourceCatalogUrl: httpsUrlSchema,
  collectorId: nonEmptyText,
  collectedAt: nonEmptyText,
  allowedOrigins: z.array(nonEmptyText).readonly().optional(),
  allowedOrigin: nonEmptyText.optional(),
  allowedPathPrefixes: z.array(nonEmptyText).readonly().optional(),
  allowedPathPrefix: nonEmptyText.optional(),
  allowedPaths: z.array(nonEmptyText).readonly().optional(),
  allowedPath: nonEmptyText.optional(),
  workplaceType: z.enum(["remote", "hybrid", "onsite", "unknown"]).optional(),
});

function describeZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "row";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function ingestionError(
  message: string,
  code: BrightDataIngestionErrorCode,
  rowIndex?: number,
): BrightDataIngestionError {
  return new BrightDataIngestionError(message, code, rowIndex);
}

function originOf(value: string): string {
  return new URL(value).origin.toLowerCase();
}

function normalizePathPrefix(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.includes("?") || trimmed.includes("#")) {
    throw ingestionError(
      `RevRag allowed path must be a URL pathname beginning with /: ${value}`,
      "metadata_invalid",
    );
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function validateMetadata(
  metadata: RevRagIngestionMetadata,
): RevRagProvenanceContext {
  const parsed = metadataShape.safeParse(metadata);

  if (!parsed.success) {
    throw ingestionError(
      `RevRag provenance metadata is invalid: ${describeZodIssues(parsed.error)}`,
      "metadata_invalid",
    );
  }

  const configuredOrigins = [
    ...(parsed.data.allowedOrigins ?? []),
    ...(parsed.data.allowedOrigin ? [parsed.data.allowedOrigin] : []),
  ];
  const originValues =
    configuredOrigins.length > 0
      ? configuredOrigins
      : [parsed.data.sourceCatalogUrl];
  const origins = new Set<string>();

  for (const value of originValues) {
    const originUrl = httpsUrlSchema.safeParse(value);
    if (!originUrl.success) {
      throw ingestionError(
        `RevRag allowed origin must be an HTTPS URL: ${value}`,
        "metadata_invalid",
      );
    }
    origins.add(originOf(originUrl.data));
  }

  const configuredPaths = [
    ...(parsed.data.allowedPathPrefixes ?? []),
    ...(parsed.data.allowedPaths ?? []),
    ...(parsed.data.allowedPathPrefix ? [parsed.data.allowedPathPrefix] : []),
    ...(parsed.data.allowedPath ? [parsed.data.allowedPath] : []),
  ];
  const sourcePath = new URL(parsed.data.sourceCatalogUrl).pathname;
  const pathValues = configuredPaths.length > 0 ? configuredPaths : [sourcePath];

  return {
    origins,
    pathPrefixes: pathValues.map(normalizePathPrefix),
  };
}

function ensureObject(value: unknown, rowIndex: number): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw ingestionError(
      `RevRag row ${rowIndex} must be an object`,
      "rows_invalid",
      rowIndex,
    );
  }

  return value as Record<string, unknown>;
}

function errorEnvelopeFields(value: Record<string, unknown>): string[] {
  return ["error", "error_code"].filter((field) =>
    Object.prototype.hasOwnProperty.call(value, field),
  );
}

function parseRawRow(value: unknown, rowIndex: number): RevRagRawRow {
  const object = ensureObject(value, rowIndex);
  const envelopeFields = errorEnvelopeFields(object);

  if (envelopeFields.length > 0) {
    throw ingestionError(
      `RevRag row ${rowIndex} contains an error envelope (${envelopeFields.join(" and ")})`,
      "error_envelope",
      rowIndex,
    );
  }

  const parsed = revRagRowSchema.safeParse(object);
  if (!parsed.success) {
    throw ingestionError(
      `RevRag row ${rowIndex} does not match the expected business schema: ${describeZodIssues(parsed.error)}`,
      "rows_invalid",
      rowIndex,
    );
  }

  return parsed.data;
}

function validateCompanyJobUrl(
  value: string,
  rowIndex: number,
  provenance: RevRagProvenanceContext,
): string {
  const parsed = httpsUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw ingestionError(
      `RevRag row ${rowIndex} company job URL must use HTTPS`,
      "https_required",
      rowIndex,
    );
  }

  const url = new URL(parsed.data);
  const origin = url.origin.toLowerCase();
  if (!provenance.origins.has(origin)) {
    throw ingestionError(
      `RevRag row ${rowIndex} company job URL origin ${origin} is not allowed`,
      "origin_not_allowed",
      rowIndex,
    );
  }

  const allowedPath = provenance.pathPrefixes.some((prefix) => {
    const pathAfterPrefix =
      prefix === "/"
        ? url.pathname.slice(1)
        : url.pathname.startsWith(`${prefix}/`)
          ? url.pathname.slice(prefix.length + 1)
          : "";
    return pathAfterPrefix.split("/").some((segment) => segment.length > 0);
  });
  if (!allowedPath) {
    throw ingestionError(
      `RevRag row ${rowIndex} company job URL path ${url.pathname} is not allowed`,
      "path_not_allowed",
      rowIndex,
    );
  }

  return parsed.data;
}

function authoritativeCompanyJobUrl(
  row: RevRagRawRow,
  rowIndex: number,
  provenance: RevRagProvenanceContext,
): string {
  // A supplied company_job_url is authoritative. The platform's
  // product_page_url is the only permitted fallback; job_url and application
  // form fields are intentionally never considered here.
  const candidate =
    row.company_job_url !== undefined
      ? row.company_job_url
      : row.product_page_url;

  if (candidate === undefined) {
    throw ingestionError(
      `RevRag row ${rowIndex} is missing company_job_url and product_page_url`,
      "missing_company_job_url",
      rowIndex,
    );
  }

  return validateCompanyJobUrl(candidate, rowIndex, provenance);
}

function deriveJobIdFromCompanyUrl(
  companyJobUrl: string,
  rowIndex: number,
  provenance: RevRagProvenanceContext,
): string {
  const pathname = new URL(companyJobUrl).pathname.replace(/\/+$/, "") || "/";

  // Use the final non-empty path segment only after the URL has passed the
  // same-origin and allowed-careers-path checks above. Never derive identity
  // from a title or from an external application URL.
  const prefixes = [...provenance.pathPrefixes].sort(
    (left, right) => right.length - left.length,
  );
  for (const prefix of prefixes) {
    if (pathname === prefix || !pathname.startsWith(`${prefix}/`)) {
      continue;
    }

    const segments = pathname
      .slice(prefix.length)
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const slug = segments.at(-1);
    if (slug) {
      return slug;
    }
  }

  throw ingestionError(
    `RevRag row ${rowIndex} has no non-empty role slug after the validated company path`,
    "missing_requisition",
    rowIndex,
  );
}

function mapRevRagRow(
  rawRow: unknown,
  rowIndex: number,
  metadata: RevRagIngestionMetadata,
  provenance: RevRagProvenanceContext,
): JobRecord {
  const row = parseRawRow(rawRow, rowIndex);
  const companyJobUrl = authoritativeCompanyJobUrl(row, rowIndex, provenance);
  const jobId =
    row.job_id_value ?? deriveJobIdFromCompanyUrl(companyJobUrl, rowIndex, provenance);
  const candidate = {
    companyId: metadata.companyId,
    jobId,
    title: row.title,
    location: row.location,
    workplaceType: metadata.workplaceType ?? ("unknown" as WorkplaceType),
    department: row.department,
    employmentType: row.employment_type,
    experienceText: row.experience_text,
    description: row.summary,
    companyJobUrl,
    sourceCatalogUrl: metadata.sourceCatalogUrl,
    collectorId: metadata.collectorId,
    collectedAt: metadata.collectedAt,
  };
  const parsed = jobRecordSchema.safeParse(candidate);

  if (!parsed.success) {
    throw ingestionError(
      `Mapped RevRag row ${rowIndex} failed the canonical JobRecord contract: ${describeZodIssues(parsed.error)}`,
      "rows_invalid",
      rowIndex,
    );
  }

  return normalizeJobRecord(parsed.data);
}

/**
 * Strictly map RevRag rows. Any error envelope or malformed row rejects the
 * complete mapping, so callers cannot accidentally persist a partial snapshot.
 */
export function mapRevRagRows(
  rows: readonly unknown[],
  metadata: RevRagIngestionMetadata,
): JobRecord[] {
  const provenance = validateMetadata(metadata);
  return rows.map((row, rowIndex) =>
    mapRevRagRow(row, rowIndex, metadata, provenance),
  );
}

function platformErrorCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const code = (value as Record<string, unknown>).error_code;
  return typeof code === "string" && code.trim().length > 0
    ? code.trim()
    : undefined;
}

function snapshotError(error: unknown, rawRow: unknown, rowIndex: number): RevRagSnapshotError {
  if (error instanceof BrightDataIngestionError) {
    return {
      rowIndex,
      code: error.code,
      message: error.message,
      errorCode: platformErrorCode(rawRow),
    };
  }

  return {
    rowIndex,
    code: "rows_invalid",
    message: `RevRag row ${rowIndex} could not be mapped`,
    errorCode: platformErrorCode(rawRow),
  };
}

function snapshotHealth(
  records: readonly JobRecord[],
  errors: readonly RevRagSnapshotError[],
  rowCount: number,
  options: RevRagSnapshotOptions,
): HealthEvaluation {
  const baseline = options.baselineRecords;
  const base = evaluateHealth(records, baseline, options.health ?? {});
  const hasRejectedRows = errors.length > 0;

  if (!hasRejectedRows && records.length > 0) {
    return base;
  }

  const reason = hasRejectedRows
    ? `snapshot: ${errors.length} raw row(s) were rejected, including error envelopes`
    : "snapshot: no valid RevRag rows were accepted";

  return {
    ...base,
    status: "degraded",
    healthy: false,
    degraded: true,
    reasons: [reason, ...base.reasons],
    checks: {
      ...base.checks,
      schema: {
        status: "fail",
        value: records.length,
        baseline: rowCount,
        message: hasRejectedRows
          ? `${errors.length} raw row(s) failed RevRag snapshot validation`
          : "No valid rows satisfied the RevRag snapshot contract",
      },
    },
    metrics: {
      ...base.metrics,
      rowCount,
      validRecordCount: records.length,
      invalidRecordCount: base.metrics.invalidRecordCount + errors.length,
    },
  };
}

/**
 * Inspect a raw RevRag snapshot without allowing rejected rows to disappear.
 * Ten valid records plus five error envelopes is deterministic `degraded`; a
 * snapshot with no valid records is `rejected`.
 */
export function ingestRevRagSnapshot(
  rows: readonly unknown[],
  metadata: RevRagIngestionMetadata,
  options: RevRagSnapshotOptions = {},
): RevRagSnapshotResult {
  const provenance = validateMetadata(metadata);
  const records: JobRecord[] = [];
  const errors: RevRagSnapshotError[] = [];

  rows.forEach((rawRow, rowIndex) => {
    try {
      records.push(mapRevRagRow(rawRow, rowIndex, metadata, provenance));
    } catch (error) {
      errors.push(snapshotError(error, rawRow, rowIndex));
    }
  });

  const health = snapshotHealth(records, errors, rows.length, options);
  const status: RevRagSnapshotStatus =
    records.length === 0
      ? "rejected"
      : errors.length > 0 || !health.healthy
        ? "degraded"
        : "healthy";

  return {
    status,
    healthy: status === "healthy",
    degraded: status === "degraded",
    rejected: status === "rejected",
    rowCount: rows.length,
    validRowCount: records.length,
    errorRowCount: errors.length,
    records,
    errors,
    health,
  };
}

export const ingestRevRagRows = mapRevRagRows;
export const adaptRevRagRows = mapRevRagRows;
export const mapRevRagDataset = mapRevRagRows;
export const ingestRevRagDataset = mapRevRagRows;
export const mapRevRagSnapshot = ingestRevRagSnapshot;
export const evaluateRevRagSnapshot = ingestRevRagSnapshot;
export const inspectRevRagSnapshot = ingestRevRagSnapshot;
