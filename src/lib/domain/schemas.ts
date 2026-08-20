import { z } from "zod";

/**
 * The canonical workplace values used by the UI and persistence layer.
 *
 * A scraper is allowed to return a value that cannot be classified. In that
 * case the normalizer must use `unknown`, rather than guessing from a title or
 * description.
 */
export const workplaceTypeSchema = z.enum([
  "remote",
  "hybrid",
  "onsite",
  "unknown",
]);

export type WorkplaceType = z.infer<typeof workplaceTypeSchema>;

export const lifecycleTypeSchema = z.enum([
  "new",
  "updated",
  "closed",
  "unchanged",
]);

export type LifecycleType = z.infer<typeof lifecycleTypeSchema>;

const requiredText = z
  .string()
  .refine((value) => value.trim().length > 0, "Expected a non-empty string");

/** HTTP(S) URLs are the only URLs accepted in the public job contract. */
export const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Expected an HTTP(S) URL");

/**
 * A published date may be date-only, a full timestamp, or source text such as
 * `date not published`. Scrapers expose several honest representations; the
 * normalizer must preserve them rather than inventing a date.
 */
export const isoDateSchema = requiredText.refine(
  (value) => {
    if (!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) {
      return false;
    }

    return !Number.isNaN(Date.parse(value));
  },
  "Expected an ISO date or ISO timestamp",
);

/** Collected-at is always an instant, rather than an ambiguous date. */
export const isoDateTimeSchema = requiredText.refine(
  (value) => {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return false;
    }

    return !Number.isNaN(Date.parse(value));
  },
  "Expected an ISO timestamp",
);

/**
 * Stable normalized output from either a Discovery or PDP collector.
 *
 * `sourceLocation` is an intentionally small extension to the contract. It is
 * only populated when normalization changes the visible source label (for
 * example, `Bangalore` -> `Bengaluru`), allowing the UI to explain the
 * normalization without making source data disappear.
 */
export const jobRecordSchema = z
  .object({
    companyId: requiredText,
    jobId: requiredText,
    title: requiredText,
    location: requiredText,
    workplaceType: workplaceTypeSchema,
    department: requiredText.optional(),
    employmentType: requiredText.optional(),
    publishedAt: requiredText.optional(),
    experienceText: requiredText.optional(),
    description: requiredText.optional(),
    companyJobUrl: httpUrlSchema,
    applyUrl: httpUrlSchema.optional(),
    sourceCatalogUrl: httpUrlSchema,
    collectorId: requiredText,
    collectedAt: isoDateTimeSchema,
    sourceLocation: requiredText.optional(),
  })
  .strict();

export type JobRecord = z.infer<typeof jobRecordSchema>;

// Upper-case aliases make the contract discoverable for callers that use the
// common `FooSchema` naming convention.
export const JobRecordSchema = jobRecordSchema;
export const WorkplaceTypeSchema = workplaceTypeSchema;
export const LifecycleTypeSchema = lifecycleTypeSchema;

export type CompanySource = {
  companyId: string;
  companyName: string;
  corporateUrl: string;
  careersUrl: string;
  catalogUrl: string;
  /** The route by which the catalog was verified. */
  provenance: "corporate-to-careers" | "delegated-ats";
  verifiedAt: string;
};

export type Collector = {
  collectorId: string;
  companyId: string;
  collectorType: "discovery" | "pdp";
  status: "active" | "degraded" | "disabled";
  sourceUrl: string;
  lastKnownGoodRunId?: string;
};

export type CollectorRun = {
  runId: string;
  collectorId: string;
  startedAt: string;
  completedAt?: string;
  snapshotId?: string;
  rowCount: number;
  status: "running" | "succeeded" | "degraded" | "failed";
};

export type JobVersion = {
  versionId: string;
  companyId: string;
  jobId: string;
  observedAt: string;
  lifecycle: Exclude<LifecycleType, "unchanged">;
  record: JobRecord;
};

export type HealthIncidentStatus =
  | "degraded"
  | "awaiting_heal"
  | "preview_ready"
  | "approved"
  | "verifying"
  | "recovered"
  | "needs_review";

export type HealthIncident = {
  incidentId: string;
  collectorId: string;
  status: HealthIncidentStatus;
  detectedAt: string;
  reasons: string[];
  evidence?: Record<string, unknown>;
  healPrompt?: string;
};

export type CandidatePreference = {
  titleKeywords: string[];
  locations: string[];
  workplaceTypes: WorkplaceType[];
  skills: string[];
  minimumExperienceYears?: number;
};

export type MatchExplanation = {
  score: number;
  matchedKeywords: string[];
  matchedLocations: string[];
  matchedSkills: string[];
  reasons: string[];
};

export type JobMatch = JobRecord & {
  match: MatchExplanation;
};

export function parseJobRecord(input: unknown): JobRecord {
  return jobRecordSchema.parse(input);
}

export function safeParseJobRecord(input: unknown) {
  return jobRecordSchema.safeParse(input);
}
