# Nutanix target spike

Research date: 2026-08-20 (Asia/Calcutta). This is a read-only public-web audit. No Bright Data token, collector, authenticated request, or live Bright Data run was used.

## Decision

Nutanix is a technically strong candidate but is **not approved for live collection**. The corporate path and public catalog are real, current, and rich enough for a Discovery plus incremental PDP slice. However, the Nutanix Terms of Use currently prohibit using a robot, spider, scraper, or other automated means to access its Sites without Nutanix's express written permission (section 12.1.6). The careers footer links to those terms, which have an effective date of June 1, 2026. Bright Data's proxy or unblocking layer does not override that restriction.

Do not create or run a Nutanix collector until written permission covering this use is in hand and recorded outside this repository. Until then, use the controlled fixture for healing work and validate the next target in the plan's fallback order.

## Corporate-to-careers provenance

The official Nutanix corporate URLs redirect to the branded careers site:

```text
https://www.nutanix.com/company/careers -> https://careers.nutanix.com/en/
https://www.nutanix.com/careers         -> https://careers.nutanix.com/en/
```

The careers homepage explicitly directs applicants to the official catalog at `https://careers.nutanix.com/en/jobs/`. The catalog, listing cards, and representative detail pages are publicly readable without a candidate account. Login is presented for application-status access, not for browsing vacancies. The public detail page's `Apply Now` link leaves the careers site for an `app.jobvite.com` URL; the spike must record that boundary but must not follow or submit the application form.

Evidence:

- [Nutanix corporate Careers redirect](https://www.nutanix.com/company/careers) (redirect target and public homepage).
- [Nutanix Careers homepage](https://careers.nutanix.com/en/) (official catalog link, public vacancy counts, candidate-login boundary).
- [Nutanix jobs catalog](https://careers.nutanix.com/en/jobs/) (public cards and links to detail pages).
- [Representative public PDP: SDET/QA, Pune](https://careers.nutanix.com/en/jobs/32377/member-of-technical-staff-3-sdetqa-python-plus-kubernetes-4-6-years/) (requisition ID, team, location, description, work arrangement, Jobvite Apply Now).
- [Representative public PDP: Senior Systems Engineer, Paris](https://careers.nutanix.com/en/jobs/32274/senior-systems-engineer-global-accounts/) (numeric ID, category, location, description, remote work arrangement, pay transparency, Jobvite Apply Now).
- [Nutanix Careers FAQ](https://careers.nutanix.com/en/how-we-hire-faqs/) (the expected work location is included in every job posting; application status requires login).

## Catalog mechanics observed

The default catalog exposes 20 cards per page and numbered pagination with an ellipsis and `Next Page`. Public pages observed during this audit included 11-12 pages and query links of the following forms:

```text
https://careers.nutanix.com/en/jobs/
https://careers.nutanix.com/en/jobs/?page=2
https://careers.nutanix.com/en/jobs/?country=India&location=Bangalore&page=2&pagesize=20
https://careers.nutanix.com/en/jobs/?orderby=0&page=2&pagesize=20&radius=100&team=Engineering
```

The expanded filter UI exposes:

- keyword search;
- Country (including India);
- Location (including Bangalore, Pune, and Remote);
- Team (including Engineering, Product Support, Professional Services, and Sales);
- Sub Team; and
- Job Type (Full-Time, Part-Time, Internship, New Grad, Fixed-Term Contract, Talent Community).

The homepage's user-facing `Research & Development` label appears on cards as `Engineering`; that mapping should be verified in the collector rather than assumed.

Important reliability finding: a crawl of the URL containing `country=India&location=Bangalore&page=2&pagesize=20` reported 241 matching jobs but began with SLED Account Manager (Los Angeles), Resident Consultant (Singapore), Director (London), and San Jose roles. A separate crawl of the URL containing `team=Engineering` also returned mixed teams. This may be a stale-index/cache artifact or a site-side filter problem, but it is enough to make URL parameters untrusted. The Discovery collector must use the visible controls where possible and validate every emitted row against the selected facets. A filter mismatch is a failed run, not a reason to widen the crawl.

Evidence:

- [Default catalog, current public pagination](https://careers.nutanix.com/en/jobs/) (20-card page and numbered/next navigation).
- [Public filtered URL showing controls and mixed results](https://careers.nutanix.com/en/jobs/?country=India&location=Bangalore&page=2&pagesize=20) (Country, Location, Team, Sub Team, Job Type controls; mixed-country rows despite query).
- [Public team-query URL](https://careers.nutanix.com/en/jobs/?orderby=0&page=2&pagesize=20&radius=100&team=Engineering) (query shape and mixed result evidence).
- [India location page](https://careers.nutanix.com/en/locations/india/) (public India inventory and examples of Bangalore/Pune cards).
- [Careers human sitemap](https://careers.nutanix.com/en/sitemap/) (public sitemap page; no machine-readable job-sitemap permission was inferred).

Counts are volatile. Public crawls during the research window reported approximately 220-226 catalog rows and homepage regional counts such as 54-57 India vacancies. These are smoke-test observations, not a fixed baseline.

## Likely output fields

| Surface | Observed field | Collector treatment |
| --- | --- | --- |
| Listing card | requisition ID, numeric or `n`-prefixed | Required `jobId`; deduplicate before URL fallback |
| Listing/PDP | title | Required `title`; preserve source text |
| Listing/PDP | location, including multi-location strings | Required `location`; preserve source label and normalize only downstream |
| Listing/PDP | category/team such as Engineering or Product Support | Required `department` |
| PDP | job description sections and headings | Required `description`; exclude global nav/footer boilerplate |
| PDP (variable) | Work Arrangement: Hybrid, Remote, or similar | `workplaceType` only when explicit; otherwise `unknown` |
| PDP (variable) | employment type | Optional; null when not explicitly shown |
| PDP (variable) | pay transparency/salary range | Optional detail; do not infer or normalize absent values |
| PDP (variable) | application-deadline language | Optional `publishedAt` only if an actual date is printed; do not turn "40 days from posting" into a date |
| PDP | `Apply Now` outbound Jobvite link | `applyUrl` may be recorded as a link, but do not open it |
| Collector input | official catalog/detail URL | Required `companyJobUrl` and `sourceCatalogUrl` |

The page footer, How We Hire content, candidate-login links, talent-community form, and application form are not job-record fields. Do not collect candidate or applicant personal data.

## Robots and site-policy signals

No positive `robots.txt` permission was located in the public indexed material. A direct fetch of `https://careers.nutanix.com/robots.txt` was not available in the research browser, so do not infer an allow or deny from that fetch result; the absence of a discovered robots file is not an allow signal. The decisive signal is the [Nutanix Terms of Use](https://www.nutanix.com/legal/terms-of-use), effective June 1, 2026:

- section 12.1.6 disallows any robot, spider, scraper, or other automated access without Nutanix's express written permission and that of any affected third party;
- section 12.1.11 separately disallows scalability testing, load testing, probing, scanning, penetration, or vulnerability testing without express prior written authorization; and
- section 12.3 applies the Terms and any area-specific rules to use of the Sites.

Therefore, public visibility and a successful browser read do not satisfy CareerSentry's policy gate. Do not use Web Unlocker, Browser API, Scraper Studio, or an independently discovered ATS URL to bypass this gate. The Jobvite URL is an application boundary, not an alternative authoritative catalog.

## Pre-build checks (must happen before any credit use)

1. Obtain and retain express written permission from Nutanix for automated collection of the public careers catalog and detail pages, including Bright Data-managed access and the intended low-volume spike.
2. Confirm the permission covers any affected third-party Jobvite boundary if a PDP `applyUrl` is recorded; do not crawl or submit that boundary.
3. In the Bright Data account, verify that no applicable pre-built Nutanix scraper already exists. Public search did not surface one, but that is not an account-level proof. Scraper Studio is appropriate only after this check.
4. Reconfirm that the target URL is still public, renders vacancy cards without login, and has not changed its terms or access policy.
5. Confirm current credit balance and reserve; do not place a token, balance response, or private dashboard output in this repository.

## Exact proposed Discovery prompt

Use only after the policy gate passes. Input URL for the constrained spike:
`https://careers.nutanix.com/en/jobs/?country=India&team=Engineering&pagesize=20`

```text
From the public Nutanix Careers catalog, enumerate job cards only. Use the visible job-search controls to select Country=India and Team=Engineering, submit the filter, then follow numbered pagination and Next Page until that filtered result set is exhausted. Do not open detail pages. Return one JSON object per card with jobId (numeric or n-prefixed requisition ID), title, location, department (the card team), companyJobUrl (absolute careers.nutanix.com/en/jobs/... URL), sourceCatalogUrl (the catalog page URL), and collectedAt. Preserve source labels; do not invent dates, workplace type, employment type, apply URLs, or descriptions. Reject cards missing jobId, title, or URL, reject rows that do not match the selected country/team, and deduplicate by jobId then canonical URL. Emit JSON records only.
```

The prompt intentionally asks the agent to interact with the controls and to reject mismatched rows. A URL parameter alone is not an enumeration guarantee on this target.

## Exact proposed PDP prompt

Use only for new or changed detail URLs selected from the validated Discovery output. Do not run it over the whole catalog.

```text
From one public Nutanix Careers detail URL, extract exactly one job record. Return JSON with jobId (visible numeric or n-prefixed requisition ID), title, location, workplaceType (only an explicit Work Arrangement label, otherwise unknown), department, employmentType if explicitly shown, publishedAt only if an actual date is printed, experienceText if explicitly shown, description (job-content sections only, excluding global navigation/footer/benefits/How We Hire boilerplate), companyJobUrl (canonical careers detail URL), applyUrl (the visible absolute app.jobvite.com link if present), sourceCatalogUrl if supplied with the input, and collectedAt. Preserve source wording and null optional fields; never infer dates, salary, skills, or workplace type. Do not click Apply, log in, join a talent community, open application forms, or submit anything. Reject account, login, or non-job pages.
```

## Low-credit spike shape (permission required)

The plan caps a target spike at 10 inputs and 400 credits. Keep the live experiment materially below both limits:

- one Discovery input using the constrained India/Engineering URL;
- one Discovery run, with a hard stop if pagination needs more than 10 page loads or if the account reports unexpected usage;
- three PDP inputs: one numeric ID, one `n`-prefixed ID, and one multi-location or explicit Work Arrangement variant;
- no Discovery+PDP full-catalog run, no application interaction, no login, no Jobvite crawl, and no probing/load test;
- record only sanitized row count, page count, field coverage, duplicate rate, elapsed time, and numeric usage; and
- stop immediately on a policy warning, challenge, non-public page, filter mismatch, or budget uncertainty.

Bright Data's [Scraper Studio introduction](https://docs.brightdata.com/datasets/scraper-studio/introduction) describes AI-agent interaction/parsing and pagination handling, while the [API quickstart](https://docs.brightdata.com/datasets/scraper-studio/quickstart) says a first run with one to ten inputs typically takes about three minutes. Those implementation facts do not grant permission or define the account's credit accounting; the hard project budget and Nutanix policy gate remain controlling.

## Validation gates

Every gate is pass/fail. A failed gate preserves the prior known-good state and spends no further credits.

### Gate A - provenance and policy

- [ ] Corporate URL redirects to `careers.nutanix.com/en/` and catalog URL is `/en/jobs/`.
- [ ] Express written permission is recorded for automated access, including any affected third party.
- [ ] No login, candidate account, application form, talent-community form, or personal data is required.
- [ ] Terms and any robots/site-specific rules are rechecked on the run date.

### Gate B - Discovery integrity

- [ ] Every row has non-empty `jobId`, `title`, `location`, `department`, and an absolute official `companyJobUrl`.
- [ ] Every URL remains on `careers.nutanix.com` and matches `/en/jobs/`.
- [ ] Every row satisfies the selected Country=India and Team=Engineering facets; mixed rows fail the run.
- [ ] Pagination evidence records each catalog page URL; no `Next Page` remains after the final page.
- [ ] No duplicate job IDs or canonical URLs; 100% required-field coverage.
- [ ] The observed count is plausible against the page count and visible catalog total; volatile homepage counts are not treated as exact truth.

### Gate C - PDP integrity

- [ ] Three representative public PDPs resolve without authentication and retain the expected requisition ID, title, location, department, description, and official URL.
- [ ] `applyUrl`, if present, is recorded without following the Jobvite boundary.
- [ ] Optional `publishedAt`, `employmentType`, and workplace fields are null/unknown when absent; no inferred values.
- [ ] Description contains job content and excludes repeated site chrome; 100% required-field coverage.

### Gate D - provenance and safety

- [ ] No output URL leaves the approved Nutanix careers provenance except the recorded, untouched Jobvite apply link.
- [ ] No private, applicant, login, or personal data is stored or sent to an LLM.
- [ ] No Web Unlocker/Browser API fallback is used to evade a policy block.

### Gate E - budget and reproducibility

- [ ] At most four live inputs (one Discovery plus three PDP) and no more than the 400-credit spike allowance.
- [ ] Numeric before/after usage and elapsed time are captured outside source output; token and dashboard secrets never enter logs or docs.
- [ ] A sanitized snapshot, prompt, collector ID, and validation report are sufficient to reproduce the result without rerunning the full catalog.

## Fallback recommendation

Do not lock Nutanix as the real target on this evidence. Keep the prompts and field map as a conditional spike plan, but use the controlled public fixture for the self-healing demonstration while the team seeks permission. If permission is unavailable, move target validation to **Canva Careers**, the plan's first fallback, and then **HackerEarth Careers**; apply the same corporate-path, public-access, Marketplace-overlap, and Terms/robots gates to each. If every real target fails the policy gate, ship the fixture-backed healing slice and disclose that no live company collector was run without permission.
