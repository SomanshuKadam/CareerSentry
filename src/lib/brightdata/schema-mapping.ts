export const CANONICAL_SCRAPER_FIELDS = [
  "job_id_value",
  "title",
  "location",
  "department",
  "employment_type",
  "company_job_url",
] as const;

export type CanonicalScraperField = (typeof CANONICAL_SCRAPER_FIELDS)[number];
export type SchemaMappingDecision = "auto" | "review" | "ignore";

export type SchemaMappingProposal = {
  sourceField: string;
  targetField: CanonicalScraperField | null;
  confidence: number;
  decision: SchemaMappingDecision;
  reason: string;
  evidence: readonly string[];
};

export type ApprovedSchemaMapping = {
  sourceField: string;
  targetField: CanonicalScraperField;
};

type MappingRule = {
  targetField: CanonicalScraperField;
  aliases: readonly string[];
  confidence: number;
  decision: Exclude<SchemaMappingDecision, "ignore">;
  reason: string;
};

const AUTO_RULES: readonly MappingRule[] = [
  {
    targetField: "job_id_value",
    aliases: ["role_id"],
    confidence: 0.99,
    decision: "auto",
    reason: "Exact requisition alias observed in a Bright Data Self-Healing proposal.",
  },
  {
    targetField: "department",
    aliases: ["team"],
    confidence: 0.99,
    decision: "auto",
    reason: "Exact organizational-team alias observed in a Bright Data Self-Healing proposal.",
  },
  {
    targetField: "company_job_url",
    aliases: ["official_role_url"],
    confidence: 0.99,
    decision: "auto",
    reason: "Exact official-role URL alias observed in a Bright Data Self-Healing proposal.",
  },
];

const REVIEW_RULES: readonly MappingRule[] = [
  {
    targetField: "job_id_value",
    aliases: ["requisition", "requisition_id", "role_identifier", "job_identifier"],
    confidence: 0.86,
    decision: "review",
    reason: "The field name suggests a requisition identifier, but it is not an approved exact alias.",
  },
  {
    targetField: "title",
    aliases: ["job_title", "position", "position_title"],
    confidence: 0.88,
    decision: "review",
    reason: "The field name suggests a role title, but it is not an approved exact alias.",
  },
  {
    targetField: "location",
    aliases: ["based_in", "work_location", "job_location"],
    confidence: 0.88,
    decision: "review",
    reason: "The field name suggests a workplace location, but it is not an approved exact alias.",
  },
  {
    targetField: "department",
    aliases: ["business_unit", "function", "division", "org", "organization"],
    confidence: 0.84,
    decision: "review",
    reason: "The field name may describe an organizational grouping, but the semantic mapping needs review.",
  },
  {
    targetField: "employment_type",
    aliases: ["role_type", "work_arrangement", "engagement_type"],
    confidence: 0.88,
    decision: "review",
    reason: "The field name may describe employment terms, but the semantic mapping needs review.",
  },
  {
    targetField: "company_job_url",
    aliases: ["official_url", "role_url", "job_detail_url", "detail_url"],
    confidence: 0.86,
    decision: "review",
    reason: "The field name may be the official role URL, but provenance must be reviewed.",
  },
];

const IGNORED_METADATA_FIELDS = new Set(["product_page_url", "input"]);

export function isKnownAutomaticSchemaMapping(
  sourceField: string,
  targetField: CanonicalScraperField,
): boolean {
  const normalizedSourceField = normalizeFieldName(sourceField);
  return AUTO_RULES.some(
    (rule) =>
      rule.targetField === targetField &&
      rule.aliases.some((alias) => normalizeFieldName(alias) === normalizedSourceField),
  );
}

function normalizeFieldName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function findRule(fieldName: string): MappingRule | undefined {
  const normalized = normalizeFieldName(fieldName);
  return [...AUTO_RULES, ...REVIEW_RULES].find((rule) =>
    rule.aliases.some((alias) => normalizeFieldName(alias) === normalized),
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueEvidence(value: unknown): string {
  if (typeof value !== "string") return `value_type=${typeof value}`;
  const normalized = value.trim();
  if (normalized.length === 0) return "value=empty";
  if (/^https?:\/\//i.test(normalized)) return "value_shape=https-url";
  return "value_shape=non-empty-text";
}

/**
 * Produce explainable mapping suggestions without changing a row. A future
 * model provider can enrich these proposals, but the caller still has to
 * approve review-level mappings before ingestion applies them.
 */
export function proposeSchemaMappings(
  rows: readonly unknown[],
): SchemaMappingProposal[] {
  const rowsByField = new Map<string, { present: number; sample: unknown }>();

  for (const row of rows) {
    if (!isObject(row)) continue;
    for (const [fieldName, value] of Object.entries(row)) {
      const existing = rowsByField.get(fieldName);
      rowsByField.set(fieldName, {
        present: (existing?.present ?? 0) + 1,
        sample: existing?.sample ?? value,
      });
    }
  }

  const proposals: SchemaMappingProposal[] = [];
  for (const [sourceField, details] of rowsByField) {
    const canonicalField = CANONICAL_SCRAPER_FIELDS.find(
      (field) => normalizeFieldName(field) === normalizeFieldName(sourceField),
    );
    if (canonicalField && sourceField !== canonicalField) {
      proposals.push({
        sourceField,
        targetField: canonicalField,
        confidence: 0.99,
        decision: "auto",
        reason: "Case or separator variation of an existing canonical field.",
        evidence: [
          `normalized_field=${normalizeFieldName(sourceField)}`,
          `present_in=${details.present}/${rows.length}_rows`,
          valueEvidence(details.sample),
        ],
      });
      continue;
    }
    if (canonicalField) {
      continue;
    }

    if (IGNORED_METADATA_FIELDS.has(sourceField)) {
      proposals.push({
        sourceField,
        targetField: null,
        confidence: 1,
        decision: "ignore",
        reason: "Known Bright Data platform metadata is not a business field.",
        evidence: [
          `present_in=${details.present}/${rows.length}_rows`,
          valueEvidence(details.sample),
        ],
      });
      continue;
    }

    const rule = findRule(sourceField);
    if (!rule) continue;

    proposals.push({
      sourceField,
      targetField: rule.targetField,
      confidence: rule.confidence,
      decision: rule.decision,
      reason: rule.reason,
      evidence: [
        `normalized_field=${normalizeFieldName(sourceField)}`,
        `present_in=${details.present}/${rows.length}_rows`,
        valueEvidence(details.sample),
      ],
    });
  }

  return proposals;
}

export function isApprovedSchemaMapping(
  proposal: SchemaMappingProposal,
  approvals: readonly ApprovedSchemaMapping[],
): boolean {
  return (
    proposal.targetField !== null &&
    approvals.some(
      (approval) =>
        approval.sourceField === proposal.sourceField &&
        approval.targetField === proposal.targetField,
    )
  );
}

export { IGNORED_METADATA_FIELDS };
