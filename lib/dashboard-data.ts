import "server-only";

import { getServerDashboardReadModel } from "../src/lib/dashboard/server";
import {
  demoCollectors,
  demoCompanies,
  demoJobs,
  demoRuns,
  type DemoJob,
} from "./demo-data";

export async function getDashboardData() {
  const model = await getServerDashboardReadModel();
  const savedJobs = new Map(demoJobs.map((job) => [job.jobId, job]));
  const jobs: DemoJob[] = model.records.map((record) => {
    const saved = savedJobs.get(record.jobId);
    return {
      companyId: record.companyId,
      company: "RevRag AI",
      companyMark: "R",
      companyTone: "violet",
      jobId: record.jobId,
      title: record.title,
      location: record.sourceLocation ?? record.location,
      workplaceType: record.workplaceType,
      department: record.department ?? "Not published by source",
      employmentType: record.employmentType ?? "Not published by source",
      publishedAt: record.publishedAt ?? "Not published by source",
      collectedAt: model.source.label,
      companyJobUrl: record.companyJobUrl,
      sourceCatalogUrl: record.sourceCatalogUrl,
      collectorId: record.collectorId,
      state: "active",
      matchScore: saved?.matchScore ?? 50,
      matchReasons: saved?.matchReasons ?? ["Verified source role"],
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
