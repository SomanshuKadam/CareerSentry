import { describe, expect, it } from "vitest";
import { evaluateHealth } from "../src/lib/domain";
import { backendJob, frontendJob } from "./fixtures/jobs";

describe("collector health", () => {
  it("accepts a complete run with explicit navigation evidence", () => {
    const result = evaluateHealth([backendJob, frontendJob], [backendJob, frontendJob], {
      paginationComplete: true,
      details: [
        { resolved: true, hasActiveContent: true, applicationActionPresent: true },
      ],
    });

    expect(result.status).toBe("healthy");
    expect(result.reasons).toEqual([]);
    expect(result.metrics.duplicateRate).toBe(0);
  });

  it("degrades for a silent empty run and missing required fields", () => {
    const result = evaluateHealth(
      [
        {
          ...backendJob,
          title: "",
          location: "",
        },
      ],
      [backendJob, frontendJob],
    );

    expect(result.status).toBe("degraded");
    expect(result.checks.rowCount.status).toBe("fail");
    expect(result.checks.requiredFieldCoverage.status).toBe("fail");
    expect(result.checks.schema.status).toBe("fail");
  });

  it("degrades when pagination or detail evidence shows an extraction failure", () => {
    const result = evaluateHealth([backendJob], [backendJob], {
      paginationComplete: false,
      details: [{ resolved: true, hasActiveContent: false }],
      applicationActionsPresent: false,
    });

    expect(result.status).toBe("degraded");
    expect(result.checks.enumeration.status).toBe("fail");
    expect(result.checks.details.status).toBe("fail");
    expect(result.checks.applicationActions.status).toBe("fail");
  });
});
