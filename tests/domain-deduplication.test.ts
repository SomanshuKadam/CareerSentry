import { describe, expect, it } from "vitest";
import {
  canonicalizeJobUrl,
  deduplicateJobRecords,
} from "../src/lib/domain";
import { backendJob, frontendJob } from "./fixtures/jobs";

describe("job deduplication", () => {
  it("canonicalizes fragments and tracking query parameters", () => {
    expect(
      canonicalizeJobUrl("HTTPS://Careers.Example.com/jobs/REQ-100/?utm_source=feed#details"),
    ).toBe("https://careers.example.com/jobs/REQ-100");
  });

  it("uses company job ID before URL and preserves distinct requisitions", () => {
    const sameId = {
      ...backendJob,
      title: "Same requisition with a refreshed URL",
      companyJobUrl: "https://careers.example.com/jobs/REQ-100?source=updated",
    };
    const sameUrl = {
      ...frontendJob,
      jobId: "REQ-201",
      companyJobUrl: "https://careers.example.com/jobs/REQ-100/",
    };
    const result = deduplicateJobRecords([backendJob, sameId, sameUrl, frontendJob]);

    expect(result.records.map((record) => record.jobId)).toEqual(["REQ-100", "REQ-200"]);
    expect(result.duplicateCount).toBe(2);
    expect(result.byReason["company-job-id"]).toBe(1);
    expect(result.byReason["company-job-url"]).toBe(1);
  });
});
