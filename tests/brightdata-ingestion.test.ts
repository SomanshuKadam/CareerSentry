import { describe, expect, it } from "vitest";

import {
  BrightDataIngestionError,
  mapScraperStudioRows,
  type BrightDataIngestionMetadata,
} from "../src/lib/brightdata";

const metadata: BrightDataIngestionMetadata = {
  companyId: "fixture-company",
  sourceCatalogUrl: "https://career-sentry.vercel.app/demo-target?layout=a",
  collectorId: "c_fixture_discovery",
  collectedAt: "2026-08-21T08:00:00.000Z",
  allowedOrigins: ["https://career-sentry.vercel.app"],
  workplaceType: "unknown",
};

const rows = [
  {
    job_id: "CS-101",
    title: "Backend Software Engineer",
    location: "Bangalore, Karnataka",
    department: "Engineering",
    employment_type: "Full-time",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-101",
    product_page_url: "https://scraper-studio.example.test/product-page",
    input: "https://career-sentry.vercel.app/demo-target?layout=a",
  },
  {
    job_id: "CS-102",
    title: "Platform Software Engineer",
    location: "Bengaluru, Karnataka",
    department: "Platform",
    employment_type: "Full-time",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-102",
    product_page_url: "https://scraper-studio.example.test/product-page",
    input: "https://career-sentry.vercel.app/demo-target?layout=a",
  },
  {
    job_id: "CS-103",
    title: "Site Reliability Engineer",
    location: "Remote India",
    department: "Infrastructure",
    employment_type: "Full-time",
    company_job_url: "https://career-sentry.vercel.app/demo-target/jobs/CS-103",
    product_page_url: "https://scraper-studio.example.test/product-page",
    input: "https://career-sentry.vercel.app/demo-target?layout=a",
  },
] as const;

describe("Scraper Studio raw ingestion", () => {
  it("maps a valid three-row dataset and ignores platform metadata", () => {
    const records = mapScraperStudioRows(rows, metadata);

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.jobId)).toEqual(["CS-101", "CS-102", "CS-103"]);
    expect(records[0]).toMatchObject({
      companyId: "fixture-company",
      title: "Backend Software Engineer",
      location: "Bengaluru, Karnataka",
      sourceLocation: "Bangalore, Karnataka",
      department: "Engineering",
      employmentType: "Full-time",
      companyJobUrl: "https://career-sentry.vercel.app/demo-target/jobs/CS-101",
      sourceCatalogUrl: metadata.sourceCatalogUrl,
      collectorId: metadata.collectorId,
    });
    expect(records[0]).not.toHaveProperty("product_page_url");
    expect(records[0]).not.toHaveProperty("input");
  });

  it("maps the observed legacy job_id_value schema to canonical jobId", () => {
    const legacyRow = {
      ...rows[0],
      job_id: undefined,
      job_id_value: "CS-101",
    };

    expect(mapScraperStudioRows([legacyRow], metadata)[0]?.jobId).toBe("CS-101");
  });

  it("rejects conflicting primary and legacy requisition values", () => {
    const conflictingRow = {
      ...rows[0],
      job_id: "CS-101",
      job_id_value: "CS-999",
    };

    expect(() => mapScraperStudioRows([conflictingRow], metadata)).toThrow(
      BrightDataIngestionError,
    );
    expect(() => mapScraperStudioRows([conflictingRow], metadata)).toThrow(/conflicting/);
    try {
      mapScraperStudioRows([conflictingRow], metadata);
    } catch (error) {
      expect(error).toMatchObject({ code: "conflicting_requisition", rowIndex: 0 });
    }
  });

  it("rejects a row with a missing expected business field", () => {
    const missingDepartment = { ...rows[0] } as Record<string, unknown>;
    delete missingDepartment.department;

    expect(() => mapScraperStudioRows([missingDepartment], metadata)).toThrow(
      /department/,
    );
  });

  it("rejects a row with no requisition identifier at all", () => {
    const missingRequisition = { ...rows[0] } as Record<string, unknown>;
    delete missingRequisition.job_id;

    expect(() => mapScraperStudioRows([missingRequisition], metadata)).toThrow(
      /missing both requisition fields job_id and job_id_value/,
    );
  });

  it("rejects an HTTPS URL outside the caller-supplied origin allow-list", () => {
    const offOrigin = {
      ...rows[0],
      company_job_url: "https://jobs.other.example/CS-101",
    };

    expect(() => mapScraperStudioRows([offOrigin], metadata)).toThrow(
      /origin .* is not allowed/,
    );
    try {
      mapScraperStudioRows([offOrigin], metadata);
    } catch (error) {
      expect(error).toMatchObject({ code: "origin_not_allowed", rowIndex: 0 });
    }
  });

  it("requires HTTPS even when an origin is allowed by hostname", () => {
    const insecure = {
      ...rows[0],
      company_job_url: "http://career-sentry.vercel.app/demo-target/jobs/CS-101",
    };

    expect(() => mapScraperStudioRows([insecure], metadata)).toThrow(/must use HTTPS/);
  });
});
