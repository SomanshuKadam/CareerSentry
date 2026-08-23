#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const collectorId = "c_mt5mfwuv2910ltr23s";
const targetUrl = "https://career-sentry.vercel.app/demo-target/live";
const apiBase = "https://api.brightdata.com";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function credentialsPath() {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "brightdata-cli", "credentials.json");
  }
  if (process.platform === "win32") {
    return join(homedir(), "AppData", "Roaming", "brightdata-cli", "credentials.json");
  }
  return join(homedir(), ".config", "brightdata-cli", "credentials.json");
}

function apiKey() {
  const fromEnvironment = process.env.BRIGHTDATA_API_KEY?.trim();
  if (fromEnvironment) return fromEnvironment;
  const path = credentialsPath();
  if (!existsSync(path)) {
    throw new Error("Bright Data CLI credentials are unavailable. Run `bdata login` locally.");
  }
  const key = JSON.parse(readFileSync(path, "utf8"))?.api_key?.trim();
  if (!key) throw new Error("Bright Data CLI credentials do not contain an API key.");
  return key;
}

function artifactPath(value) {
  const absolute = resolve(repoDir, value);
  const allowed = resolve(repoDir, "artifacts", "brightdata-healing");
  const child = relative(allowed, absolute);
  if (child.startsWith("..") || resolve(allowed, child) !== absolute) {
    throw new Error("--output must stay under artifacts/brightdata-healing");
  }
  return absolute;
}

function proposalArtifactPath(value) {
  const absolute = resolve(repoDir, value);
  const allowed = resolve(repoDir, "artifacts", "codex-healing");
  const child = relative(allowed, absolute);
  if (child.startsWith("..") || resolve(allowed, child) !== absolute) {
    throw new Error("--proposal must stay under artifacts/codex-healing");
  }
  return absolute;
}

async function request(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Bright Data API returned HTTP ${response.status}`);
  return response.json();
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function previewRows(progress) {
  const candidates = [
    progress?.preview,
    progress?.preview_rows,
    progress?.result?.preview,
    progress?.result?.preview_rows,
    progress?.data?.preview,
    progress?.preview_result,
  ];
  return candidates.find(Array.isArray) ?? [];
}

const prompt = option("--prompt", "").trim();
const proposalPath = option("--proposal", "");
const proposalPrompt = proposalPath
  ? JSON.parse(readFileSync(proposalArtifactPath(proposalPath), "utf8"))?.brightDataPrompt
  : "";
const selectedPrompt = (prompt || proposalPrompt || "").trim();
const output = artifactPath(option(
  "--output",
  "artifacts/brightdata-healing/live-heal-progress.json",
));
if (!selectedPrompt) throw new Error("--prompt or --proposal is required");
if (selectedPrompt.length > 1000) {
  throw new Error("Healing prompt must be at most 1000 characters");
}

console.log(`Triggering real Bright Data Self-Healing on ${collectorId}.`);
console.log(`Target supplied as custom_input: ${targetUrl}`);

await request(`/dca/collectors/${collectorId}/refactor_template`, {
  method: "POST",
  body: JSON.stringify({ prompt: selectedPrompt, custom_input: [{ url: targetUrl }] }),
});

let progress;
for (let attempt = 1; attempt <= 300; attempt += 1) {
  progress = await request(`/dca/collectors/${collectorId}/refactor_template/progress`);
  const status = progress?.status;
  const step = progress?.step ?? "pending";
  process.stderr.write(`\rBright Data status: ${status ?? "unknown"} / ${step}          `);
  if (["pending_answer", "done", "failed", "error", "cancelled"].includes(status)) break;
  await sleep(2000);
}
process.stderr.write("\n");

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(progress, null, 2)}\n`, "utf8");

const rows = previewRows(progress);
console.log(`Status: ${progress?.status ?? "unknown"}`);
console.log(`Progress ID: ${progress?.id ?? progress?.progress_id ?? "not reported"}`);
console.log(`Preview samples: ${rows.length}`);
if (rows[0] && typeof rows[0] === "object") {
  console.log(`Preview fields: ${Object.keys(rows[0]).join(", ")}`);
}
console.log(`Raw progress retained locally at ${relative(repoDir, output).replaceAll("\\", "/")}.`);

if (progress?.status === "pending_answer") {
  console.log("Human review required. Do not approve until the diff and preview pass validation.");
} else if (progress?.status !== "done") {
  throw new Error(`Self-Healing did not reach an approval gate: ${progress?.status ?? "unknown"}`);
}
