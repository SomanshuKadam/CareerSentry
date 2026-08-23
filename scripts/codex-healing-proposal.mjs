#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultInput = "docs/evidence/layout-b-codex-input.json";
const defaultOutput = "artifacts/codex-healing/layout-b-proposal.json";
const defaultSchema = "docs/evidence/codex-healing-proposal.schema.json";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function repoPath(value) {
  const absolute = resolve(repoDir, value);
  const relativePath = relative(repoDir, absolute);
  if (
    relativePath.startsWith("..") ||
    relativePath.includes("..\\") ||
    relativePath.includes("../")
  ) {
    throw new Error(`Path must stay inside the CareerSentry repository: ${value}`);
  }
  return { absolute, relative: relativePath.replaceAll("\\", "/") };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not read JSON input ${path}: ${error.message}`);
  }
}

function collectStrings(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, output));
  }
  return output;
}

function validateBundle(bundle) {
  const issues = [];
  const canonicalFields = [
    "job_id_value",
    "title",
    "location",
    "department",
    "employment_type",
    "company_job_url",
  ];
  const forbiddenMarkers = [
    "BRIGHT_DATA_API_TOKEN",
    "CAREERSENTRY_RUN_KEY",
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "CODEX_API_KEY",
  ];

  if (bundle?.bundleVersion !== "1") issues.push("bundleVersion must be 1");
  if (bundle?.evidenceType !== "codex_healing_input") {
    issues.push("evidenceType must be codex_healing_input");
  }
  if (!/^c_[a-z0-9]+$/.test(bundle?.collectorId ?? "")) {
    issues.push("collectorId must be a sanitized c_* identifier");
  }
  if (bundle?.constraints?.secretsRedacted !== true) {
    issues.push("bundle must declare secretsRedacted=true");
  }
  if (bundle?.constraints?.brightDataMutationAuthorized !== false) {
    issues.push("bundle must declare brightDataMutationAuthorized=false");
  }
  if (bundle?.constraints?.databaseMutationAuthorized !== false) {
    issues.push("bundle must declare databaseMutationAuthorized=false");
  }
  if (bundle?.constraints?.requiresHumanApproval !== true) {
    issues.push("bundle must require human approval");
  }
  if (JSON.stringify(bundle?.canonicalFields) !== JSON.stringify(canonicalFields)) {
    issues.push("bundle canonicalFields do not match the CareerSentry contract");
  }

  const strings = collectStrings(bundle).map((value) => value.toUpperCase());
  for (const marker of forbiddenMarkers) {
    if (strings.some((value) => value.includes(marker))) {
      issues.push(`bundle contains a forbidden secret marker: ${marker}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Input bundle failed the local safety gate:\n- ${issues.join("\n- ")}`);
  }
}

function validateProposal(proposal, bundle) {
  const issues = [];
  const canonicalFields = new Set(bundle.canonicalFields);
  const evidenceFields = new Set();
  for (const row of [
    ...(bundle.knownGoodRows ?? []),
    ...(bundle.observedRows ?? []),
    ...(bundle.representativePreviewRows ?? []),
  ]) {
    Object.keys(row).forEach((field) => evidenceFields.add(field));
  }

  if (proposal?.proposalVersion !== "1") issues.push("proposalVersion must be 1");
  if (proposal?.evidenceType !== "codex_healing_proposal") {
    issues.push("evidenceType must be codex_healing_proposal");
  }
  if (proposal?.status !== "proposal") issues.push("status must remain proposal");
  if (proposal?.collectorId !== bundle.collectorId) {
    issues.push("proposal Collector ID does not match the evidence bundle");
  }
  if (proposal?.targetUrl !== bundle.targetUrl) {
    issues.push("proposal target URL does not match the evidence bundle");
  }
  if (proposal?.preservesCanonicalContract !== true) {
    issues.push("proposal must preserve the canonical contract");
  }
  if (proposal?.fullRunVerificationRequired !== true) {
    issues.push("proposal must require a full post-approval verification run");
  }
  if (
    proposal?.executionPolicy?.localOnly !== true ||
    proposal?.executionPolicy?.brightDataMutation !== false ||
    proposal?.executionPolicy?.databaseMutation !== false ||
    proposal?.executionPolicy?.requiresHumanApproval !== true
  ) {
    issues.push("proposal execution policy is not local-only and approval-gated");
  }
  if ((proposal?.brightDataPrompt?.length ?? Infinity) > bundle.constraints.maxPromptCharacters) {
    issues.push("proposal Bright Data prompt exceeds the local limit");
  }
  if (bundle.failure?.kind === "zero_rows_after_markup_change") {
    if (proposal?.repairScope === "schema_mapping_only") {
      issues.push("zero-row failure cannot be repaired by schema mapping alone");
    }
    if (!Array.isArray(proposal?.selectorChanges) || proposal.selectorChanges.length === 0) {
      issues.push("zero-row failure requires selector/extraction changes");
    }
  }

  for (const mapping of proposal?.schemaMappings ?? []) {
    if (!evidenceFields.has(mapping.sourceField)) {
      issues.push(`mapping source is absent from evidence: ${mapping.sourceField}`);
    }
    if (mapping.decision === "ignore" && mapping.targetField !== null) {
      issues.push(`ignored mapping has a target: ${mapping.sourceField}`);
    }
    if (mapping.decision !== "ignore" && !canonicalFields.has(mapping.targetField)) {
      issues.push(`mapping target is not canonical: ${mapping.sourceField}`);
    }
    const exactAliases = new Set([
      "role_id:job_id_value",
      "team:department",
      "official_role_url:company_job_url",
    ]);
    if (
      mapping.decision === "auto" &&
      mapping.sourceField !== mapping.targetField &&
      !exactAliases.has(`${mapping.sourceField}:${mapping.targetField}`)
    ) {
      issues.push(`automatic mapping is not an allowlisted exact alias: ${mapping.sourceField}`);
    }
  }

  return issues;
}

const input = repoPath(option("--input", defaultInput));
const output = repoPath(option("--output", defaultOutput));
const schema = repoPath(option("--schema", defaultSchema));
const validateOnly = hasFlag("--validate-only");

if (!existsSync(input.absolute)) throw new Error(`Input bundle does not exist: ${input.relative}`);
if (!existsSync(schema.absolute)) throw new Error(`Output schema does not exist: ${schema.relative}`);
if (validateOnly && !existsSync(output.absolute)) {
  throw new Error(`Proposal does not exist for validation: ${output.relative}`);
}
if (!validateOnly && existsSync(output.absolute) && !hasFlag("--force")) {
  throw new Error(`Output already exists; pass --force to replace it: ${output.relative}`);
}

const bundle = readJson(input.absolute);
validateBundle(bundle);
if (!validateOnly) {
  mkdirSync(dirname(output.absolute), { recursive: true });

  // Give Codex a workspace containing only sanitized input and the output
  // contract. The CLI must not be able to inspect repository-local env files.
  const isolatedDir = mkdtempSync(join(tmpdir(), "careersentry-codex-"));
  const isolatedInput = join(isolatedDir, "input.json");
  const isolatedSchema = join(isolatedDir, "schema.json");
  const isolatedOutput = join(isolatedDir, "proposal.json");

  try {
    const schemaText = readFileSync(schema.absolute, "utf8");
    JSON.parse(schemaText);
    writeFileSync(isolatedInput, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    writeFileSync(isolatedSchema, schemaText, "utf8");

    const prompt = [
      "You are CareerSentry's local, advisory scraper-repair analyst.",
      "Read only the sanitized evidence bundle in input.json.",
      "Return only JSON matching schema.json; do not wrap it in Markdown.",
      "Use only the evidence in input.json. Do not modify files, use the network, call Bright Data, run bdata, access secrets, approve a collector, save a production draft, or write to PostgreSQL.",
      "This is a proposal only. Set executionPolicy to localOnly=true, brightDataMutation=false, databaseMutation=false, and requiresHumanApproval=true.",
      "The failure is zero rows after a markup change, so prioritize selector/iteration/extraction changes. Field renames alone cannot repair zero rows.",
      "Preserve exactly the six canonical fields. Any uncertain semantic field mapping must be decision=review, with evidence and a confidence score; never invent values.",
      "Treat representative preview rows as samples, not full-run row counts. State the required post-approval full-run checks in verificationChecks and limitations.",
    ].join("\n");

    const result = spawnSync(
      "codex",
      [
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--output-schema",
        "schema.json",
        "--output-last-message",
        "proposal.json",
        prompt,
      ],
      {
        cwd: isolatedDir,
        stdio: ["ignore", "inherit", "inherit"],
        timeout: 300000,
        killSignal: "SIGTERM",
        windowsHide: true,
      },
    );

    if (result.error) throw new Error(`Could not complete codex exec: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`codex exec exited with status ${result.status}`);
    if (!existsSync(isolatedOutput)) throw new Error("codex exec did not produce a proposal artifact");
    copyFileSync(isolatedOutput, output.absolute);
  } finally {
    rmSync(isolatedDir, { recursive: true, force: true });
  }
}

const proposal = readJson(output.absolute);
const issues = validateProposal(proposal, bundle);
if (issues.length > 0) {
  console.error(`Local proposal gate rejected ${output.relative}:`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 2;
} else {
  console.log(`Reviewable local Codex proposal written to ${output.relative}.`);
  console.log("No Bright Data mutation, approval, collector run, or database write was performed.");
}
