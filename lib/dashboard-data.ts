import "server-only";

import { getServerDashboardReadModel } from "../src/lib/dashboard/server";
import {
  demoCollectors,
  demoCompanies,
  demoRuns,
  type DemoJob,
} from "./demo-data";

export async function getDashboardData() {
  const model = await getServerDashboardReadModel();
  const jobs: DemoJob[] = model.records.map((record) => {
    return {
      jobId: record.jobId,
      title: record.title,
      location: record.sourceLocation ?? record.location,
      department: record.department ?? "Not published by source",
      employmentType: record.employmentType ?? "Not published by source",
      companyJobUrl: record.companyJobUrl,
      sourceCatalogUrl: record.sourceCatalogUrl,
    };
  });

  const companies = demoCompanies.map((company) => company.id === "revrag-ai"
    ? {
        ...company,
        jobs: jobs.length,
        coverage: Math.round(model.health.metrics.fieldCoverage.jobId * 100),
        lastChecked: model.source.label,
        status: model.health.healthy ? "healthy" as const : "degraded" as const,
        note: model.source.note,
      }
    : company);

  const collectors = demoCollectors.map((collector) => collector.id === model.collector.collectorId
    ? {
        ...collector,
        rowCount: jobs.length,
        previousRowCount: jobs.length,
        fieldCoverage: Math.round(model.health.metrics.fieldCoverage.jobId * 100),
        duplicateRate: model.health.metrics.duplicateRate * 100,
        lastRun: model.source.label,
        status: model.health.healthy ? "healthy" as const : "degraded" as const,
        schedule: model.source.isPersisted ? "Protected API / durable" : "No persistent schedule",
      }
    : collector);

  const latestRun = model.storage.latestRun;
  const runs = latestRun
    ? [{
        id: latestRun.runId,
        time: latestRun.completedAt ?? latestRun.createdAt,
        collector: "RevRag AI Discovery / persisted",
        collectorId: latestRun.collectorId,
        status: latestRun.status === "healthy" ? "Healthy" : latestRun.status === "degraded" ? "Degraded" : "Rejected",
        rows: latestRun.rowCount,
        delta: "—",
        duration: "Not recorded",
        trigger: "Protected Collector-ID API",
      }, ...demoRuns.filter((run) => run.id !== latestRun.runId)]
    : demoRuns;

  return {
    model,
    jobs,
    companies,
    collectors,
    runs,
    sourceLabel: model.source.label,
    sourceNote: model.source.note,
  };
}
