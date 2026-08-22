import { describe, expect, it, vi } from "vitest";

import {
  createPostgresPersistenceRepository,
  type PersistenceDatabase,
} from "../src/lib/persistence/repository";
import { canonicalJobs, collectorRuns, healthIncidents } from "../src/lib/persistence/schema";
import type { JobRecord } from "../src/lib/domain";

const collectorId = "c_mt3ctgtj2rqnwsqm8p";
const sourceCatalogUrl = "https://www.revrag.ai/careers";

const job: JobRecord = {
  companyId: "revrag-ai",
  jobId: "role-1",
  title: "AI Engineer",
  location: "Bengaluru, India",
  workplaceType: "unknown",
  companyJobUrl: "https://www.revrag.ai/careers/role-1",
  sourceCatalogUrl,
  collectorId,
  collectedAt: "2026-08-22T10:00:00.000Z",
};

const runRow = {
  runId: "run_good",
  collectorId,
  companyId: "revrag-ai",
  sourceCatalogUrl,
  snapshotId: "j_good",
  status: "healthy" as const,
  rowCount: 1,
  validRowCount: 1,
  errorRowCount: 0,
  healthSummary: null,
  errors: null,
  startedAt: "2026-08-22T10:00:00.000Z",
  completedAt: "2026-08-22T10:00:01.000Z",
  createdAt: "2026-08-22T10:00:01.000Z",
};

function fakeDatabase(options: { failOnCanonicalInsert?: boolean } = {}) {
  const inserted: Array<{ table: unknown; values: unknown }> = [];
  const tx = {
    insert(table: unknown) {
      return {
        values(values: unknown) {
          inserted.push({ table, values });
          if (options.failOnCanonicalInsert && table === canonicalJobs) {
            throw new Error("simulated canonical insert failure");
          }
          return {
            returning: async () => (table === collectorRuns ? [runRow] : []),
          };
        },
      };
    },
  };

  const db = {
    transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    select: vi.fn(() => {
      let table: unknown;
      const chain = {
        from(value: unknown) {
          table = value;
          return chain;
        },
        where() {
          return chain;
        },
        orderBy() {
          return chain;
        },
        then(resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) {
          let rows: unknown[] = [];
          if (table === collectorRuns) rows = [runRow];
          if (table === canonicalJobs) {
            rows = [
              {
                runId: runRow.runId,
                companyId: job.companyId,
                jobId: job.jobId,
                title: job.title,
                location: job.location,
                workplaceType: job.workplaceType,
                department: null,
                employmentType: null,
                publishedAt: null,
                experienceText: null,
                description: null,
                companyJobUrl: job.companyJobUrl,
                applyUrl: null,
                sourceCatalogUrl: job.sourceCatalogUrl,
                collectorId: job.collectorId,
                // postgres-js returns `timestamp with time zone` in this
                // space-separated form when Drizzle uses mode: "string".
                collectedAt: "2026-08-22 10:00:00.000+00",
                sourceLocation: null,
              },
            ];
          }
          return Promise.resolve(rows).then(resolve, reject);
        },
        limit() {
          if (table === collectorRuns) return Promise.resolve([runRow]);
          if (table === canonicalJobs) {
            return Promise.resolve([
              {
                runId: runRow.runId,
                companyId: job.companyId,
                jobId: job.jobId,
                title: job.title,
                location: job.location,
                workplaceType: job.workplaceType,
                department: null,
                employmentType: null,
                publishedAt: null,
                experienceText: null,
                description: null,
                companyJobUrl: job.companyJobUrl,
                applyUrl: null,
                sourceCatalogUrl: job.sourceCatalogUrl,
                collectorId: job.collectorId,
                collectedAt: "2026-08-22 10:00:00.000+00",
                sourceLocation: null,
              },
            ]);
          }
          if (table === healthIncidents) return Promise.resolve([]);
          return Promise.resolve([]);
        },
      };
      return chain;
    }),
  };

  return { db: db as unknown as PersistenceDatabase, inserted };
}

function baseInput() {
  return {
    runId: "run_good",
    collectorId,
    companyId: "revrag-ai",
    sourceCatalogUrl,
    snapshotId: "j_good",
    rowCount: 1,
    validRowCount: 1,
    errorRowCount: 0,
    records: [job],
    startedAt: "2026-08-22T10:00:00.000Z",
    completedAt: "2026-08-22T10:00:01.000Z",
  } as const;
}

describe("PostgreSQL persistence repository", () => {
  it("commits a healthy run and canonical jobs inside one transaction", async () => {
    const { db, inserted } = fakeDatabase();
    const repository = createPostgresPersistenceRepository(db, {
      now: () => "2026-08-22T10:00:01.000Z",
    });

    const result = await repository.commitHealthySnapshot(baseInput());

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(inserted.map((entry) => entry.table)).toEqual([collectorRuns, canonicalJobs]);
    expect(result).toMatchObject({
      run: { runId: "run_good", status: "healthy" },
      canonicalJobCount: 1,
    });
  });

  it("stores a degraded run and incident without writing partial canonical jobs", async () => {
    const { db, inserted } = fakeDatabase();
    const repository = createPostgresPersistenceRepository(db, {
      now: () => "2026-08-22T10:00:01.000Z",
    });

    const result = await repository.recordUnhealthyRun({
      ...baseInput(),
      runId: "run_degraded",
      snapshotId: "j_degraded",
      status: "degraded",
      rowCount: 15,
      validRowCount: 10,
      errorRowCount: 5,
      errors: [{ code: "error_envelope", rowIndex: 10, message: "raw row rejected" }],
      health: {
        status: "degraded",
        reasons: ["5 rows rejected; token=should-not-persist"],
        metrics: {
          rowCount: 15,
          validRecordCount: 10,
          invalidRecordCount: 5,
          duplicateCount: 0,
          duplicateRate: 0,
          fieldCoverage: { jobId: 1 },
        },
        checks: {},
      },
      incident: {
        evidence: { sampleUrl: "https://www.revrag.ai/careers/role-1?token=secret" },
      },
    });

    expect(inserted.map((entry) => entry.table)).toEqual([collectorRuns, healthIncidents]);
    expect(inserted.some((entry) => entry.table === canonicalJobs)).toBe(false);
    expect(result.canonicalJobCount).toBe(0);
    const runValues = inserted[0]?.values as { healthSummary?: { reasons: string[] } };
    expect(runValues.healthSummary?.reasons[0]).toContain("[redacted]");
    const incidentValues = inserted[1]?.values as { evidence?: { sampleUrl?: string } };
    expect(incidentValues.evidence?.sampleUrl).toBe("https://www.revrag.ai/careers/role-1");
  });

  it("rolls back the healthy write path when canonical job insertion fails", async () => {
    const { db } = fakeDatabase({ failOnCanonicalInsert: true });
    const repository = createPostgresPersistenceRepository(db, {
      now: () => "2026-08-22T10:00:01.000Z",
    });

    await expect(repository.commitHealthySnapshot(baseInput())).rejects.toThrow(
      "simulated canonical insert failure",
    );
    // Drizzle owns the transaction boundary; a rejected callback causes the
    // database transaction to roll back both inserts.
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("reads the latest known-good jobs independently of a later degraded run", async () => {
    const { db } = fakeDatabase();
    const repository = createPostgresPersistenceRepository(db);

    const snapshot = await repository.getLastKnownGoodSnapshot(collectorId);

    expect(snapshot).toMatchObject({
      run: { runId: "run_good", status: "healthy" },
      jobs: [{
        jobId: "role-1",
        companyJobUrl: "https://www.revrag.ai/careers/role-1",
        collectedAt: "2026-08-22T10:00:00.000Z",
      }],
    });
  });
});
