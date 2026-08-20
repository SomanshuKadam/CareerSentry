import { describe, expect, it } from "vitest";
import { diffJobLifecycle } from "../src/lib/domain";
import {
  backendJob,
  frontendJob,
  newDataJob,
  updatedBackendJob,
} from "./fixtures/jobs";

describe("job lifecycle diff", () => {
  it("detects unchanged, updated, new, and closed records", () => {
    const diff = diffJobLifecycle(
      [backendJob, frontendJob],
      [updatedBackendJob, newDataJob],
    );

    expect(diff.counts).toEqual({ new: 1, updated: 1, closed: 1, unchanged: 0 });
    expect(diff.updatedJobs[0]?.jobId).toBe("REQ-100");
    expect(diff.updatedJobs[0]?.location).toBe("Bengaluru, India");
    expect(diff.newJobs[0]?.jobId).toBe("REQ-300");
    expect(diff.closedJobs[0]?.jobId).toBe("REQ-200");
    // Bangalore and Bengaluru are the same normalized location, so only the
    // substantive description change should produce a lifecycle update.
    expect(diff.changes.find((change) => change.type === "updated")?.changedFields).toEqual([
      "description",
    ]);
  });

  it("does not mark a new collection timestamp as an update", () => {
    const current = { ...backendJob, collectedAt: "2026-08-20T12:00:00.000Z" };
    const diff = diffJobLifecycle([backendJob], [current]);

    expect(diff.counts).toEqual({ new: 0, updated: 0, closed: 0, unchanged: 1 });
  });
});
