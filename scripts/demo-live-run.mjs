#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const collectorId = "c_mt5mfwuv2910ltr23s";
const targetUrl = "https://career-sentry.vercel.app/demo-target/live";
const stage = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
const stages = {
  baseline: { layout: "a", rows: 3, output: "demo-layout-a-baseline.json" },
  failure: { layout: "b", rows: 0, output: "demo-layout-b-failure.json" },
  verify: { layout: "b", rows: 3, output: "demo-layout-b-verified.json" },
};

if (!stages[stage]) {
  throw new Error("Usage: node scripts/demo-live-run.mjs <baseline|failure|verify>");
}

const config = stages[stage];
const artifactDir = resolve(repoDir, "artifacts", "brightdata-healing");
const output = resolve(artifactDir, config.output);
mkdirSync(artifactDir, { recursive: true });

const html = await fetch(targetUrl).then((response) => {
  if (!response.ok) throw new Error(`Fixture returned HTTP ${response.status}`);
  return response.text();
});
const aCards = (html.match(/<article class="job-card"/g) ?? []).length;
const bTiles = (html.match(/<section class="role-tile"/g) ?? []).length;
if (config.layout === "a" && (aCards !== 3 || bTiles !== 0)) {
  throw new Error(`Expected Layout A before ${stage}; observed A=${aCards}, B=${bTiles}`);
}
if (config.layout === "b" && (aCards !== 0 || bTiles !== 3)) {
  throw new Error(`Expected Layout B before ${stage}; observed A=${aCards}, B=${bTiles}`);
}

console.log(`Fixture gate passed: Layout ${config.layout.toUpperCase()} is live.`);
if (dryRun) {
  console.log("Dry run complete; Bright Data was not called.");
} else {
console.log(`Running real Bright Data collector ${collectorId}...`);

const npxArgs = [
  "-y", "-p", "@brightdata/cli", "bdata", "scraper", "run",
  collectorId, targetUrl, "--pretty", "-o", output,
];
const command = process.platform === "win32" ? process.env.ComSpec : "npx";
const commandArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npx.cmd", ...npxArgs]
  : npxArgs;
const result = spawnSync(command, commandArgs, {
  cwd: repoDir,
  stdio: "inherit",
  windowsHide: true,
});
if (result.error) throw new Error(`Could not run Bright Data CLI: ${result.error.message}`);
if (result.status !== 0) throw new Error(`Bright Data CLI exited with status ${result.status}`);
if (!existsSync(output)) throw new Error("Bright Data CLI did not write a result artifact");

const parsed = JSON.parse(readFileSync(output, "utf8"));
const rows = Array.isArray(parsed) ? parsed : parsed?.data;
if (!Array.isArray(rows)) throw new Error("Unexpected Bright Data result shape");

console.log(`\nActual collector result: ${rows.length} row(s)`);
if (rows.length > 0) {
  console.table(rows.map((row) => ({
    id: row.role_id ?? row.job_id_value,
    title: row.title,
    team: row.team ?? row.department,
    location: row.location,
  })));
}
if (rows.length !== config.rows) {
  throw new Error(`Stage ${stage} expected ${config.rows} rows, received ${rows.length}`);
}

if (stage === "failure") {
  const baselinePath = resolve(artifactDir, stages.baseline.output);
  if (!existsSync(baselinePath)) throw new Error("Run demo:live:baseline before the failure stage");
  const baselineParsed = JSON.parse(readFileSync(baselinePath, "utf8"));
  const baselineRows = Array.isArray(baselineParsed) ? baselineParsed : baselineParsed?.data;
  if (!Array.isArray(baselineRows) || baselineRows.length !== 3) {
    throw new Error("The live baseline artifact does not contain three rows");
  }
  const firstTile = html.indexOf('<section class="role-tile"');
  const finalTile = html.lastIndexOf("</section>");
  const markupExcerpt = firstTile >= 0 && finalTile > firstTile
    ? html.slice(firstTile, Math.min(finalTile + 10, firstTile + 14000))
    : "";
  const sanitizedRows = baselineRows.map((row) => ({
    role_id: row.role_id ?? row.job_id_value,
    title: row.title,
    team: row.team ?? row.department,
    location: row.location,
    employment_type: row.employment_type,
    official_role_url: row.official_role_url ?? row.company_job_url,
  }));
  const bundle = {
    bundleVersion: "1",
    evidenceType: "codex_healing_input",
    createdAt: new Date().toISOString(),
    collectorId,
    targetUrl,
    source: { kind: "owned_fixture", label: "CareerSentry live Layout-B demo" },
    failure: {
      kind: "zero_rows_after_markup_change",
      baselineRows: baselineRows.length,
      observedRows: rows.length,
      summary: "A real run returned three rows on Layout A and the same collector returned zero after the live fixture changed to Layout B.",
    },
    canonicalFields: [
      "job_id_value", "title", "location", "department",
      "employment_type", "company_job_url",
    ],
    knownGoodRows: sanitizedRows,
    observedRows: [],
    representativePreviewRows: [],
    observations: {
      layoutACards: aCards,
      layoutBTiles: bTiles,
      changedMarkupHtml: markupExcerpt,
      changedMarkupFacts: [
        `The live page contains ${bTiles} role-tile elements and ${aCards} job-card elements.`,
        "The same public stable URL was used before and after the markup change.",
        "Preview samples must not be treated as a full-run row count.",
      ],
    },
    constraints: {
      secretsRedacted: true,
      brightDataMutationAuthorized: false,
      databaseMutationAuthorized: false,
      requiresHumanApproval: true,
      maxPromptCharacters: 1000,
    },
  };
  const bundlePath = resolve(artifactDir, "demo-layout-b-codex-input.json");
  writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  console.log("Fresh sanitized Codex input written from this live failure.");
}

if (stage === "verify") {
  const ids = rows.map((row) => row.role_id ?? row.job_id_value);
  if (new Set(ids).size !== 3 || !["CS-101", "CS-102", "CS-103"].every((id) => ids.includes(id))) {
    throw new Error(`Verification returned unexpected IDs: ${ids.join(", ")}`);
  }
  const urls = [];
  for (const row of rows) {
    const id = row.role_id ?? row.job_id_value;
    const team = row.team ?? row.department;
    const url = row.official_role_url ?? row.company_job_url;
    if (!id || !row.title || !team || !row.location || !row.employment_type || !url) {
      throw new Error(`Verification row is incomplete: ${id ?? "unknown"}`);
    }
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || parsedUrl.origin !== new URL(targetUrl).origin) {
      throw new Error(`Verification row has an invalid official URL: ${url}`);
    }
    urls.push(url);
  }
  if (new Set(urls).size !== 3) throw new Error("Verification URLs are not distinct");
  console.log("RECOVERY VERIFIED: same collector, three adapter-valid expected rows.");
}
}
