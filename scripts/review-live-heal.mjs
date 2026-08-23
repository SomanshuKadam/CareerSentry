#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(repoDir, "artifacts", "brightdata-healing", "demo-layout-b-heal-progress.json");
const progress = JSON.parse(readFileSync(path, "utf8"));
const proposed = progress?.diff?.template_b;
const steps = proposed?.steps;
const preview = progress?.preview_result;
const issues = [];

if (progress?.status !== "pending_answer") issues.push("heal is not awaiting human approval");
if (!Array.isArray(steps) || steps.length !== 1) issues.push("proposal must contain one listing stage");

const code = steps?.map((step) => `${step.code ?? ""}\n${step.parse_code ?? ""}`).join("\n") ?? "";
if (!code.includes("role-tile")) issues.push("proposal does not target Layout-B role tiles");
if (code.includes(".job-card")) issues.push("proposal still contains the stale Layout-A selector");
if (!/collect\s*\(/.test(code)) issues.push("proposal does not collect parsed rows");

const fields = Object.keys(proposed?.output_fields?.fields ?? {});
const allowed = new Set([
  "job_id_value", "role_id", "title", "location", "department", "team",
  "employment_type", "company_job_url", "official_role_url", "product_page_url",
]);
for (const field of fields) if (!allowed.has(field)) issues.push(`unknown output field: ${field}`);
const requiredGroups = [
  ["job_id_value", "role_id"],
  ["title"],
  ["location"],
  ["department", "team"],
  ["employment_type"],
  ["company_job_url", "official_role_url"],
];
for (const group of requiredGroups) {
  if (!group.some((field) => fields.includes(field))) {
    issues.push(`required output is missing: ${group.join(" or ")}`);
  }
}

if (!Array.isArray(preview) || preview.length === 0) issues.push("proposal has no representative preview rows");
for (const row of preview ?? []) {
  const id = row.role_id ?? row.job_id_value;
  if (!id || !row.title || !row.location || !(row.team ?? row.department)
    || !row.employment_type || !(row.official_role_url ?? row.company_job_url)) {
    issues.push(`preview row is incomplete: ${id ?? "unknown"}`);
  }
  if (id && !["CS-101", "CS-102", "CS-103"].includes(id)) {
    issues.push(`preview row has an unexpected ID: ${id}`);
  }
}

console.log(`Progress ID: ${progress?.id ?? "not reported"}`);
console.log(`Preview samples: ${preview?.length ?? 0} (samples only, not full-run proof)`);
console.log(`Proposed output fields: ${fields.join(", ")}`);
console.log("Required selector: section.role-tile");

if (issues.length > 0) {
  console.error("APPROVAL GATE REJECTED");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 2;
} else {
  console.log("APPROVAL GATE PASSED — human approval is now allowed.");
}
