import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type {
  PersistedEvidence,
  PersistedHealthSummary,
  PersistedSnapshotError,
  PersistenceIncidentStatus,
  PersistenceRunStatus,
} from "./contracts";

/**
 * Provider-neutral PostgreSQL storage. Statuses intentionally remain text
 * values so a later Neon/Supabase/self-hosted choice does not change the
 * application contract or require provider-specific migrations.
 */
export const collectorRuns = pgTable(
  "collector_runs",
  {
    runId: text("run_id").primaryKey(),
    collectorId: text("collector_id").notNull(),
    companyId: text("company_id").notNull(),
    sourceCatalogUrl: text("source_catalog_url").notNull(),
    snapshotId: text("snapshot_id").notNull(),
    status: text("status").$type<PersistenceRunStatus>().notNull(),
    rowCount: integer("row_count").notNull(),
    validRowCount: integer("valid_row_count").notNull(),
    errorRowCount: integer("error_row_count").notNull(),
    healthSummary: jsonb("health_summary").$type<PersistedHealthSummary | null>(),
    errors: jsonb("errors").$type<readonly PersistedSnapshotError[] | null>(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("collector_runs_snapshot_id_unique").on(table.snapshotId),
    index("collector_runs_collector_created_idx").on(table.collectorId, table.createdAt),
    index("collector_runs_collector_status_idx").on(table.collectorId, table.status),
  ],
);

export const canonicalJobs = pgTable(
  "canonical_jobs",
  {
    runId: text("run_id")
      .notNull()
      .references(() => collectorRuns.runId, { onDelete: "cascade" }),
    companyId: text("company_id").notNull(),
    jobId: text("job_id").notNull(),
    title: text("title").notNull(),
    location: text("location").notNull(),
    workplaceType: text("workplace_type").notNull(),
    department: text("department"),
    employmentType: text("employment_type"),
    publishedAt: text("published_at"),
    experienceText: text("experience_text"),
    description: text("description"),
    companyJobUrl: text("company_job_url").notNull(),
    applyUrl: text("apply_url"),
    sourceCatalogUrl: text("source_catalog_url").notNull(),
    collectorId: text("collector_id").notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true, mode: "string" }).notNull(),
    sourceLocation: text("source_location"),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.companyId, table.jobId] }),
    index("canonical_jobs_run_idx").on(table.runId),
    index("canonical_jobs_company_job_idx").on(table.companyId, table.jobId),
  ],
);

export const healthIncidents = pgTable(
  "health_incidents",
  {
    incidentId: text("incident_id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => collectorRuns.runId, { onDelete: "cascade" }),
    collectorId: text("collector_id").notNull(),
    snapshotId: text("snapshot_id").notNull(),
    status: text("status").$type<PersistenceIncidentStatus>().notNull(),
    reasons: jsonb("reasons").$type<readonly string[]>().notNull(),
    evidence: jsonb("evidence").$type<PersistedEvidence | null>(),
    healPrompt: text("heal_prompt"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    index("health_incidents_collector_created_idx").on(table.collectorId, table.createdAt),
    index("health_incidents_run_idx").on(table.runId),
  ],
);

export const persistenceSchema = {
  collectorRuns,
  canonicalJobs,
  healthIncidents,
};

export type CollectorRunRow = typeof collectorRuns.$inferSelect;
export type CanonicalJobRow = typeof canonicalJobs.$inferSelect;
export type HealthIncidentRow = typeof healthIncidents.$inferSelect;
