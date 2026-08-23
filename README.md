# CareerSentry

CareerSentry is a self-healing career-data monitor built for the [Into the Scrape-Verse hackathon](https://www.wemakedevs.org/hackathons/scrape-verse). It collects public jobs with Bright Data Scraper Studio, validates every run, keeps the last healthy snapshot, and repairs a collector when a careers page changes.

## Try it

| Page | What it shows |
|---|---|
| [Home](https://career-sentry.vercel.app) | Product overview and current reliability state |
| [Jobs](https://career-sentry.vercel.app/jobs) | 13 real RevRag AI roles persisted in Neon PostgreSQL |
| [Reliability](https://career-sentry.vercel.app/reliability) | Collector health, provenance, incidents, and recovery proof |
| [Healing fixture](https://career-sentry.vercel.app/demo-target/live) | Project-owned fictional careers page used for the controlled A/B demo |

## What problem does it solve?

A job scraper can return HTTP 200 and still silently miss every job after a website redesign. CareerSentry treats extraction as a monitored data pipeline:

```text
public careers page
        ↓
Bright Data custom collector
        ↓
schema normalization + health checks
        ↓
healthy → save snapshot → show jobs
broken  → preserve old snapshot → open healing incident
                                      ↓
                            Codex repair proposal
                                      ↓
                         Bright Data preview + review
                                      ↓
                         human approval → verify again
```

The database and UI continue using the same canonical job schema even when Bright Data proposes different output labels.

## What is verified?

### Real RevRag collection

- Custom Scraper Studio collector: `c_mt3ctgtj2rqnwsqm8p`
- Source: RevRag AI's public first-party careers catalog
- Initial run: 10 valid roles plus 5 rejected error envelopes
- Same-collector cleanup: 10 clean rows after approval
- Protected production run: 13 healthy rows persisted in Neon PostgreSQL
- Current Jobs page: the persisted 13-role last-known-good snapshot

### Controlled website-change recovery

- Project-owned fixture collector: `c_mt5mfwuv2910ltr23s`
- Layout A: 3 rows
- Layout B with unchanged A selectors: 0 real rows
- Local Codex: generated a selector/schema repair from the fresh failure evidence
- Bright Data Self-Healing: previewed the repair and stopped for approval
- Deterministic review: accepted only the expected B selectors and allowlisted schema aliases
- Post-approval run: 3 rows on the same Collector ID (`CS-101`, `CS-102`, `CS-103`)
- PostgreSQL and RevRag data: unchanged during the fixture experiment

Recovery is claimed only after a full post-approval collector run—not from a preview.

## Real live-healing demo commands

These are the actual commands used in the recorded demonstration. They call Vercel, local Codex CLI, and Bright Data; they are not hardcoded output or an evidence replay.

> The demo is stateful and spends Bright Data credits. The completed recording left the healed collector configured for Layout B and restored the public fixture to safe Layout A. Do not rerun this sequence without deliberately preparing the collector for Layout A again.

From PowerShell in the repository root:

```powershell
# 1. Run the real Layout-A collector and require three rows
npm.cmd run demo:live:baseline

# 2. Deploy the changed Layout-B website
npm.cmd run demo:live:layout-b

# 3. Run the unchanged collector, require zero rows, and save fresh failure evidence
npm.cmd run demo:live:failure

# 4. Invoke real local codex exec to propose a repair
npm.cmd run demo:live:codex

# 5. Send the Codex prompt to Bright Data Self-Healing and stop at approval
npm.cmd run demo:live:heal

# 6. Validate the real diff, selectors, schema, and preview
npm.cmd run demo:live:review

# 7. Approve and save the pending repair
npm.cmd run demo:live:approve

# 8. Run the same collector and require all three valid B rows
npm.cmd run demo:live:verify

# 9. Restore the public fixture to Layout A
npm.cmd run demo:live:restore
```

Bright Data's AI step can take several minutes. The submitted three-minute video can use a visible jump cut over polling, while keeping the real command and final output on screen. If a stage fails, do not continue to approval; restore Layout A if Layout B is already public.

## How Codex is used

CareerSentry uses the user's authenticated local Codex CLI instead of an OpenAI API integration:

```powershell
npm.cmd run healing:codex -- --input docs/evidence/layout-b-codex-input.json
```

The workflow:

1. Builds a sanitized bundle containing the failure, expected contract, and changed markup.
2. Runs `codex exec` in an isolated, read-only temporary workspace.
3. Requires structured JSON matching the checked-in proposal schema.
4. Rejects unsafe or incompatible mappings locally.
5. Leaves Bright Data mutation and approval to separate human-controlled commands.

Generated proposals and raw operation responses stay under ignored `artifacts/` paths.

## Schema adapter

CareerSentry accepts only these reviewed aliases:

| Bright Data field | CareerSentry field |
|---|---|
| `role_id` | `job_id_value` |
| `team` | `department` |
| `official_role_url` | `company_job_url` |

Known Bright Data metadata such as `product_page_url` and `input` is ignored. Unknown fields, conflicting aliases, incomplete rows, duplicate IDs, and invalid URLs are rejected.

## Run locally

Requirements: Node.js 18 or newer.

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Verify the project:

```powershell
npm test
npm run typecheck
npm run build
```

## Configuration

Copy `.env.example` to `.env.local` only when operating the protected collection route:

```env
BRIGHT_DATA_API_TOKEN=...
CAREERSENTRY_RUN_KEY=...
DATABASE_URL=postgresql://...
BRIGHT_DATA_DISCOVERY_COLLECTOR_ID=c_...
BRIGHT_DATA_PDP_COLLECTOR_ID=c_...
```

Never prefix a secret with `NEXT_PUBLIC_`, commit it, paste it into chat, or show it in a recording. Dashboard page loads never trigger Bright Data. The protected RevRag route fails closed unless its server-only run key, Bright Data token, and database configuration are available.

Database migration:

```powershell
npm run db:migrate
```

## Evidence

Start with these files:

- [RevRag verified collection](./docs/evidence/revrag-verified.json)
- [Verified Codex-assisted Layout-B recovery](./docs/evidence/layout-b-codex-assisted-success.json)
- [Healing incident timeline](./docs/evidence/healing-incident.md)
- [Layout-B healing postmortem](./docs/evidence/layout-b-healing-postmortem.md)
- [Local Codex workflow](./docs/evidence/codex-local-healing.md)
- [Schema-drift adapter](./docs/evidence/schema-drift-adapter.md)

Historical failed and rejected attempts remain in `docs/evidence/`; they are part of the reliability story, not hidden test noise.

## Safety boundaries

- Public job-posting fields only
- No logins, applications, resumes, candidate data, or form submission
- No public credit-burning endpoint
- Healthy snapshots replace production data atomically; degraded runs never do
- Human approval before saving a Bright Data repair
- Full same-collector verification before declaring recovery
- Bright Data hard ceiling: 5,000 credits; exact conversion is unavailable

## AI usage disclosure

Codex assisted with research, implementation, tests, documentation, and the structured healing proposal. Bright Data Scraper Studio performed collection and Self-Healing. CareerSentry's deterministic gates and the project owner controlled approval. No AI model writes directly to PostgreSQL.
