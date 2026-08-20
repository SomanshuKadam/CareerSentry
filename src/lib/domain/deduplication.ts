import type { JobRecord } from "./schemas";

const TRACKING_PARAMETER = /^(?:utm_[^=]+|fbclid|gclid|dclid|mc_cid|mc_eid)$/i;

/**
 * Canonical URL used only for identity and duplicate detection. Meaningful
 * query parameters are retained; common analytics parameters and fragments
 * are removed. Invalid URLs are returned in a trimmed form so health checks
 * can report them instead of throwing during diagnosis.
 */
export function canonicalizeJobUrl(value: string): string {
  const source = value.trim();

  try {
    const url = new URL(source);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    if ((url.protocol === "http:" && url.port === "80") ||
        (url.protocol === "https:" && url.port === "443")) {
      url.port = "";
    }

    url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";

    const params = Array.from(url.searchParams.entries())
      .filter(([key]) => !TRACKING_PARAMETER.test(key))
      .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
        leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue),
      );
    url.search = "";
    for (const [key, parameterValue] of params) {
      url.searchParams.append(key, parameterValue);
    }

    return url.toString();
  } catch {
    return source;
  }
}

export const canonicalJobUrl = canonicalizeJobUrl;

function canonicalCompanyId(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function canonicalJobId(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function companyJobIdKey(record: Pick<JobRecord, "companyId" | "jobId">): string {
  return `${canonicalCompanyId(record.companyId)}\u0000${canonicalJobId(record.jobId)}`;
}

export function companyJobUrlKey(record: Pick<JobRecord, "companyJobUrl">): string {
  return canonicalizeJobUrl(record.companyJobUrl);
}

export type DuplicateReason = "company-job-id" | "company-job-url";

export type DuplicateRecord = {
  duplicate: JobRecord;
  retained: JobRecord;
  reason: DuplicateReason;
};

export type DeduplicationResult = {
  records: JobRecord[];
  duplicates: DuplicateRecord[];
  duplicateCount: number;
  duplicateRate: number;
  byReason: Record<DuplicateReason, number>;
};

/**
 * Deduplicate in the contract's required order: company job ID first, then
 * canonical company job URL. The first observed row wins, making results
 * deterministic and avoiding accidental merges of equal-titled requisitions.
 */
export function deduplicateJobRecords(
  records: readonly JobRecord[],
): DeduplicationResult {
  const byId = new Map<string, JobRecord>();
  const byUrl = new Map<string, JobRecord>();
  const retained: JobRecord[] = [];
  const duplicates: DuplicateRecord[] = [];
  const byReason: Record<DuplicateReason, number> = {
    "company-job-id": 0,
    "company-job-url": 0,
  };

  for (const record of records) {
    const idKey = companyJobIdKey(record);
    const urlKey = companyJobUrlKey(record);
    const retainedById = byId.get(idKey);
    const retainedByUrl = byUrl.get(urlKey);

    if (retainedById) {
      duplicates.push({
        duplicate: record,
        retained: retainedById,
        reason: "company-job-id",
      });
      byReason["company-job-id"] += 1;
      continue;
    }

    if (retainedByUrl) {
      duplicates.push({
        duplicate: record,
        retained: retainedByUrl,
        reason: "company-job-url",
      });
      byReason["company-job-url"] += 1;
      continue;
    }

    retained.push(record);
    byId.set(idKey, record);
    byUrl.set(urlKey, record);
  }

  return {
    records: retained,
    duplicates,
    duplicateCount: duplicates.length,
    duplicateRate: records.length === 0 ? 0 : duplicates.length / records.length,
    byReason,
  };
}

export function deduplicateJobs(records: readonly JobRecord[]): JobRecord[] {
  return deduplicateJobRecords(records).records;
}

export const dedupeJobRecords = deduplicateJobRecords;
export const dedupeJobs = deduplicateJobs;
