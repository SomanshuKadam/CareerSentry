import { describe, expect, it } from "vitest";

import rejectedPreview from "../docs/evidence/layout-b-api-heal-rejected.json";
import verifiedRecovery from "../docs/evidence/layout-b-codex-assisted-success.json";
import {
  BrightDataIngestionError,
  mapScraperStudioRows,
  proposeSchemaMappings,
} from "../src/lib/brightdata";

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
    employment_type: "Full-time",
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
    employment_type: "Full-time",
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

  it("maps the approved Bright Data schema aliases into the same downstream shape", () => {
    expect(rejectedPreview.preview_semantics).toContain("sample_output_only");

    const records = mapScraperStudioRows(rejectedPreview.preview_rows, metadata);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      jobId: "CS-101",
      title: "Backend Engineer",
      department: "Engineering",
      companyJobUrl:
        "https://career-sentry.vercel.app/demo-target/jobs/CS-101",
    });
    expect(records[0]).not.toHaveProperty("product_page_url");
  });

  it("validates the complete post-approval Layout-B recovery through the adapter", () => {
    expect(verifiedRecovery.status).toBe("layout_b_recovery_verified");
    expect(verifiedRecovery.post_approval_verification.row_count).toBe(3);

    const records = mapScraperStudioRows(
      verifiedRecovery.post_approval_verification.rows,
      metadata,
    );

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.jobId)).toEqual([
      "CS-101",
      "CS-102",
      "CS-103",
    ]);
    expect(records.every((record) => record.employmentType === "Full-time")).toBe(true);
    expect(verifiedRecovery.fixture_semantic_disclosure.old_detail_page_field).toContain(
      "Hybrid, Remote, Onsite",
    );
  });

  it("rejects conflicting approved aliases instead of guessing", () => {
    const conflictingRow = {
      ...rejectedPreview.preview_rows[0],
      job_id_value: "CS-101",
      role_id: "CS-999",
    };

    expect(() => mapScraperStudioRows([conflictingRow], metadata)).toThrow(
      BrightDataIngestionError,
    );
    expect(() => mapScraperStudioRows([conflictingRow], metadata)).toThrow(
      /conflicting requisition values/,
    );
  });

  it("does not infer an unknown label as a canonical field", () => {
    const unknownDepartmentRow = { ...layoutBContractRows[0] } as Record<string, unknown>;
    delete unknownDepartmentRow.department;
    unknownDepartmentRow.business_unit = "Engineering";

    expect(() => mapScraperStudioRows([unknownDepartmentRow], metadata)).toThrow(
      /department/,
    );
  });

  it("proposes semantic mappings for review and applies them only when approved", () => {
    const semanticRow = { ...layoutBContractRows[0] } as Record<string, unknown>;
    delete semanticRow.department;
    semanticRow.function = "Engineering";

    const proposals = proposeSchemaMappings([semanticRow]);
    expect(proposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceField: "function",
          targetField: "department",
          decision: "review",
        }),
      ]),
    );
    expect(() => mapScraperStudioRows([semanticRow], metadata)).toThrow(/department/);

    const records = mapScraperStudioRows([semanticRow], metadata, {
      approvedSchemaMappings: [
        { sourceField: "function", targetField: "department" },
      ],
    });
    expect(records[0]?.department).toBe("Engineering");
  });
});
