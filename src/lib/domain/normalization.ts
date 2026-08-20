import type { JobRecord } from "./schemas";

export const DATE_NOT_PUBLISHED = "date not published";

/** Render a missing published date honestly without manufacturing a date. */
export function publishedDateLabel(value?: string): string {
  return value?.trim() || DATE_NOT_PUBLISHED;
}

/**
 * Canonicalize Bangalore/Bengaluru without changing the rest of a location
 * label. The source label is retained by `normalizeJobRecord` when a change is
 * made. Deliberately do not infer `remote`, country, or city from free text.
 */
export function normalizeLocation(location: string): string {
  const source = location.trim().replace(/\s+/g, " ");

  return source
    .replace(/\bbangalore\b/gi, "Bengaluru")
    .replace(/\bbengaluru\b/gi, "Bengaluru")
    .replace(/\s*,\s*/g, ", ");
}

export type NormalizedLocation = {
  value: string;
  source: string;
  changed: boolean;
};

export function normalizeLocationWithSource(
  location: string,
): NormalizedLocation {
  const value = normalizeLocation(location);

  return {
    value,
    source: location,
    changed: value !== location,
  };
}

/**
 * Normalize one canonical job record while preserving the source location
 * whenever the displayed label changes. The function is intentionally a
 * shallow copy: it never invents missing fields or dates.
 */
export function normalizeJobRecord(record: JobRecord): JobRecord {
  const location = normalizeLocationWithSource(record.location);
  const normalized: JobRecord = {
    ...record,
    location: location.value,
  };

  if (location.changed && normalized.sourceLocation === undefined) {
    normalized.sourceLocation = location.source;
  }

  return normalized;
}

export function normalizeJobRecords(
  records: readonly JobRecord[],
): JobRecord[] {
  return records.map(normalizeJobRecord);
}

// Friendly aliases used by ingestion callers.
export const normalizeJob = normalizeJobRecord;
export const normalizeJobs = normalizeJobRecords;
export const normalizeBangaloreLocation = normalizeLocation;
export const normalizeCity = normalizeLocation;
