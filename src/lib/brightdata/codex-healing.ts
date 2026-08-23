import { z } from "zod";

import {
  CANONICAL_SCRAPER_FIELDS,
  isKnownAutomaticSchemaMapping,
  proposeSchemaMappings,
  type CanonicalScraperField,
  type SchemaMappingDecision,
} from "./schema-mapping";

const canonicalFieldSchema = z.enum([
  "job_id_value",
  "title",
  "location",
  "department",
  "employment_type",
  "company_job_url",
] as const);

const safeUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", "Expected an HTTPS URL");

const safeScalarSchema = z.union([
  z.string().max(2_000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const evidenceRowSchema = z.record(safeScalarSchema);
const evidenceRowsSchema = z.array(evidenceRowSchema).max(20);
const evidenceTextListSchema = z.array(z.string().trim().min(1).max(500)).max(50);

const canonicalFieldsSchema = z
  .array(canonicalFieldSchema)
  .length(CANONICAL_SCRAPER_FIELDS.length)
  .refine(
    (fields) =>
      fields.every((field, index) => field === CANONICAL_SCRAPER_FIELDS[index]),
    "Canonical fields must preserve the CareerSentry contract and order",
  );

export const codexHealingBundleSchema = z
  .object({
    bundleVersion: z.literal("1"),
    evidenceType: z.literal("codex_healing_input"),
    createdAt: z.string().datetime(),
    collectorId: z.string().regex(/^c_[a-z0-9]+$/),
    targetUrl: safeUrlSchema,
    source: z
      .object({
        kind: z.enum(["owned_fixture", "external_public_catalog"]),
        label: z.string().trim().min(1).max(200),
      })
      .strict(),
    failure: z
      .object({
        kind: z.enum([
          "zero_rows_after_markup_change",
          "schema_drift",
          "required_fields",
          "count_anomaly",
        ]),
        baselineRows: z.number().int().nonnegative(),
        observedRows: z.number().int().nonnegative(),
        summary: z.string().trim().min(1).max(1_000),
      })
      .strict(),
    canonicalFields: canonicalFieldsSchema,
    knownGoodRows: evidenceRowsSchema,
    observedRows: evidenceRowsSchema,
    representativePreviewRows: evidenceRowsSchema,
    diffSummary: z
      .object({
        changedParserSelectors: evidenceTextListSchema,
        finalEmittedFields: evidenceTextListSchema,
        rejectedReasons: evidenceTextListSchema,
      })
      .strict(),
    observations: z
      .object({
        knownGoodSelectors: evidenceTextListSchema,
        changedSelectors: evidenceTextListSchema,
        changedMarkupFacts: evidenceTextListSchema,
      })
      .strict(),
    constraints: z
      .object({
        secretsRedacted: z.literal(true),
        brightDataMutationAuthorized: z.literal(false),
        databaseMutationAuthorized: z.literal(false),
        requiresHumanApproval: z.literal(true),
        maxPromptCharacters: z.number().int().min(1).max(1_000),
      })
      .strict(),
  })
  .strict();

export type CodexHealingBundle = z.infer<typeof codexHealingBundleSchema>;

const selectorChangeSchema = z
  .object({
    area: z.string().trim().min(1).max(200),
    before: z.string().trim().max(300).nullable(),
    after: z.string().trim().min(1).max(300),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

const schemaMappingProposalSchema = z
  .object({
    sourceField: z.string().trim().min(1).max(100),
    targetField: canonicalFieldSchema.nullable(),
    confidence: z.number().min(0).max(1),
    decision: z.enum(["auto", "review", "ignore"]),
    reason: z.string().trim().min(1).max(500),
    evidence: z.array(z.string().trim().min(1).max(300)).min(1).max(10),
  })
  .strict();

export const codexHealingProposalSchema = z
  .object({
    proposalVersion: z.literal("1"),
    evidenceType: z.literal("codex_healing_proposal"),
    status: z.literal("proposal"),
    collectorId: z.string().regex(/^c_[a-z0-9]+$/),
    targetUrl: safeUrlSchema,
    repairScope: z.enum([
      "selector_only",
      "schema_mapping_only",
      "selector_and_schema",
      "unknown",
    ]),
    diagnosis: z.string().trim().min(1).max(2_000),
    overallConfidence: z.number().min(0).max(1),
    brightDataPrompt: z.string().trim().min(1).max(1_000),
    selectorChanges: z.array(selectorChangeSchema).max(20),
    schemaMappings: z.array(schemaMappingProposalSchema).max(20),
    preservesCanonicalContract: z.literal(true),
    fullRunVerificationRequired: z.literal(true),
    verificationChecks: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
    limitations: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
    executionPolicy: z
      .object({
        localOnly: z.literal(true),
        brightDataMutation: z.literal(false),
        databaseMutation: z.literal(false),
        requiresHumanApproval: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type CodexHealingProposal = z.infer<typeof codexHealingProposalSchema>;

export type CodexHealingValidation =
  | {
      status: "reviewable";
      issues: readonly [];
      proposal: CodexHealingProposal;
      requiresHumanApproval: true;
    }
  | {
      status: "rejected";
      issues: readonly string[];
      proposal?: CodexHealingProposal;
      requiresHumanApproval: true;
    };

function describeParseIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "proposal";
    return `${path}: ${issue.message}`;
  });
}

function evidenceFieldNames(bundle: CodexHealingBundle): Set<string> {
  const names = new Set<string>();
  for (const row of [
    ...bundle.knownGoodRows,
    ...bundle.observedRows,
    ...bundle.representativePreviewRows,
  ]) {
    for (const fieldName of Object.keys(row)) names.add(fieldName);
  }
  return names;
}

function observedAutomaticMappings(
  bundle: CodexHealingBundle,
): Set<string> {
  const proposals = proposeSchemaMappings([
    ...bundle.knownGoodRows,
    ...bundle.observedRows,
    ...bundle.representativePreviewRows,
  ]);
  return new Set(
    proposals
      .filter((proposal) => proposal.decision === "auto" && proposal.targetField)
      .map((proposal) => `${proposal.sourceField}:${proposal.targetField}`),
  );
}

/**
 * Parse an evidence bundle before giving it to a local Codex run. Bundles are
 * deliberately scalar-only and carry explicit no-mutation constraints so the
 * local workflow cannot accidentally become a Bright Data or database client.
 */
export function parseCodexHealingBundle(value: unknown): CodexHealingBundle {
  return codexHealingBundleSchema.parse(value);
}

/**
 * Validate Codex's final JSON as a reviewable proposal. "reviewable" means it
 * passed the local safety/contract gate; it is not an approval or a healing
 * result. A separate human approval and post-approval collector run remain
 * mandatory.
 */
export function validateCodexHealingProposal(
  value: unknown,
  bundle: CodexHealingBundle,
): CodexHealingValidation {
  const parsed = codexHealingProposalSchema.safeParse(value);
  if (!parsed.success) {
    return {
      status: "rejected",
      issues: describeParseIssues(parsed.error),
      requiresHumanApproval: true,
    };
  }

  const proposal = parsed.data;
  const issues: string[] = [];
  const fieldNames = evidenceFieldNames(bundle);
  const autoMappings = observedAutomaticMappings(bundle);

  if (proposal.collectorId !== bundle.collectorId) {
    issues.push("Proposal Collector ID does not match the evidence bundle");
  }
  if (proposal.targetUrl !== bundle.targetUrl) {
    issues.push("Proposal target URL does not match the evidence bundle");
  }
  if (bundle.constraints.maxPromptCharacters < proposal.brightDataPrompt.length) {
    issues.push("Bright Data prompt exceeds the bundle's prompt-length constraint");
  }
  if (bundle.constraints.brightDataMutationAuthorized) {
    issues.push("Evidence bundle unexpectedly authorizes Bright Data mutation");
  }
  if (bundle.constraints.databaseMutationAuthorized) {
    issues.push("Evidence bundle unexpectedly authorizes database mutation");
  }
  if (bundle.failure.kind === "zero_rows_after_markup_change") {
    if (proposal.repairScope === "schema_mapping_only") {
      issues.push("A zero-row failure requires selector or extraction repair, not only field renaming");
    }
    if (proposal.selectorChanges.length === 0) {
      issues.push("A zero-row failure requires at least one proposed selector/extraction change");
    }
  }

  for (const mapping of proposal.schemaMappings) {
    if (!fieldNames.has(mapping.sourceField)) {
      issues.push(`Schema mapping source field is absent from the evidence: ${mapping.sourceField}`);
    }

    if (mapping.decision === "ignore" && mapping.targetField !== null) {
      issues.push(`Ignored mapping must not have a target field: ${mapping.sourceField}`);
    }
    if (mapping.decision !== "ignore" && mapping.targetField === null) {
      issues.push(`Non-ignored mapping must have a canonical target: ${mapping.sourceField}`);
    }

    if (
      mapping.decision === "auto" &&
      mapping.targetField !== null &&
      mapping.sourceField !== mapping.targetField &&
      !autoMappings.has(`${mapping.sourceField}:${mapping.targetField}`) &&
      !isKnownAutomaticSchemaMapping(mapping.sourceField, mapping.targetField)
    ) {
      issues.push(
        `Automatic mapping is not an observed allowlisted alias: ${mapping.sourceField} -> ${mapping.targetField}`,
      );
    }
  }

  if (issues.length > 0) {
    return {
      status: "rejected",
      issues,
      proposal,
      requiresHumanApproval: true,
    };
  }

  return {
    status: "reviewable",
    issues: [],
    proposal,
    requiresHumanApproval: true,
  };
}

export type { CanonicalScraperField, SchemaMappingDecision };
