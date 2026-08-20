# CareerSentry

CareerSentry is a provenance-aware, self-healing career intelligence agent for the [Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse) hackathon. It monitors official career catalogs, validates collection health, and is designed to repair a Bright Data Scraper Studio collector in place while preserving its Collector ID and downstream contract.

> Current state: the product shell and owned layout A/B catalog are deployed at [career-sentry.vercel.app](https://career-sentry.vercel.app). A custom Scraper Studio collector has completed a three-row fixture run; its first saved schema repair failed post-approval verification and remains an intentionally visible reliability incident. Real-company collection stays disabled until a target passes the provenance, policy, Marketplace, and budget gates.

The canonical project decisions and status live in [HACKATHON_PLAN.md](./HACKATHON_PLAN.md). Read it before changing scope or implementation.

## What is implemented

- Responsive Next.js dashboard with Overview, Jobs, Companies, Collector Health, Incidents, and Run History screens.
- Sanitized deterministic demo data; no resumes or personal candidate data.
- Strict Zod `JobRecord` contract.
- Bangalore/Bengaluru normalization with original source-label preservation.
- Job-ID/URL deduplication and new/updated/closed lifecycle diffing.
- Collector health checks for count drift, required fields, duplicates, pagination, schema, details, and application actions.
- Server-side Bright Data client for `POST /dca/trigger` and `GET /dca/dataset` polling.
- A hard ten-input API guard plus a project-wide 5,000-credit/no-overage policy.
- Project-owned public layout A/B catalog with three fictional job-detail pages.
- Custom Scraper Studio Discovery collector `c_mt1wzptjco00s7w0p`, created and run through Codex against one fixture URL.
- Approval-gated same-collector healing with post-approval verification that correctly rejected a repair whose preview and saved output differed.
- Read-only real-company target research under `docs/`; no real company collection has been performed.

## Local setup

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Verification:

```bash
npm test
npm run typecheck
npm run build
```

## Bright Data configuration

Copy `.env.example` to `.env.local` and fill it locally only after a target is approved and a custom Scraper Studio collector exists:

```env
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_DISCOVERY_COLLECTOR_ID=c_...
BRIGHT_DATA_PDP_COLLECTOR_ID=c_...
```

Never prefix the token with `NEXT_PUBLIC_`, commit it, paste it into screenshots, or expose it to client components. The repository contains no live token. Collector IDs are non-secret provenance identifiers and may appear in sanitized evidence.

The intended cost-efficient collector flow is:

```text
official catalog -> Discovery collector -> normalized snapshot
                                      -> PDP only for new/changed job URLs
```

The application client enforces at most ten inputs in one run. The target spike is stricter: exactly one public catalog URL until actual account usage can be measured.

## Scraper Studio evidence

- [Recovered layout-A output](./docs/evidence/layout-a-recovered.json): three fictional roles collected by the custom scraper.
- [Degraded layout-B output](./docs/evidence/layout-b-degraded.json): zero rows after the controlled DOM redesign.
- [Healing incident timeline](./docs/evidence/healing-incident.md): approval decisions, failed verification, same-Collector-ID recovery, and the unresolved layout-B repair.

The evidence is intentionally honest: CareerSentry successfully recovered the layout-A schema on the same Collector ID, detected the layout-B zero-row failure, and did not claim recovery when Scraper Studio failed the layout-B repair during approval.

## Architecture

```text
Official careers catalog
          |
          v
Bright Data Scraper Studio Discovery collector
          |
          +---- new/changed URLs ----> incremental PDP collector
          |                                |
          +---------------+----------------+
                          v
                    Zod + normalizer
                          |
             +------------+-------------+
             v                          v
        persistence                 health engine
             |                          |
             v                          v
         dashboard              healing incident/Codex
```

CLI commands create, run, and heal collectors during agent-assisted development. The web application uses the Scraper Studio API and never executes arbitrary shell commands.

## Target policy

Public visibility is not treated as permission. Before any real collection, the target must pass:

- official corporate-to-careers provenance;
- public/no-login access;
- current Terms and robots/site-policy review;
- Bright Data pre-built scraper overlap check;
- one-input credit gate;
- schema and provenance validation.

Nutanix is currently blocked pending express written permission. Canva is paused because its current Terms leave the separate careers-host scope ambiguous. See `docs/` and the source-of-truth plan for evidence.

## AI usage disclosure

Codex and user-authorized Luna subagents are used for research, implementation, review, and tests. Bright Data Scraper Studio's AI Agent created the qualifying custom fixture collector and proposed its same-ID schema repairs. The project owner retains the approval gate; CareerSentry validates both previews and saved production reruns before declaring recovery. The owner remains responsible for the architecture, generated code, and submission.

## Safety

- Public job-posting data only.
- No logins, candidate portals, form submissions, application automation, or personal data.
- Delegated ATS links are recorded only when reached through the official company path; application forms are not opened or crawled.
- Scraped content is untrusted and must be validated before rendering or reaching an LLM.
- Tokens, `.env` files, resumes, and private job-search results are excluded from the repository.
