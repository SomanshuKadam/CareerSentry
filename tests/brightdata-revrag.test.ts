import { describe, expect, it } from "vitest";

import {
  BrightDataIngestionError,
  evaluateRevRagSnapshot,
  mapRevRagRows,
  revRagRowSchema,
} from "../src/lib/brightdata";
import {
  revragErrorRows,
  revRagMetadata,
  revragValidRow,
  revragValidRows,
  revragHealedRows,
} from "./fixtures/revrag";

describe("RevRag raw ingestion", () => {
  it("maps the observed fields and uses the first-party product page as the company URL", () => {
    const [record] = mapRevRagRows(revragValidRows.slice(0, 1), revRagMetadata);

    expect(record).toMatchObject({
      companyId: "revrag-ai",
      jobId: "role-1",
      title: "AI Engineer 1",
      department: "Engineering",
      location: "Bengaluru, India",
      sourceLocation: "Bangalore, India",
      employmentType: "Full-time",
      experienceText: "2+ years",
      description: "Build RevRag systems for role 1.",
      companyJobUrl: "https://www.revrag.ai/careers/role-1",
    });
    expect(record).not.toHaveProperty("applyUrl");
    expect(record).not.toHaveProperty("job_url");
    expect(record).not.toHaveProperty("product_page_url");
  });

  it("prefers an explicit company URL while still enforcing its provenance", () => {
    const row = {
      ...revragValidRow(1),
      company_job_url: "https://www.revrag.ai/careers/role-1-explicit",
    };

    expect(mapRevRagRows([row], revRagMetadata)[0]?.companyJobUrl).toBe(
      "https://www.revrag.ai/careers/role-1-explicit",
    );
  });

  it("derives jobId from a validated final company URL when the healed shape omits it", () => {
    const records = mapRevRagRows(revragHealedRows, revRagMetadata);

    expect(records).toHaveLength(10);
    expect(records.map((record) => record.jobId)).toEqual([
      "healed-role-1",
      "healed-role-2",
      "healed-role-3",
      "healed-role-4",
      "healed-role-5",
      "healed-role-6",
      "healed-role-7",
      "healed-role-8",
      "healed-role-9",
      "healed-role-10",
    ]);
    expect(new Set(records.map((record) => record.jobId)).size).toBe(10);
    expect(new Set(records.map((record) => record.companyJobUrl)).size).toBe(10);
    expect(records.every((record) => !Object.prototype.hasOwnProperty.call(record, "applyUrl"))).toBe(
      true,
    );
  });

  it("rejects an insecure, off-origin, or off-path product-page fallback", () => {
    const cases = [
      {
        row: { ...revragValidRow(1), product_page_url: "http://www.revrag.ai/careers/role-1" },
        message: /must use HTTPS/,
        code: "https_required",
      },
      {
        row: { ...revragValidRow(1), product_page_url: "https://jobs.example.test/careers/role-1" },
        message: /origin .* is not allowed/,
        code: "origin_not_allowed",
      },
      {
        row: { ...revragValidRow(1), product_page_url: "https://www.revrag.ai/about/role-1" },
        message: /path .* is not allowed/,
        code: "path_not_allowed",
      },
    ] as const;

    for (const testCase of cases) {
      expect(() => mapRevRagRows([testCase.row], revRagMetadata)).toThrow(
        testCase.message,
      );
      try {
        mapRevRagRows([testCase.row], revRagMetadata);
      } catch (error) {
        expect(error).toMatchObject({ code: testCase.code, rowIndex: 0 });
      }
    }
  });

  it("rejects error envelopes before they can satisfy the job schema", () => {
    const envelope = revragErrorRows[0];

    expect(revRagRowSchema.safeParse(envelope).success).toBe(false);
    expect(() => mapRevRagRows([envelope], revRagMetadata)).toThrow(
      BrightDataIngestionError,
    );
    try {
      mapRevRagRows([envelope], revRagMetadata);
    } catch (error) {
      expect(error).toMatchObject({ code: "error_envelope", rowIndex: 0 });
    }
  });

  it("marks ten valid rows plus five error envelopes as degraded", () => {
    const snapshot = evaluateRevRagSnapshot(
      [...revragValidRows, ...revragErrorRows],
      revRagMetadata,
    );

    expect(snapshot.status).toBe("degraded");
    expect(snapshot.healthy).toBe(false);
    expect(snapshot.rowCount).toBe(15);
    expect(snapshot.validRowCount).toBe(10);
    expect(snapshot.errorRowCount).toBe(5);
    expect(snapshot.records).toHaveLength(10);
    expect(snapshot.errors.map((error) => error.rowIndex)).toEqual([10, 11, 12, 13, 14]);
    expect(snapshot.errors.every((error) => error.code === "error_envelope")).toBe(true);
    expect(snapshot.health.status).toBe("degraded");
    expect(snapshot.health.checks.schema.status).toBe("fail");
    expect(snapshot.health.metrics.rowCount).toBe(15);
    expect(snapshot.health.metrics.validRecordCount).toBe(10);
    expect(snapshot.health.metrics.invalidRecordCount).toBe(5);
    expect(snapshot.health.reasons.join(" ")).toMatch(/5 raw row/);
  });

  it("rejects a snapshot containing no valid rows", () => {
    const snapshot = evaluateRevRagSnapshot(revragErrorRows, revRagMetadata);

    expect(snapshot.status).toBe("rejected");
    expect(snapshot.rejected).toBe(true);
    expect(snapshot.validRowCount).toBe(0);
    expect(snapshot.errorRowCount).toBe(5);
    expect(snapshot.health.status).toBe("degraded");
  });
});
