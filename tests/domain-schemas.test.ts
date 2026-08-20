import { describe, expect, it } from "vitest";
import { jobRecordSchema, parseJobRecord, safeParseJobRecord } from "../src/lib/domain";
import { backendJob } from "./fixtures/jobs";

describe("JobRecord contract", () => {
  it("parses a canonical record and preserves optional source metadata", () => {
    const record = parseJobRecord({
      ...backendJob,
      sourceLocation: "Bangalore, India",
    });

    expect(record.jobId).toBe("REQ-100");
    expect(record.sourceLocation).toBe("Bangalore, India");
  });

  it("rejects missing required fields, invalid links, and unknown contract fields", () => {
    const missingTitle = { ...backendJob, title: "" };
    const invalidUrl = { ...backendJob, companyJobUrl: "not-a-url" };
    const unexpectedField = { ...backendJob, unexpectedField: true };

    expect(jobRecordSchema.safeParse(missingTitle).success).toBe(false);
    expect(safeParseJobRecord(invalidUrl).success).toBe(false);
    expect(safeParseJobRecord(unexpectedField).success).toBe(false);
  });

  it("allows an honest unpublished-date label without inventing a date", () => {
    const record = parseJobRecord({ ...backendJob, publishedAt: "date not published" });
    expect(record.publishedAt).toBe("date not published");
  });
});
