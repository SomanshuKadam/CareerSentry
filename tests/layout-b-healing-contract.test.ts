import { describe, expect, it } from "vitest";

import rejectedPreview from "../docs/evidence/layout-b-api-heal-rejected.json";
import { BrightDataIngestionError, mapScraperStudioRows } from "../src/lib/brightdata";

const metadata = {
  companyId: "career-sentry-fixture",
  sourceCatalogUrl: "https://career-sentry.vercel.app/demo-target/live",
  collectorId: "c_mt5mfwuv2910ltr23s",
  collectedAt: "2026-08-23T00:00:00.000Z",
  allowedOrigins: ["https://career-sentry.vercel.app"],
  workplaceType: "unknown" as const,
};

const layoutBContractRows = [
  {
    job_id_value: "CS-101",
    title: "Backend Engineer",
    location: "Bangalore, Karnataka, India",
    department: "Engineering",
    employment_type: "Hybrid",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-101",
  },
  {
    job_id_value: "CS-102",
    title: "Software Engineer II",
    location: "Remote, India",
    department: "Platform",
    employment_type: "Full-time",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-102",
  },
  {
    job_id_value: "CS-103",
    title: "Data Quality Engineer",
    location: "Bengaluru, Karnataka, India",
    department: "Data",
    employment_type: "Onsite",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-103",
  },
] as const;

describe("next layout-B healing contract", () => {
  it("accepts the selector-only B output without changing downstream shape", () => {
    const records = mapScraperStudioRows(layoutBContractRows, metadata);

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.jobId)).toEqual(["CS-101", "CS-102", "CS-103"]);
    expect(records.map((record) => record.department)).toEqual([
      "Engineering",
      "Platform",
      "Data",
    ]);
  });

  it("rejects the alternate schema proposed by the last preview", () => {
    expect(rejectedPreview.preview_semantics).toContain("sample_output_only");

    expect(() => mapScraperStudioRows(rejectedPreview.preview_rows, metadata)).toThrow(
      BrightDataIngestionError,
    );
    expect(() => mapScraperStudioRows(rejectedPreview.preview_rows, metadata)).toThrow(
      /missing both requisition fields job_id and job_id_value/,
    );
  });
});
