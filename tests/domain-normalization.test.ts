import { describe, expect, it } from "vitest";
import { normalizeJobRecord, normalizeLocation, normalizeLocationWithSource } from "../src/lib/domain";
import { backendJob } from "./fixtures/jobs";

describe("location normalization", () => {
  it("maps Bangalore and Bengaluru to the same canonical city", () => {
    expect(normalizeLocation(" Bangalore,   Karnataka ")).toBe("Bengaluru, Karnataka");
    expect(normalizeLocation("BENGALURU, Karnataka")).toBe("Bengaluru, Karnataka");
  });

  it("retains the visible source label when a record changes", () => {
    const location = normalizeLocationWithSource("Bangalore, India");
    expect(location).toEqual({
      value: "Bengaluru, India",
      source: "Bangalore, India",
      changed: true,
    });

    const normalized = normalizeJobRecord(backendJob);
    expect(normalized.location).toBe("Bengaluru, India");
    expect(normalized.sourceLocation).toBe("Bangalore, India");
  });
});
