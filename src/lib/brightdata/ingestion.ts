import { z } from "zod";

import {
  httpUrlSchema,
  jobRecordSchema,
  type JobRecord,
  type WorkplaceType,
} from "../domain";
import { normalizeJobRecord } from "../domain/normalization";

/**
 * Raw business fields requested from a Scraper Studio Discovery collector.
 *
 * The schema is passthrough on purpose: Bright Data attaches platform fields
 * such as `product_page_url` and `input` to otherwise useful rows. The mapper
 * below selects only business fields, so those platform fields never become
 * part of the application contract.
 */
export const scraperStudioRowSchema = z
  .object({
    job_id: z.string().trim().min(1).optional(),
    job_id_value: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1),
    location: z.string().trim().min(1),
    department: z.string().trim().min(1),
    employment_type: z.string().trim().min(1),
    company_job_url: z.string().trim().min(1),
    // These optional fields are accepted when a collector supplies them, but
    // are not required for a Discovery row.
    apply_url: z.string().trim().min(1).optional(),
    published_at: z.string().trim().min(1).optional(),
    experience_text: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .passthrough()
  .superRefine((row, context) => {
    if (!row.job_id && !row.job_id_value) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["job_id"],
        message: "Expected job_id or job_id_value",
      });
      return;
    }

    if (row.job_id && row.job_id_value && row.job_id !== row.job_id_value) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["job_id"],
        message: "job_id and job_id_value conflict",
      });
    }
  });

export type ScraperStudioRow = z.infer<typeof scraperStudioRowSchema> &
  Readonly<Record<string, unknown>>;
export type RawScraperStudioRow = ScraperStudioRow;
export const rawScraperStudioRowSchema = scraperStudioRowSchema;

/** Provenance and contract values not present in a Discovery row. */
export type BrightDataIngestionMetadata = {
  companyId: string;
  sourceCatalogUrl: string;
  collectorId: string;
  collectedAt: string;
  /** A delegated ATS origin can be added alongside the official catalog host. */
  allowedOrigins?: readonly string[];
  /** Singular convenience form for the common one-origin case. */
  allowedOrigin?: string;
  workplaceType?: WorkplaceType;
};
export type BrightDataProvenance = BrightDataIngestionMetadata;

export type BrightDataIngestionErrorCode =
  | "metadata_invalid"
  | "rows_invalid"
  | "legacy_job_id_field"
  | "missing_requisition"
  | "conflicting_requisition"
  | "error_envelope"
  | "missing_company_job_url"
  | "origin_not_allowed"
  | "path_not_allowed"
  | "https_required";

export class BrightDataIngestionError extends Error {
  constructor(
    message: string,
    readonly code: BrightDataIngestionErrorCode,
    readonly rowIndex?: number,
  ) {
    super(message);
    this.name = "BrightDataIngestionError";
  }
}

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

function describeZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "row";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function urlOrigin(value: string): string {
  return new URL(value).origin.toLocaleLowerCase();
}

function normalizeAllowedOrigins(
  metadata: BrightDataIngestionMetadata,
): Set<string> {
  const configured = [
    ...(metadata.allowedOrigins ?? []),
    ...(metadata.allowedOrigin ? [metadata.allowedOrigin] : []),
  ];
  const values = configured.length > 0 ? configured : [metadata.sourceCatalogUrl];
  const origins = new Set<string>();

  for (const value of values) {
    const parsed = httpsUrlSchema.safeParse(value);
    if (!parsed.success) {
      throw new BrightDataIngestionError(
        `Allowed origin must be an HTTPS URL: ${value}`,
        "metadata_invalid",
      );
    }
    origins.add(urlOrigin(parsed.data));
  }

  return origins;
}

function validateMetadata(metadata: BrightDataIngestionMetadata): Set<string> {
  const metadataShape = z.object({
    companyId: z.string().trim().min(1),
    sourceCatalogUrl: httpsUrlSchema,
    collectorId: z.string().trim().min(1),
    collectedAt: z.string().trim().min(1),
    allowedOrigins: z.array(z.string().trim().min(1)).readonly().optional(),
    allowedOrigin: z.string().trim().min(1).optional(),
    workplaceType: z.enum(["remote", "hybrid", "onsite", "unknown"]).optional(),
  });
  const parsed = metadataShape.safeParse(metadata);

  if (!parsed.success) {
    throw new BrightDataIngestionError(
      `Bright Data provenance metadata is invalid: ${describeZodIssues(parsed.error)}`,
      "metadata_invalid",
    );
  }

  return normalizeAllowedOrigins(parsed.data);
}

function ensureRowObject(value: unknown, rowIndex: number): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} must be an object`,
      "rows_invalid",
      rowIndex,
    );
  }
  return value as Record<string, unknown>;
}

function parseRawRow(value: unknown, rowIndex: number): ScraperStudioRow {
  const object = ensureRowObject(value, rowIndex);
  const hasJobId = Object.prototype.hasOwnProperty.call(object, "job_id");
  const hasLegacyJobId = Object.prototype.hasOwnProperty.call(object, "job_id_value");
  const jobId = typeof object.job_id === "string" ? object.job_id.trim() : "";
  const legacyJobId =
    typeof object.job_id_value === "string" ? object.job_id_value.trim() : "";

  if (!jobId && !legacyJobId && !hasJobId && !hasLegacyJobId) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} is missing both requisition fields job_id and job_id_value`,
      "missing_requisition",
      rowIndex,
    );
  }

  if (!jobId && !legacyJobId) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} contains no usable requisition value in job_id or job_id_value`,
      "missing_requisition",
      rowIndex,
    );
  }

  if (jobId && legacyJobId && jobId !== legacyJobId) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} has conflicting requisition values in job_id and job_id_value`,
      "conflicting_requisition",
      rowIndex,
    );
  }

  const parsed = scraperStudioRowSchema.safeParse(object);
  if (!parsed.success) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} does not match the expected business schema: ${describeZodIssues(parsed.error)}`,
      "rows_invalid",
      rowIndex,
    );
  }

  return parsed.data;
}

function validateCompanyJobUrl(
  value: string,
  rowIndex: number,
  allowedOrigins: Set<string>,
  fieldName = "company_job_url",
): string {
  const parsed = httpsUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} ${fieldName} must use HTTPS`,
      "https_required",
      rowIndex,
    );
  }

  const origin = urlOrigin(parsed.data);
  if (!allowedOrigins.has(origin)) {
    throw new BrightDataIngestionError(
      `Scraper Studio row ${rowIndex} ${fieldName} origin ${origin} is not allowed`,
      "origin_not_allowed",
      rowIndex,
    );
  }

  return parsed.data;
}

function validateOptionalUrl(
  value: string | undefined,
  rowIndex: number,
  allowedOrigins: Set<string>,
): string | undefined {
  if (value === undefined) return undefined;
  return validateCompanyJobUrl(value, rowIndex, allowedOrigins, "apply_url");
}

/**
 * Map raw Scraper Studio dataset rows into the canonical JobRecord contract.
 *
 * This is deliberately a pure boundary adapter: it makes no network calls,
 * never logs row contents, and returns no partial result when one row fails.
 */
export function mapScraperStudioRows(
  rows: readonly unknown[],
  metadata: BrightDataIngestionMetadata,
): JobRecord[] {
  const allowedOrigins = validateMetadata(metadata);
  const records: JobRecord[] = [];

  rows.forEach((rawRow, rowIndex) => {
    const row = parseRawRow(rawRow, rowIndex);
    const companyJobUrl = validateCompanyJobUrl(
      row.company_job_url,
      rowIndex,
      allowedOrigins,
    );
    const applyUrl = validateOptionalUrl(row.apply_url, rowIndex, allowedOrigins);
    const candidate = {
      companyId: metadata.companyId,
      jobId: row.job_id ?? row.job_id_value ?? "",
      title: row.title,
      location: row.location,
      workplaceType: metadata.workplaceType ?? "unknown",
      department: row.department,
      employmentType: row.employment_type,
      publishedAt: row.published_at,
      experienceText: row.experience_text,
      description: row.description,
      companyJobUrl,
      applyUrl,
      sourceCatalogUrl: metadata.sourceCatalogUrl,
      collectorId: metadata.collectorId,
      collectedAt: metadata.collectedAt,
    };
    const parsed = jobRecordSchema.safeParse(candidate);

    if (!parsed.success) {
      throw new BrightDataIngestionError(
        `Mapped Scraper Studio row ${rowIndex} failed the canonical JobRecord contract: ${describeZodIssues(parsed.error)}`,
        "rows_invalid",
        rowIndex,
      );
    }

    records.push(normalizeJobRecord(parsed.data));
  });

  return records;
}

export const ingestScraperStudioRows = mapScraperStudioRows;
export const normalizeBrightDataRows = mapScraperStudioRows;
export const ingestBrightDataRows = mapScraperStudioRows;
export const adaptScraperStudioRows = mapScraperStudioRows;
export const mapBrightDataRows = mapScraperStudioRows;
