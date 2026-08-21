# CareerSentry

CareerSentry is a provenance-aware, self-healing career intelligence agent for the [Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse) hackathon. It keeps official career paths, normalized job records, collector health, and bounded healing evidence visible in one workspace.

> Current state: collector `c_mt3ctgtj2rqnwsqm8p` was run against the public RevRag AI careers catalog. Its initial saved run returned 15 entries (10 valid active roles and 5 rejected error envelopes); an approval-gated cleanup was saved on the same Collector ID and verification returned 10 clean rows. A protected Collector-ID API, atomic PostgreSQL persistence boundary, and runtime read model are implemented. Without `DATABASE_URL`, the site truthfully falls back to sanitized saved evidence and refuses to trigger collection. The separate CareerSentry-owned layout A/B catalog remains the deterministic healing lab, with layout B unresolved.

## What is implemented

- Responsive, content-first Next.js product with four public destinations: Home, real RevRag Jobs, Reliability evidence, and the clearly labeled project-owned Healing demo.
- Retired dashboard routes redirect to Reliability, so old shared links do not become 404 pages.
- Ten verified RevRag AI roles with stable `jobId` values derived only from each unique same-origin `/careers/{slug}` URL.
- Sanitized public evidence under [`docs/evidence/revrag-verified.json`](./docs/evidence/revrag-verified.json); no application URLs, resumes, candidate fields, credentials, or personal data.
- A clear source registry separating saved RevRag run/recovery evidence from the CareerSentry-owned healing lab.
- Strict Zod `JobRecord` contract, location normalization, URL/job-ID deduplication, and lifecycle helpers.
- Collector health checks for count drift, required fields, duplicates, pagination, schema, details, and application actions.
- Server-side Bright Data client code with bounded input validation and an authenticated fixed-target route that fails closed unless durable storage is configured.
- Provider-neutral PostgreSQL/Drizzle schema and migration for collector runs, canonical jobs, and sanitized health incidents. Healthy runs commit atomically; degraded runs never replace last-known-good jobs.
- Runtime read model that prefers the persisted last-known-good snapshot and otherwise labels the bundled evidence fallback explicitly.
- Project-owned public layout A/B catalog plus stable server-rendered `/demo-target/live` input, controlled only by `CAREERSENTRY_FIXTURE_LAYOUT`.
- Approval-gated same-collector healing evidence. The layout B repair remains visibly rejected after saved-template verification failed.
- Read-only target research under `docs/`; researched targets are not represented as collected jobs in the UI.

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
CAREERSENTRY_RUN_KEY=...
DATABASE_URL=postgresql://...
BRIGHT_DATA_DISCOVERY_COLLECTOR_ID=c_...
BRIGHT_DATA_PDP_COLLECTOR_ID=c_...
```

Never prefix the token with `NEXT_PUBLIC_`, commit it, paste it into screenshots, or expose it to client components. The repository contains no live token. Collector IDs are non-secret provenance identifiers and may appear in sanitized evidence.

The intended cost-efficient collector flow is:

```text
official catalog -> Discovery collector -> normalized snapshot
                                      -> PDP only for new/changed job URLs
```

The application client enforces at most ten inputs in one run. Dashboard page loads never execute collection: they read a stored last-known-good snapshot when PostgreSQL is configured or use the labeled saved-evidence fallback.

### Protected RevRag collection route

`POST /api/admin/collect/revrag` is disabled by default. It runs only when the server-only `CAREERSENTRY_RUN_KEY`, `BRIGHT_DATA_API_TOKEN`, and `DATABASE_URL` are configured. The route uses a timing-safe run-key comparison, ignores request-body target fields, and always fixes the one input to `https://www.revrag.ai/careers` and the collector to `c_mt3ctgtj2rqnwsqm8p`. Missing storage is checked before the Bright Data trigger, preventing an unstorable credit-consuming run.

Use a placeholder key in local documentation; never put a real key or token in source control:

```bash
curl -X POST http://localhost:3000/api/admin/collect/revrag \
  -H "x-careersentry-run-key: replace_with_a_long_server_only_run_key" \
  -H "Content-Type: application/json" \
  --data '{}'
```

Responses are `Cache-Control: no-store`; unauthenticated or unavailable configuration fails safely. A healthy snapshot writes its run and canonical jobs in one transaction before success is returned. A degraded/rejected result stores a sanitized run and incident but no partial canonical jobs.

Initialize a configured database with the checked-in migration:

```bash
npm run db:migrate
```

## Evidence

- [Saved RevRag run/recovery evidence](./docs/evidence/revrag-verified.json): an initial degraded 15-entry run (10 valid + 5 rejected envelopes) and a same-Collector-ID verified 10-row recovery, reduced to same-origin role fields.
- [Recovered layout-A output](./docs/evidence/layout-a-recovered.json): three CareerSentry-owned fixture roles.
- [Degraded layout-B output](./docs/evidence/layout-b-degraded.json): zero rows after the controlled fixture redesign.
- [Healing incident timeline](./docs/evidence/healing-incident.md): approval decisions, failed verification, same-Collector-ID recovery evidence, and the unresolved layout-B repair.

The evidence is intentionally honest: the RevRag history records the completed initial run, approval-gated same-ID cleanup, and verified recovery, while the layout A/B run is explicitly project-owned healing evidence. Neither surface contains application interactions or personal data.

## Architecture

```text
official careers catalog
          |
          v
Discovery collector evidence
          |
          +---- new/changed URLs ----> incremental PDP collector (future)
          |
          v
                    Zod + normalizer
                          |
             +------------+-------------+
             v                          v
        persistence                 health engine
             |                          |
             v                          v
         dashboard              healing incident/evidence
```

The project-owned `/demo-target` route supplies inspectable query-based evidence. `/demo-target/live` is the stable scraper input: its materially different A/B markup is selected server-side through `CAREERSENTRY_FIXTURE_LAYOUT`, defaults to A, and cannot be overridden by query parameters. Neither route is an external employer catalog.

## Target policy

Public visibility is not treated as permission. Before any future real collection, the target must pass:

- official corporate-to-careers provenance;
- public/no-login access;
- current Terms, robots, and site-policy review;
- Bright Data pre-built scraper overlap check;
- one-input credit and budget gate; and
- schema, provenance, and personal-data exclusion checks.

The current RevRag records reflect a completed run and approval-gated same-ID cleanup from this workspace. The initial degraded result and recovered 10-row verification are retained as saved evidence; they must not be interpreted as permission to rerun collection. When PostgreSQL is unconfigured, the dashboard labels and reads those saved records; when configured, it prefers the persisted last-known-good snapshot and exposes only sanitized run/incident metadata. Other target research remains policy evidence only and is intentionally absent from the product data.

## AI usage disclosure

Codex and user-authorized subagents are used for research, implementation, review, and tests. Bright Data Scraper Studio was used for the RevRag collector run and approval-gated same-ID cleanup; the sanitized saved verification is retained alongside the project-owned healing lab. The project owner retains the approval gate; CareerSentry validates previews and saved reruns before declaring recovery. The owner remains responsible for the architecture, generated code, and submission.

## Safety

- Public job-posting fields only.
- No logins, candidate portals, form submissions, application automation, or personal data.
- Application links and form fields are excluded from the sanitized evidence.
- Scraped content is untrusted and must be validated before rendering or reaching an LLM.
- Tokens, `.env` files, resumes, and private job-search results are excluded from the repository.
- No live Bright Data request is made by the current dashboard state.
