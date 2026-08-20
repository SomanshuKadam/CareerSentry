import { canonicalizeJobUrl, companyJobIdKey, companyJobUrlKey, deduplicateJobs } from "./deduplication";
import { normalizeLocation } from "./normalization";
import type { JobRecord, LifecycleType } from "./schemas";

export type LifecycleChange = {
  type: LifecycleType;
  jobKey: string;
  current?: JobRecord;
  previous?: JobRecord;
  changedFields: string[];
};

export type LifecycleDiff = {
  changes: LifecycleChange[];
  newJobs: JobRecord[];
  updatedJobs: JobRecord[];
  closedJobs: JobRecord[];
  unchangedJobs: JobRecord[];
  counts: {
    new: number;
    updated: number;
    closed: number;
    unchanged: number;
  };
  /** Common aliases for persistence and UI adapters. */
  added: JobRecord[];
  removed: JobRecord[];
  updated: JobRecord[];
  unchanged: JobRecord[];
};

const COMPARABLE_FIELDS: readonly (keyof JobRecord)[] = [
  "companyId",
  "jobId",
  "title",
  "location",
  "workplaceType",
  "department",
  "employmentType",
  "publishedAt",
  "experienceText",
  "description",
  "companyJobUrl",
  "applyUrl",
  "sourceCatalogUrl",
  "collectorId",
];

function comparableValue(field: keyof JobRecord, record: JobRecord): unknown {
  const value = record[field];

  if (field === "location" && typeof value === "string") {
    return normalizeLocation(value).toLocaleLowerCase();
  }

  if ((field === "companyJobUrl" || field === "applyUrl") && typeof value === "string") {
    return canonicalizeJobUrl(value);
  }

  return value;
}

export function changedJobFields(previous: JobRecord, current: JobRecord): string[] {
  return COMPARABLE_FIELDS.filter(
    (field) => comparableValue(field, previous) !== comparableValue(field, current),
  );
}

function findPrevious(
  current: JobRecord,
  previousById: Map<string, JobRecord>,
  previousByUrl: Map<string, JobRecord>,
): JobRecord | undefined {
  return previousById.get(companyJobIdKey(current)) ?? previousByUrl.get(companyJobUrlKey(current));
}

/**
 * Compare two snapshots. `collectedAt` and source-only location labels do not
 * create updates; a new observation timestamp is expected on every run.
 * Records are matched by company job ID first and canonical URL second.
 */
export function diffJobLifecycle(
  previous: readonly JobRecord[],
  current: readonly JobRecord[],
): LifecycleDiff {
  const previousRecords = deduplicateJobs(previous);
  const currentRecords = deduplicateJobs(current);
  const previousById = new Map(previousRecords.map((record) => [companyJobIdKey(record), record]));
  const previousByUrl = new Map(previousRecords.map((record) => [companyJobUrlKey(record), record]));
  const matchedPrevious = new Set<JobRecord>();
  const changes: LifecycleChange[] = [];

  for (const currentRecord of currentRecords) {
    const prior = findPrevious(currentRecord, previousById, previousByUrl);
    const jobKey = `job:${companyJobIdKey(currentRecord)}`;

    if (!prior) {
      changes.push({
        type: "new",
        jobKey,
        current: currentRecord,
        changedFields: [],
      });
      continue;
    }

    matchedPrevious.add(prior);
    const changedFields = changedJobFields(prior, currentRecord);
    changes.push({
      type: changedFields.length > 0 ? "updated" : "unchanged",
      jobKey,
      current: currentRecord,
      previous: prior,
      changedFields,
    });
  }

  for (const previousRecord of previousRecords) {
    if (matchedPrevious.has(previousRecord)) {
      continue;
    }

    changes.push({
      type: "closed",
      jobKey: `job:${companyJobIdKey(previousRecord)}`,
      previous: previousRecord,
      changedFields: [],
    });
  }

  const newJobs = changes.flatMap((change) =>
    change.type === "new" && change.current ? [change.current] : [],
  );
  const updatedJobs = changes.flatMap((change) =>
    change.type === "updated" && change.current ? [change.current] : [],
  );
  const closedJobs = changes.flatMap((change) =>
    change.type === "closed" && change.previous ? [change.previous] : [],
  );
  const unchangedJobs = changes.flatMap((change) =>
    change.type === "unchanged" && change.current ? [change.current] : [],
  );

  return {
    changes,
    newJobs,
    updatedJobs,
    closedJobs,
    unchangedJobs,
    counts: {
      new: newJobs.length,
      updated: updatedJobs.length,
      closed: closedJobs.length,
      unchanged: unchangedJobs.length,
    },
    added: newJobs,
    removed: closedJobs,
    updated: updatedJobs,
    unchanged: unchangedJobs,
  };
}

export const computeLifecycleDiff = diffJobLifecycle;
export const getLifecycleDiff = diffJobLifecycle;
export const diffJobs = diffJobLifecycle;
export const diffLifecycle = diffJobLifecycle;
