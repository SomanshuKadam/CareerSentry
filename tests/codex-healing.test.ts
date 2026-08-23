import { describe, expect, it } from "vitest";

import codexInput from "../docs/evidence/layout-b-codex-input.json";
import {
  parseCodexHealingBundle,
  validateCodexHealingProposal,
} from "../src/lib/brightdata";

const bundle = parseCodexHealingBundle(codexInput);

const validProposal = {
  proposalVersion: "1",
  evidenceType: "codex_healing_proposal",
  status: "proposal",
  collectorId: bundle.collectorId,
  targetUrl: bundle.targetUrl,
  repairScope: "selector_and_schema",
  diagnosis: "Layout B changed the listing selectors, and the proposed output also used Bright Data aliases.",
  overallConfidence: 0.86,
  brightDataPrompt:
    "Modify extraction logic only. Iterate section.role-tile and preserve exactly the six existing output fields. Map Requisition to job_id_value, h2 a to title/company_job_url, .role-tile__team to department, and the labeled B metadata values to location and employment_type. Do not change navigation or output schema.",
  selectorChanges: [
    {
      area: "listing container",
      before: ".job-card",
      after: "section.role-tile",
      reason: "The B page contains role-tile elements and no job-card elements.",
    },
  ],
  schemaMappings: [
    {
      sourceField: "role_id",
      targetField: "job_id_value",
      confidence: 0.99,
      decision: "auto",
      reason: "Observed exact requisition alias in the representative preview.",
      evidence: ["preview field role_id has value CS-101"],
    },
    {
      sourceField: "team",
      targetField: "department",
      confidence: 0.99,
      decision: "auto",
      reason: "Observed exact team alias in the representative preview.",
      evidence: ["preview field team has value Engineering"],
    },
    {
      sourceField: "official_role_url",
      targetField: "company_job_url",
      confidence: 0.99,
      decision: "auto",
      reason: "Observed exact official-role URL alias in the representative preview.",
      evidence: ["preview field official_role_url is same-origin HTTPS"],
    },
  ],
  preservesCanonicalContract: true,
  fullRunVerificationRequired: true,
  verificationChecks: [
    "Run the same Collector ID once after approval against layout B.",
    "Require exactly CS-101, CS-102, and CS-103 with valid canonical fields.",
  ],
  limitations: [
    "The local proposal cannot prove full enumeration or post-approval recovery.",
  ],
  executionPolicy: {
    localOnly: true,
    brightDataMutation: false,
    databaseMutation: false,
    requiresHumanApproval: true,
  },
} as const;

describe("local Codex healing proposal boundary", () => {
  it("parses the sanitized Layout-B evidence bundle", () => {
    expect(bundle.collectorId).toBe("c_mt5mfwuv2910ltr23s");
    expect(bundle.failure.observedRows).toBe(0);
    expect(bundle.constraints.brightDataMutationAuthorized).toBe(false);
  });

  it("marks a selector-plus-schema proposal reviewable, never approved", () => {
    const result = validateCodexHealingProposal(validProposal, bundle);

    expect(result).toMatchObject({
      status: "reviewable",
      requiresHumanApproval: true,
      proposal: { status: "proposal" },
    });
    expect(result.issues).toEqual([]);
  });

  it("rejects a schema-only proposal for a zero-row failure", () => {
    const result = validateCodexHealingProposal(
      { ...validProposal, repairScope: "schema_mapping_only", selectorChanges: [] },
      bundle,
    );

    expect(result.status).toBe("rejected");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("zero-row failure"),
        expect.stringContaining("requires at least one"),
      ]),
    );
  });

  it("rejects a proposal aimed at another collector", () => {
    const result = validateCodexHealingProposal(
      { ...validProposal, collectorId: "c_othercollector" },
      bundle,
    );

    expect(result.status).toBe("rejected");
    expect(result.issues).toContain(
      "Proposal Collector ID does not match the evidence bundle",
    );
  });

  it("allows semantic mappings only as review-level suggestions", () => {
    const semanticProposal = {
      ...validProposal,
      schemaMappings: [
        {
          sourceField: "team",
          targetField: "department",
          confidence: 0.84,
          decision: "review",
          reason: "The field may be an organizational grouping.",
          evidence: ["preview field team has value Engineering"],
        },
      ],
    } as const;
    const result = validateCodexHealingProposal(semanticProposal, bundle);

    expect(result.status).toBe("reviewable");
  });

  it("rejects an automatic mapping that is not an observed allowlisted alias", () => {
    const unsafeProposal = {
      ...validProposal,
      schemaMappings: [
        {
          sourceField: "team",
          targetField: "location",
          confidence: 0.99,
          decision: "auto",
          reason: "The model guessed the field meaning.",
          evidence: ["preview field team has value Engineering"],
        },
      ],
    } as const;
    const result = validateCodexHealingProposal(unsafeProposal, bundle);

    expect(result.status).toBe("rejected");
    expect(result.issues).toContain(
      "Automatic mapping is not an observed allowlisted alias: team -> location",
    );
  });
});
