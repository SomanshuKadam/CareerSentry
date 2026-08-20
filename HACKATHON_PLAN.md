# CareerSentry Hackathon Source of Truth

Last updated: 2026-08-21 (Asia/Calcutta)

Status: Public repository, Vercel fixture, and custom collector verified; layout-A recovered; layout-B incident detected but repair failed safely

Repository: https://github.com/SomanshuKadam/CareerSentry

Hackathon: [Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse), August 17-23, 2026

## 1. Authority and change protocol

This file is the canonical source of truth for all CareerSentry decisions related to the Into the Scrape-Verse hackathon.

For every hackathon-related conversation or implementation task:

1. Read this file completely before proposing or making a change.
2. Treat confirmed decisions, constraints, schemas, and acceptance criteria here as authoritative.
3. Do not silently reinterpret missing details. Record material assumptions in `Open decisions` before relying on them.
4. If new research or a requested change conflicts with this file, update this file first, add an entry to `Decision log`, and only then change code or other documentation.
5. Update task status and evidence links after completing meaningful work.
6. Never place API tokens, credentials, resumes, candidate personal data, or private job-search results in this repository or file.

The private research corpus at `D:\switch` may inform requirements and test cases. It must not be copied wholesale into this public repository. Do not commit the resumes, candidate profile, job results, screenshots, or application tracker found there.

## 2. Confirmed hackathon requirements

Verified against the official pages on 2026-08-20:

- The event runs from August 17 through August 23, 2026.
- Teams may contain one to four people.
- A qualifying project must create and run at least one **custom scraper using Bright Data Scraper Studio**. Using only an existing Marketplace scraper does not qualify.
- Scraper Studio must be operated through a coding-agent workflow such as Codex, Cursor, or Claude Code.
- The main coding and design work must begin after the hackathon starts. Earlier discussion, notes, planning, and diagrams are allowed.
- Only publicly available web data may be collected. Private, login-protected, paywalled, personal, restricted, and government data are prohibited.
- The submission requires a public repository, clear README, example structured output, demo video, and clear explanation of Scraper Studio usage.
- AI coding-assistant usage must be disclosed. The participant must understand and be able to explain the code and architecture.
- Six criteria are weighted equally: potential impact, creativity and innovation, technical excellence, use of Scraper Studio, reliability and self-healing, and presentation.
- Projects are considered for Web-Slinger (Best Use of Bright Data), Suit-Up (Best UI), and Spider-Sense (Best Clean Code).
- Daily Bugle is a separate track requiring a LinkedIn post during the hackathon that tags WeMakeDevs.

Primary sources:

- [Hackathon overview, prizes, judging, and FAQ](https://www.wemakedevs.org/hackathons/scrape-verse)
- [Official rules](https://www.wemakedevs.org/hackathons/scrape-verse/rules)
- [Official resources](https://www.wemakedevs.org/hackathons/scrape-verse/resources)
- [Kickoff guide](https://www.wemakedevs.org/blogs/scrape-verse-kick-off)

## 3. Product definition

### Name and pitch

**CareerSentry** is a provenance-aware, self-healing career intelligence agent that monitors official company career sites, detects silent extraction failures, repairs its Bright Data collectors in place, and delivers fresh, explainable job matches without breaking downstream workflows.

### Problem

Career pages are heterogeneous and change frequently. A job monitor can appear successful while silently missing jobs because a selector changed, pagination stopped, an infinite-scroll boundary moved, a detail page expired, or a company changed its recruiting portal.

The prior `D:\switch` research demonstrated:

- numbered pagination, Load More, and infinite scrolling;
- JavaScript-only navigation and asynchronously rendered cards;
- hidden or stale DOM cards;
- company-to-ATS delegation and application-boundary changes;
- filters whose UI state disagrees with rendered results;
- HTTP 200 pages for expired jobs;
- Bangalore/Bengaluru and remote-location normalization;
- DNS failures, HTTP/2 failures, HTTP 403 responses, Cloudflare challenges, and broken delegated portals.

### Product promise

1. Collect jobs from a verified official corporate-to-careers path.
2. Normalize output into a stable contract.
3. Compare each run with the last known-good snapshot.
4. Detect missing fields, incomplete enumeration, anomalous counts, duplicates, and broken links.
5. Create a healing incident containing evidence and a precise prompt.
6. Heal the affected Scraper Studio collector and preview the repair.
7. Approve only a validated repair.
8. Re-run the **same Collector ID** and prove storage and UI need no change.

### Non-goals

- Scraping every company in the private 250-company list.
- Automatically applying for jobs.
- Creating accounts, signing in, uploading resumes, or filling forms.
- Resume parsing or storage.
- Building a universal autonomous browser before one vertical slice works.
- Treating an aggregator or independently discovered ATS as authoritative.
- Maximizing the number of Bright Data products instead of using Scraper Studio deeply.

## 4. Bright Data capability map and decisions

### 4.1 Mandatory core: Scraper Studio

Scraper Studio generates a custom scraper from a URL and natural-language data request. Its AI Agent produces the schema, code, navigation, validation, and error handling. Collectors can run manually, on a schedule, through the CLI, or through the API, with JSON, NDJSON, CSV, or XLSX output.

| Scraper type | CareerSentry interpretation | Decision |
|---|---|---|
| PDP | One job-detail URL to one complete record | Use for new or changed details |
| Discovery | One career-listing URL to summary rows | Use for catalog enumeration |
| Discovery + PDP | Enumerate and open every detail | Avoid initially because cost grows as `1 + N` |
| Search | Keyword/country to matching rows | Use only if the target's official search requires it |
| Sitemap | Domain/sitemap to per-page details | Use only if the careers catalog exposes an appropriate sitemap |

Efficiency decision: use a **Discovery collector** for catalog enumeration and a **PDP collector** only for new or changed detail URLs. Do not reopen every detail on every run.

Before creating a collector, verify there is no applicable pre-built scraper for the target. The custom AI Agent is intended for long-tail sites that the Marketplace does not cover.

Sources:

- [AI Agent and five scraper types](https://docs.brightdata.com/datasets/scraper-studio/ai-agent)
- [CLI create, run, and heal](https://docs.brightdata.com/datasets/scraper-studio/build-with-the-cli)
- [Coding-agent prompts](https://docs.brightdata.com/datasets/scraper-studio/coding-agent-prompts)

### 4.2 Self-Healing

The Self-Healing tool refactors an existing scraper using a plain-language prompt. It can repair missing fields and add or remove output fields.

CareerSentry policy:

- Use `bdata scraper heal` with a specific incident and representative URL.
- Keep the prompt under 1,000 characters.
- Default to the approval gate.
- Validate the preview against the contract and historical baseline.
- Reject unclear or invalid repairs, preserving the prior production collector.
- Use `--auto-approve` only after deterministic validation exists and only as a stretch feature.
- Display the same `c_*` Collector ID before and after repair.

Source: [Scraper Studio Self-Healing](https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool)

### 4.3 Scraper Studio API

A published collector is triggered with `POST /dca/trigger`; its `j_*` snapshot is retrieved through `GET /dca/dataset?id=<snapshot_id>`. The application will use these APIs rather than invoking shell commands from the web server.

- `BRIGHT_DATA_API_TOKEN` belongs only in local/deployment secret storage.
- Collector IDs are not bearer secrets but should still be configured cleanly.
- `.env*` remains ignored except `.env.example`.

Source: [Scraper Studio API quickstart](https://docs.brightdata.com/datasets/scraper-studio/quickstart)

### 4.4 Browser API

Browser API supplies managed remote browsers with Playwright, Puppeteer, or Selenium support for JavaScript-heavy pages requiring clicks, scrolling, filters, or multi-step interaction.

Decision: Browser API is a **target-diagnostic and exceptional-navigation tool**, not the primary production extractor. Use it only when onboarding proves Scraper Studio-generated navigation needs interactive support. Scraper Studio must remain central.

Source: [Browser API introduction](https://docs.brightdata.com/scraping-automation/scraping-browser/introduction)

### 4.5 Web Unlocker API

Web Unlocker accepts a public target URL and can return unblocked HTML, JSON, Markdown, or a screenshot while managing retries and proxy selection.

Decision: use direct Web Unlocker only for access diagnostics, screenshots, or a narrowly justified fallback. It must not replace the custom Scraper Studio collector. The target must remain public and compliant with rules and site policies.

Source: [Web Unlocker overview](https://docs.brightdata.com/scraping-automation/web-unlocker/introduction)

### 4.6 Bright Data MCP and Search

MCP exposes search, page scraping, structured extraction, and browser actions to agents.

- MCP is optional for diagnostics and investigation.
- Search may locate or verify a corporate/careers entry URL.
- Search results, LinkedIn, aggregators, and independent ATS queries cannot replace the official career catalog.
- Treat scraped content as untrusted; validate it before passing it to an LLM.

Source: [Bright Data MCP capabilities and security guidance](https://docs.brightdata.com/ai/mcp-server/faqs)

### 4.7 Out of MVP scope

- Marketplace datasets as the core: Marketplace-only builds are ineligible.
- Crawl API: excessive for the initial catalog flow.
- Search/SERP API as a job source: conflicts with provenance.
- Direct proxy products: other chosen products already abstract proxy management.

### 4.8 Hard credit budget

The Bright Data account has a hard ceiling of **5,000 included credits/requests** and no paid overage is authorized. The API token is supplied out of band and must never be written to this plan, committed, printed, logged, or shared with subagents.

Budget policy:

- Treat 5,000 as an absolute lifetime ceiling for this hackathon account unless the user explicitly changes it.
- Plan to consume no more than 3,000, leaving at least 2,000 for final verification, healing, and accounting uncertainty.
- Check the Bright Data dashboard or supported usage endpoint before and after material live runs; record only numeric usage, never credentials.
- A target spike may process at most 10 inputs until actual credit behavior is measured.
- Do not run Discovery + PDP over the full Nutanix catalog during the spike.
- Prefer one Discovery run followed by PDP only for new/changed URLs.
- Reuse saved, sanitized snapshots for UI development and automated tests.
- Subagents must not receive the token and must work only with fixtures or public unauthenticated research.
- Stop live Bright Data calls if measured remaining balance reaches 2,000 until the plan is explicitly revised.
- Product UI must label the 3,000-credit value as a configured hackathon spend ceiling. It must not display or imply an account balance unless a supported Bright Data usage source has verified it.

Initial ledger:

| Workstream | Planned maximum | Actual used | Status |
|---|---:|---:|---|
| CLI authentication/capability checks | 0 data credits expected | 0 | Browser-authenticated CLI reports $52 balance, $0 pending, and $0 zone cost; credit conversion remains unknown |
| Nutanix target spike | 400 | 0 | Not started |
| Real collector development | 1,000 | 1 custom build + 4 single-input fixture runs; credits unreported | Layout A returned 3; layout B returned 0; monetary ledger last remained unchanged |
| Healing experiments | 800 | 4 same-collector heal jobs: 1 failed verification, 1 rejected, 1 recovered, 1 layout-B approval failed unchanged; credits unreported | No replacement collector; final monetary ledger unchanged |
| Demo and final verification | 800 | 0 | Reserved |
| Safety reserve | 2,000 | 0 | Do not consume without plan update |

## 5. Target selection

### 5.1 Eligibility gates

A target must have:

1. A verified corporate-to-careers provenance path.
2. A public catalog without authentication or personal-data requirements.
3. Real, currently visible vacancies.
4. No applicable pre-built scraper making a custom scraper redundant.
5. Enough complexity to demonstrate meaningful Scraper Studio value.
6. A collection path consistent with hackathon rules and site policies.
7. A feasible validation path within the remaining time.

### 5.2 Permission-gated candidate: Nutanix Careers

- Official careers entry: https://careers.nutanix.com/en/
- Official jobs catalog: https://careers.nutanix.com/en/jobs/

Why it is first:

- The 2026-08-13 private audit reached it through Nutanix's corporate path but was blocked by Cloudflare HTTP 403 before the catalog rendered.
- The current public experience advertises 54 India vacancies and 48 Research & Development vacancies, providing meaningful live data.
- It has search/filter behavior, listing enumeration, and job details suited to Discovery plus incremental PDP collectors.
- Recovering a previously inaccessible official catalog gives a clear Bright Data before/after story.

Nutanix is **not approved for live collection**. Its Terms of Use effective June 1, 2026 prohibit robots, spiders, scrapers, and other automated access without express written permission. No Bright Data product may be used against Nutanix unless that permission is obtained and recorded outside the repository.

Technical and provenance research is retained in `docs/nutanix-target-spike.md`, but its prompts are conditional on written permission.

Spike status:

- [x] Reconfirm the official corporate-to-careers path.
- [x] Confirm jobs remain public without login.
- [ ] Obtain express written permission for automated collection. **Hard blocker.**
- [ ] Check Marketplace/pre-built coverage for Nutanix careers.
- [ ] Create a custom Discovery collector through Codex.
- [ ] Return job ID, title, location, department/team, and company job URL.
- [ ] Prove complete enumeration for a constrained India or India R&D subset.
- [ ] Create or validate PDP extraction for representative job URLs.
- [ ] Record page usage, duration, and field coverage.
- [ ] Confirm compliance with site policies and hackathon rules.

### 5.3 Active target-validation order

| Rank | Candidate | Prior failure and assessment |
|---:|---|---|
| 1 | Canva Careers | **Policy-gated.** Official provenance and public catalog are proven, but current Canva Terms prohibit scraping the Canva Service and do not clearly state whether the separate Careers host is in scope. No live call without a recorded owner/legal interpretation. |
| 2 | HackerEarth Careers | **Policy-gated.** Official HackerEarth -> Trakstar provenance is proven, but the board is split across Trakstar/JazzHR and Trakstar terms contain material automated-gathering restrictions. A bounded public-card read requires an explicit project-owner interpretation before a live call. |
| 3 | Salesforce Careers | HTTP 403 Access Denied. Rich public data but large scope; constrain aggressively. |
| 4 | PayPal Careers | Cloudflare HTTP 403. Useful public catalog but potentially less time-safe. |
| 5 | GitHub Careers | Official careers returned HTTP 403. Validate inventory and pre-built overlap. |
| 6 | Uber Careers | Official path reached jobs.uber.com and stopped at Cloudflare 403. Rich but complex. |
| 7 | Arista Networks | Client Challenge before cards. Do not select if access depends on prohibited or questionable interaction. |

### 5.4 Rejected as primary unless facts change

- Blinkit: the public careers page is mainly a culture page; `jobs.blinkit.com` presents an OTP flow rather than a public authoritative vacancy catalog.
- Unacademy: the delegated Darwinbox endpoint exposed only a tenant shell. Bright Data cannot extract vacancies the source does not publish.
- Chargebee: the official Careers action routed only to LinkedIn Jobs, with no authoritative company catalog.
- Cure.fit: the catalog endpoint returned origin-side HTTP 500. Unblocking cannot repair an origin that publishes no usable response.
- Canva through an independently discovered SmartRecruiters URL: acceptable only after proving the official Canva handoff.

### 5.5 Controlled healing fixture

Use a small public career-catalog fixture owned by the project with layout A and B. It complements, but never replaces, the real company collector.

The demo must show:

1. The collector works on layout A.
2. Layout B changes selectors/nesting and causes invalid fields.
3. CareerSentry detects the failure.
4. Scraper Studio proposes a repair.
5. The preview passes validation and is approved.
6. The same Collector ID succeeds on layout B.
7. No downstream schema or code changes.

## 6. MVP user experience

### Screens

1. **Overview**: new, changed, and closed roles; degraded collectors; last run.
2. **Jobs**: title, company, location, workplace, date, match explanation, official URL, verification time.
3. **Companies**: corporate URL -> careers entry -> catalog provenance and status.
4. **Collector health**: row count, field coverage, duplicates, invalid links, last known-good run.
5. **Incident detail**: failed checks, broken sample, heal prompt, preview, approval, recovery evidence.
6. **Run history**: snapshots and job lifecycle changes.

Use a fictional demo profile: Software/Backend Engineer or SWE II; Bengaluru/Bangalore or Remote India; approximately two years; Java, Python, TypeScript, APIs, and distributed systems. Matching is explainable and rules-based for MVP.

## 7. Canonical data contracts

```ts
type JobRecord = {
  companyId: string;
  jobId: string;
  title: string;
  location: string;
  workplaceType: "remote" | "hybrid" | "onsite" | "unknown";
  department?: string;
  employmentType?: string;
  publishedAt?: string;
  experienceText?: string;
  description?: string;
  companyJobUrl: string;
  applyUrl?: string;
  sourceCatalogUrl: string;
  collectorId: string;
  collectedAt: string;
};
```

Supporting entities: `CompanySource`, `Collector`, `CollectorRun`, `JobVersion`, `HealthIncident`, `CandidatePreference`, and `MatchExplanation`.

Rules:

- Deduplicate first by company job ID, then canonical company job URL.
- Do not merge distinct requisitions merely because titles match.
- Normalize Bangalore and Bengaluru while preserving the source label.
- Never invent dates; use `date not published` when necessary.
- Scraper Studio raw output may expose the visible requisition as `job_id_value`; the ingestion boundary maps that explicit source alias to canonical `JobRecord.jobId`. Missing both `job_id` and `job_id_value`, conflicting values, or deriving identity only from a URL remains invalid.

## 8. Health and healing policy

A run is degraded for:

- implausible row-count drop or zero after a non-empty baseline;
- required-field coverage below threshold;
- widespread null title, location, job ID, or URL;
- duplicate-rate spike;
- missing pagination/Load More completion evidence;
- details that resolve but no longer contain active job content;
- unexpected schema change;
- disappearing application actions on otherwise active details.

```text
healthy -> degraded -> awaiting_heal -> preview_ready -> approved -> verifying -> recovered
                         |                  |              |
                         +------------> needs_review <-----+
```

Repair acceptance requires:

- unchanged Collector ID;
- restored required fields and valid schema;
- plausible count and duplicate rate;
- URLs within the official/delegated provenance;
- representative inputs passing;
- the failing regression fixture passing;
- no downstream storage/UI change;
- a sanitized before/broken/preview/recovered evidence bundle.

## 9. Technical architecture

Preferred stack, changeable only through the Decision log:

- Next.js and TypeScript;
- PostgreSQL through Neon or Supabase;
- Drizzle ORM and Zod;
- Vitest and Playwright;
- GitHub Actions for tests and optional schedules;
- Bright Data CLI for creation, development, and healing;
- Scraper Studio API for application-triggered runs.

```text
Official careers catalog
          |
          v
Scraper Studio Discovery collector
          |
          +---- new/changed URLs ----> PDP collector
          |                                |
          +---------------+----------------+
                          v
                 Normalizer + Zod validator
                          |
             +------------+-------------+
             v                          v
       PostgreSQL                  Health engine
             |                          |
             v                          v
         Next.js UI            Healing incident/Codex
```

No server route may execute arbitrary shell commands. Production collection uses the Bright Data API; CLI operations remain explicit development/agent workflows.

## 10. Implementation sequence

### Phase A: repository and target proof

- [x] Create public repository.
- [x] Create canonical plan.
- [x] Research Scraper Studio, API, Self-Healing, Browser API, Web Unlocker, and MCP.
- [x] Rank previously blocked career targets.
- [x] Add repository instructions and secret-safe `.gitignore`.
- [x] Add README summary and AI-usage disclosure.
- [x] Complete Nutanix read-only target/policy audit; live spike blocked pending written permission.
- [x] Complete Canva read-only target/policy audit; live spike paused on Terms-scope ambiguity.
- [x] Complete HackerEarth read-only target/policy audit; live spike paused for an explicit policy interpretation.
- [ ] Perform one-input live spike only after a target passes policy and provenance gates.
- [ ] Record selected target in Decision log.

Exit: a real custom collector returns valid structured data from an eligible official catalog.

### Phase B: vertical slice

- [x] Scaffold the TypeScript application.
- [x] Define Zod contracts and normalized fixtures.
- [x] Implement a bounded Scraper Studio trigger/poll client and verify it with mocked responses.
- [ ] Trigger and poll a collector through the API.
- [ ] Store a snapshot and normalized jobs.
- [x] Display fixture jobs and provenance in a minimal UI; live collector data remains pending.

Exit: official catalog -> Bright Data -> storage -> UI works end to end.

### Phase C: reliability and self-healing

- [x] Implement health checks and incident states with unit tests.
- [x] Implement the project-owned layout A/B fixture locally.
- [x] Deploy layout A/B fixture at `https://career-sentry.vercel.app/demo-target`.
- [x] Capture a passing layout-A run with three distinct requisitions on the same collector.
- [x] Break extraction using layout B; the same collector returned zero rows against a three-row baseline.
- [x] Detect the empty layout-B run automatically against the three-row baseline.
- [x] Heal, preview, approve, and re-run the same collector for the raw requisition-schema recovery.
- [ ] Recover layout-B selectors; Scraper Studio failed during approval and left the collector unchanged.
- [x] Add recovered-output and zero-row degradation regression tests.

Exit: reproducible same-Collector-ID recovery is visible and documented.

### Phase D: product finish

- [x] Complete fixture-backed Overview, Jobs, Companies, Health, Incident, and History screens.
- [x] Add fictional preferences and explainable matching.
- [ ] Add loading, empty, degraded, recovered, and error states.
- [x] Add fixture-backed demo mode so judges can inspect without spending credits.
- [x] Deploy the fixture-backed application to Vercel and verify representative public routes.

### Phase E: submission

- [x] README with setup, architecture, provenance, limitations, safety, and AI disclosure.
- [x] Sanitized structured output.
- [ ] Diagram and screenshots.
- [ ] Demo video.
- [x] Confirm no tokens, `.env`, personal data, or private files are present in the staged repository content before the first commit.
- [ ] Submit before August 23 deadline.
- [ ] Publish LinkedIn build post and tag WeMakeDevs if entering Daily Bugle.

## 11. Test strategy

Unit/contract tests:

- schema validation and optional fields;
- Bangalore/Bengaluru normalization;
- URL/job-ID deduplication;
- new/updated/closed lifecycle detection;
- field-coverage and count-anomaly scoring;
- healing acceptance/rejection;
- provenance allow-list validation.

Fixtures:

- sanitized known-good real output;
- missing fields, zero rows, duplicates, and expired HTTP 200 detail;
- controlled layouts A/B;
- recovered output with unchanged Collector ID.

End-to-end:

- trigger -> poll -> normalize -> persist -> render;
- degraded run creates incident;
- approved preview transitions to recovered;
- secrets never reach client bundles or logs.

## 12. Demo storyboard

Target length: approximately three minutes.

1. Explain silent career-scraper failures.
2. Show the selected real official catalog in CareerSentry.
3. Show jobs, provenance, health, and stable `c_*` ID.
4. Switch the controlled target from layout A to B.
5. Re-run and show the incident.
6. Ask Codex to heal through Bright Data CLI.
7. Review and approve the preview.
8. Re-run with the same Collector ID.
9. Show the recovered UI and unchanged schema.
10. End on real-company results, tests, and history.

> The page changed, the collector healed in place, and every downstream job workflow kept working.

## 13. Safety, compliance, and ethics

- Collect public career data only.
- Do not access login-protected, paywalled, personal, restricted, or government data.
- Do not submit applications or interact with forms beyond verifying a public application boundary.
- Respect site policies, reasonable rates, and explicit restrictions.
- Managed access does not override legal, contractual, or hackathon constraints.
- Use delegated ATS data only when reached through the official company path; record provenance.
- Validate scraped content as untrusted before sending it to an LLM or rendering HTML.
- Never commit tokens, credentials, resumes, candidate profiles, or private results.
- Use a fictional profile in fixtures, screenshots, and demos.

## 14. Open decisions

- Final real company target remains unresolved: Nutanix requires written permission; Canva has Terms-scope ambiguity; HackerEarth/Trakstar requires an explicit project-owner policy interpretation. Implementation proceeds fixture-first without live company calls.
- Whether Discovery plus incremental PDP fits remaining time.
- Database provider: Neon or Supabase.
- Deployment provider: Vercel. The CLI was authenticated by the user on 2026-08-21; deploy the secret-free fixture as a normal project deployment and verify it before any collector call.
- Whether MCP adds visible value after the Scraper Studio core.
- Whether scheduled runs fit credit and time constraints.
- Exact submission closing time/timezone; confirm from the form before final day.
- How to translate the browser-authenticated account's $52.00 balance into the hackathon's 5,000-credit accounting. Until confirmed, both the 3,000-credit spend ceiling and the monetary before/after ledger apply.

## 15. Decision log

### 2026-08-20 - Canonical plan established

- `HACKATHON_PLAN.md` is the source of truth for future hackathon work.
- CareerSentry remains provenance-aware self-healing career intelligence.
- Scraper Studio is mandatory and central.
- Discovery plus incremental PDP is the cost-efficient design.
- Nutanix Careers is the first validation candidate because the prior official-path audit was blocked and the current public site has substantial India/R&D inventory.
- Canva, HackerEarth, Salesforce, PayPal, GitHub, Uber, and Arista are ordered fallbacks.
- A controlled public layout fixture makes healing reproducible but cannot replace the real collector.
- Browser API, Web Unlocker, MCP, and Search are supporting tools rather than substitutes for Scraper Studio.

### 2026-08-20 - Implementation authorized with a hard credit ceiling

- Implementation is authorized to begin using Luna Max subagents for bounded, independent workstreams.
- The account is limited to 5,000 included Bright Data credits/requests; paid overage is not authorized.
- Live collection is budgeted conservatively, fixtures are mandatory for development/tests, and at least 2,000 credits remain reserved until an explicit plan change.
- The Bright Data token is never recorded in repository files or given to subagents.

### 2026-08-20 - CLI verified; automated budget visibility unavailable

- Official Bright Data CLI version 0.3.5 runs successfully.
- No data collection or scraper-generation call was made during verification.
- The token cannot access account-balance or zone-cost endpoints (HTTP 403), and the CLI reported no active zones.
- Until dashboard usage can be checked, target validation is restricted to one input per live run and all repeat development uses saved fixtures.

### 2026-08-20 - Nutanix live collection rejected without written permission

- Read-only research confirmed the official public catalog and its technical suitability.
- Nutanix Terms of Use currently prohibit automated scraping without express written permission.
- No Nutanix collector was created and no collection credits were spent.
- Nutanix is permission-gated; Canva becomes the active validation candidate, subject to the same terms, robots, provenance, Marketplace, and public-access checks.

### 2026-08-20 - Canva live collection paused on Terms-scope ambiguity

- Read-only research proved Canva corporate -> Life at Canva -> public catalog provenance and a SmartRecruiters application boundary.
- The Careers host exposes public jobs and a generic robots allow signal, but Canva Terms effective August 19, 2026 prohibit scraping the Canva Service and do not clearly resolve whether the separate Careers host is included.
- No Canva collector was created and no collection credits were spent.
- Canva is policy-gated pending a recorded owner/legal interpretation; HackerEarth becomes the current read-only validation candidate.

### 2026-08-20 - HackerEarth live collection paused; fixture-first implementation selected

- Read-only research proved HackerEarth corporate -> Trakstar provenance and separately documented its JazzHR careers embed.
- The two public inventories differ, and Trakstar terms contain material restrictions around automated information gathering within its system.
- No HackerEarth collector was created and no credits were spent.
- Live company calls remain paused. The project-owned public layout A/B fixture is the approved Scraper Studio target for create/run/heal implementation while a real-company policy decision is resolved.

### 2026-08-21 - Local fixture-first vertical slice verified

- Implemented the Next.js/TypeScript dashboard with fixture-backed Overview, Jobs, Companies, Collector Health, Incidents, and Run History screens.
- Implemented Zod contracts, normalization, deduplication, lifecycle diffing, health evaluation, and a bounded Bright Data API client. The client caps trigger batches at 10 inputs and has no browser-exposed token path.
- Implemented the owned public demo catalog with deterministic layout A/B DOM changes and three fictional job-detail pages. It contains no forms, accounts, credentials, personal data, or application action.
- Verified `npm run typecheck`, 15 Vitest tests across 6 files, and the optimized Next.js production build with 21 generated pages.
- Verified nine representative production routes returned HTTP 200 and visually inspected the Overview and layout-B fixture at 1440 x 1000.
- Replaced a fictional credit-balance display with a clearly labeled 3,000-credit configured spend ceiling plus 2,000-credit reserve. The UI explicitly states that it is not a live balance.
- No live collector was created, no company site was collected, and zero Bright Data data credits were spent in this implementation slice.

### 2026-08-21 - Vercel selected for the controlled fixture

- Vercel is selected because the application is Next.js and the fixture requires a publicly reachable dynamic query parameter for layouts A and B.
- Stored GitHub authentication is expired and the Vercel CLI is logged out.
- An official `vercel deploy --temporary` deployment is authorized for the controlled public fixture only. It receives no Bright Data token or other runtime secret.
- The temporary URL is suitable for the bounded collector/healing experiment but is not considered the final deployment; it must be claimed or replaced under the user's Vercel account before submission.

### 2026-08-21 - Vercel CLI authenticated

- The user completed Vercel device authorization; an unclaimed temporary deployment is no longer required.
- The controlled fixture may be deployed as an authenticated Vercel production project with no runtime secrets.
- Public layout A and B URLs must return HTTP 200 and show only fictional project-owned job data before they are passed to Scraper Studio.

### 2026-08-21 - Controlled fixture deployed and verified

- Created the authenticated Vercel project `career-sentry` in the user's current scope and configured its framework preset as Next.js with automatic output detection.
- Production alias: `https://career-sentry.vercel.app`.
- Verified HTTP 200 for Overview, layout A, layout B, and fictional job detail `CS-101`.
- Verified layout A contains `CS-101`, `CS-102`, and `CS-103` and explicitly states that no login or application form exists.
- The deployment received no API token or other runtime secret. Bright Data usage remains zero before collector creation.
- The owned layout-A URL is approved as the single input for the first custom Discovery collector. The unresolved real-company target remains a separate requirement for the complete product story.

### 2026-08-21 - Bright Data browser authentication and pre-run ledger

- Used the CLI browser authorization flow instead of placing the supplied API token in a command, file, environment variable, or log.
- The CLI created its required `cli_unlocker` and `cli_browser` zones automatically; creating the zones transferred no data.
- Before the first collector build, the CLI reported a $52.00 balance, $0.00 pending charge, $0.00 total zone cost, and 0 B bandwidth.
- The dollar-to-credit conversion is not established, so the stricter 3,000-credit planned ceiling and 2,000-credit reserve remain authoritative alongside monetary before/after checks.

### 2026-08-21 - First custom collector and layout-A baseline

- Created custom Scraper Studio collector `c_mt1wzptjco00s7w0p` through the Codex-operated Bright Data CLI using the single owned input `https://career-sentry.vercel.app/demo-target?layout=a`.
- Collector creation completed after one AI generation job with retries disabled. No second collector was created.
- The first explicit run returned exactly three fictional jobs with correct titles, locations, departments, employment types, and absolute project-owned detail URLs.
- Health validation marked the baseline degraded because the raw schema contains `job_id_value` instead of the requested `job_id`. Platform metadata fields `product_page_url` and `input` are also present and will be ignored by normalization.
- Immediately after the build and run, the CLI still reported $52.00 balance, $0.00 pending charge, $0.00 zone cost, and 0 B on CLI zones. Credit usage is not exposed, so the run count remains the controlling ledger.
- The same collector must be healed through the default approval gate to rename `job_id_value` to `job_id`; creating a replacement collector is prohibited for this incident.
- The approval-gated heal completed in 12 polls with status `awaiting_approval`. Its representative preview restored `job_id: "CS-101"` and preserved title, location, department, employment type, and absolute company job URL on collector `c_mt1wzptjco00s7w0p`.
- `product_page_url` remains Bright Data metadata and is ignored by normalization. The validated heal is approved for explicit save, followed by a fresh three-row layout-A verification run.
- Post-approval verification rejected that repair: the saved template returned all three rows but omitted both `job_id` and `job_id_value`, despite the preview containing `job_id`. The collector remains `c_mt1wzptjco00s7w0p`; the incident transitions to `needs_review`, not `recovered`.
- Balance and zone accounting remained $52.00 / $0.00 pending / $0.00 zone cost after the rejected verification. One sharper same-collector heal is authorized to extract the visible per-card requisition text explicitly; it must pass another approval gate and full rerun.
- The authorized sharper heal exceeded its 10-minute CLI poll window and 12-minute process bound without writing an output artifact. No retry or parallel heal was started. Its remote state is unknown and must be checked in the Scraper Studio dashboard before any further mutation.
- Post-timeout accounting still reports $52.00 balance, $0.00 pending charge, $0.00 zone cost, and 0 B. Live heal/run calls are paused; local ingestion and regression fixtures may continue without credits.
- A later read-only progress check showed the existing job reached `pending_answer` / `user_approval`; no new heal was triggered. Its preview still emitted `job_id_value: "CS-101"` rather than `job_id`, so it fails the contract and is explicitly authorized for rejection.
- The second preview was rejected and never saved. Repeated generation evidence indicates Scraper Studio treats `job_id_value` as the stable raw requisition field, so the ingestion adapter will map it explicitly to canonical `jobId` while keeping storage/UI contracts unchanged.
- Because the first approved repair removed the previously working raw requisition field, one final approval-gated same-collector heal is authorized only to restore `job_id_value`. If its preview or verification fails, no further live healing attempts are permitted without a new plan decision.
- The final bounded restore heal reached `awaiting_approval` after 21 polls. Its representative preview contains exactly `job_id_value`, `title`, `location`, `department`, `employment_type`, and `company_job_url`, with `job_id_value: "CS-101"`. It is approved for save and one full layout-A verification run.
- The approved restore completed with `status=done` and saved the same collector `c_mt1wzptjco00s7w0p`.
- The full verification run returned exactly three rows with distinct `CS-101`, `CS-102`, and `CS-103` requisitions, complete business fields, no duplicates, and URLs restricted to `https://career-sentry.vercel.app/demo-target/jobs/`. Validation passed.
- Post-recovery accounting remained $52.00 balance, $0.00 pending, $0.00 zone cost, and 0 B. One single-input layout-B drift measurement is within the approved budget; its output must be validated before any further heal decision.
- The bounded layout-B run returned an empty array. Against the three-row layout-A baseline this is an unambiguous count anomaly and controlled extraction failure; no company site or personal data is involved.
- Layout B uses `section.role-tile`, title/link under `h2 a`, department in `.role-tile__team`, and labeled metadata values under `Based in`, `Role type`, and `Requisition`. One approval-gated same-collector heal is authorized using these owned selectors, followed by preview validation and one verification run only.
- The layout-B heal reached `awaiting_approval` after 368 polls. Its representative preview preserves a correct layout-A `CS-101` row and the six-field raw schema.
- CLI `--url` is only woven into the next-step hint and is not sent to the heal call, so the approval preview cannot execute layout B directly. Given the precise project-owned selectors, approval is permitted only with an immediate saved-template layout-B rerun; zero rows, missing fields, wrong provenance, or duplicates mean unrecovered and prohibit further live heals.
- Scraper Studio returned `status=failed` while approving the layout-B repair and explicitly reported that collector `c_mt1wzptjco00s7w0p` was unchanged. No further live heal was attempted.
- Final accounting still reported $52.00 balance, $0.00 pending charge, $0.00 zone cost, and 0 B. Credit conversion remains unavailable; exact build/run/heal counts above are the controlling usage ledger.
- Added sanitized recovered/degraded evidence, a strict raw-to-canonical ingestion adapter, and integration tests proving the recovered three rows are accepted while the zero-row layout-B snapshot is degraded. Final verification: TypeScript passed, 24 Vitest tests passed across 8 files, and the 21-page production build passed.

### 2026-08-21 - First public repository implementation published

- Created root commit `44218fb` with the application, canonical plan, research, tests, and sanitized Scraper Studio evidence.
- Pushed `main` to `https://github.com/SomanshuKadam/CareerSentry` and configured the local branch to track `origin/main`.
- The pre-commit credential scan found no API token, credential-shaped UUID, `.env` secret file, personal data, resume, or private job-search output. Only documented placeholders are present.
