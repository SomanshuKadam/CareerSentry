#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stage = process.argv[2];
const useColor = !process.argv.includes("--no-color") && process.stdout.isTTY;

const paint = (code, value) => useColor ? `\u001b[${code}m${value}\u001b[0m` : value;
const green = (value) => paint("32;1", value);
const red = (value) => paint("31;1", value);
const cyan = (value) => paint("36;1", value);
const yellow = (value) => paint("33;1", value);
const dim = (value) => paint("2", value);

function readJson(path) {
  return JSON.parse(readFileSync(resolve(repoDir, path), "utf8"));
}

const baseline = readJson("docs/evidence/layout-a-recovered.json");
const degraded = readJson("docs/evidence/layout-b-degraded.json");
const recovery = readJson("docs/evidence/layout-b-codex-assisted-success.json");
const input = readJson("docs/evidence/layout-b-codex-input.json");

if (baseline.length !== 3 || degraded.length !== 0) {
  throw new Error("Saved baseline/degraded evidence does not match the demo contract.");
}
if (recovery.post_approval_verification?.row_count !== 3) {
  throw new Error("Saved recovery evidence does not contain three verified rows.");
}
if (input.collectorId !== recovery.collector_id) {
  throw new Error("Collector ID differs between failure and recovery evidence.");
}

console.log(dim("Recorded evidence replay — zero network calls and zero credits"));

switch (stage) {
  case "baseline":
    console.log(`\n${cyan("BASELINE — LAYOUT A")}`);
    console.log(`Collector ${yellow(input.collectorId)} extracted ${green("3 rows")}.`);
    console.table(baseline.map(({ job_id_value, title, department }) => ({
      id: job_id_value,
      title,
      department,
    })));
    break;

  case "failure":
    console.log(`\n${cyan("WEBSITE CHANGE — LAYOUT B")}`);
    console.log("Old selector: .job-card");
    console.log("New markup:  section.role-tile");
    console.log(`The page still contained 3 jobs, but collector ${yellow(input.collectorId)} returned ${red("0 rows")}.`);
    console.log(red("INCIDENT DETECTED: zero_rows_after_markup_change"));
    break;

  case "heal":
    console.log(`\n${cyan("CODEX-ASSISTED BRIGHT DATA REPAIR")}`);
    console.log("Codex proposed the selector and schema adaptation from sanitized evidence:");
    console.log("  .job-card             -> section.role-tile");
    console.log("  role_id               -> job_id_value");
    console.log("  team                  -> department");
    console.log("  official_role_url     -> company_job_url");
    console.log(`${yellow("Human approval required")} before Bright Data saved the repair.`);
    console.log(`Bright Data progress: ${recovery.self_healing.progress_id}`);
    console.log(green("APPROVED AND SAVED"));
    break;

  case "verify":
    console.log(`\n${cyan("POST-APPROVAL VERIFICATION")}`);
    console.log(`Same Collector ID: ${yellow(recovery.collector_id)}`);
    console.table(recovery.post_approval_verification.rows.map((row) => ({
      id: row.role_id,
      title: row.title,
      team: row.team,
      location: row.location,
    })));
    console.log(green("RECOVERY VERIFIED: 3 rows restored, 0 adapter errors"));
    console.log(dim("No replacement collector, RevRag rerun, or PostgreSQL mutation."));
    break;

  default:
    console.error("Usage: node scripts/demo-healing-replay.mjs <baseline|failure|heal|verify>");
    process.exitCode = 1;
}
