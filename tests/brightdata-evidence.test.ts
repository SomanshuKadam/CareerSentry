import { describe, expect, it } from "vitest";

import degradedLayoutB from "../docs/evidence/layout-b-degraded.json";
import recoveredLayoutA from "../docs/evidence/layout-a-recovered.json";
import { mapScraperStudioRows } from "../src/lib/brightdata";
import { evaluateHealth } from "../src/lib/domain";

const metadata = {
  companyId: "career-sentry-fixture",
  sourceCatalogUrl: "https://career-sentry.vercel.app/demo-target?layout=a",
  collectorId: "c_mt1wzptjco00s7w0p",
  collectedAt: "2026-08-21T00:00:00.000Z",
  allowedOrigins: ["https://career-sentry.vercel.app"],
  workplaceType: "unknown" as const,
};

describe("sanitized Scraper Studio evidence", () => {
  it("normalizes the recovered layout-A dataset into three canonical jobs", () => {
    const records = mapScraperStudioRows(recoveredLayoutA, metadata);

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.jobId).sort()).toEqual([
      "CS-101",
      "CS-102",
      "CS-103",
    ]);
    expect(new Set(records.map((record) => record.companyJobUrl)).size).toBe(3);
  });

  it("degrades the empty layout-B run against the recovered baseline", () => {
    const baseline = mapScraperStudioRows(recoveredLayoutA, metadata);
    const current = mapScraperStudioRows(degradedLayoutB, {
      ...metadata,
      sourceCatalogUrl: "https://career-sentry.vercel.app/demo-target?layout=b",
    });
    const health = evaluateHealth(current, baseline);

    expect(current).toEqual([]);
    expect(health.status).toBe("degraded");
    expect(health.checks.rowCount).toMatchObject({
      status: "fail",
      value: 0,
      baseline: 3,
    });
  });
});
