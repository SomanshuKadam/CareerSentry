# Canva target spike

Research date: 2026-08-20 (Asia/Calcutta). This is a read-only public-web audit. No Bright Data token, collector, authenticated request, or live Bright Data run was used.

## Decision

Canva is the strongest technical validation candidate in the current plan, but the policy gate is still conditional. Canva publishes a public, structured Careers catalog on `lifeatcanva.com`; a representative public detail page exposes stable fields and an explicit outbound Apply link to Canva's SmartRecruiters tenant. The catalog is readable without a candidate account and is large enough to exercise Discovery and incremental PDP behavior.

The public policy signals are not an affirmative scraping license:

- The current [Canva Terms of Use](https://www.canva.com/policies/terms-of-use/) took effect on 19 August 2026 and section 2(e)(viii) prohibits data mining, extraction, or scraping on the Canva Service. The Terms define the Service around Canva's visual communication platform and Canva websites such as Canva.com and affinity.studio; they do not expressly name `lifeatcanva.com`. That scope distinction needs a recorded owner/legal decision before collection.
- The separate [lifeatcanva robots.txt](https://www.lifeatcanva.com/robots.txt) allows the generic user-agent but delays or blocks several named crawlers on `/en/jobs/`. Robots behavior is host- and user-agent-specific, and is not permission to ignore the Terms.
- The SmartRecruiters [Candidate Terms of Use](https://www.smartrecruiters.com/legal/terms-of-use/) prohibit automatic means to access content or data from other users and govern the Talent Acquisition Platform and candidate services. The public Canva posting surface is not clearly scoped by that page, so the delegated boundary must not be crawled or used as an escape hatch.

Recommendation: keep Canva as the active candidate, but do not place a live Bright Data call until the project records that the Canva Careers surface and the untouched SmartRecruiters Apply boundary are permitted for this low-volume public catalog read. If that decision cannot be obtained, use the controlled fixture and move to the plan's next target rather than inferring permission from public visibility.

## Corporate-to-careers and delegated catalog provenance

The first-party path is explicit:

```text
https://www.canva.com/about/                         -> See careers -> https://www.lifeatcanva.com/
https://www.canva.com/newsroom/news/how-to-land-a-job-at-canva/
                                                       -> new careers website -> lifeatcanva.com
https://www.lifeatcanva.com/en/                       -> public Canva Careers home
https://www.lifeatcanva.com/en/jobs/                  -> public job catalog
```

The [Canva About page](https://www.canva.com/about/) has a Careers section linking to `www.lifeatcanva.com`. Canva's [official newsroom career article](https://www.canva.com/newsroom/news/how-to-land-a-job-at-canva/) calls `lifeatcanva.com` the new careers website and links candidates there. This proves the corporate-to-careers handoff without relying on a search result or an unrelated job board.

The Careers site is the authoritative public listing/detail surface for this spike. A current detail page, [Engineering Director - Print](https://www.lifeatcanva.com/en/jobs/6000000001333306/engineering-director-print/), has a visible Apply now link whose exact destination is:

```text
https://jobs.smartrecruiters.com/Canva/6000000001333306-engineering-director-print?oga=true
```

That link was inspected as an href only; it was not opened or submitted. The public [SmartRecruiters Canva board](https://careers.smartrecruiters.com/canva) independently presents "Careers at Canva" and public location browsing. The first-party PDP link is the stronger provenance evidence: it proves Canva delegates application handling to the SmartRecruiters tenant. It does not authorize crawling SmartRecruiters directly, and it does not make the application form part of the catalog.

## Public access and login boundaries

The public [Canva Careers catalog](https://www.lifeatcanva.com/en/jobs/) and representative PDP load vacancy cards and job content without a login or candidate account. The catalog has a Saved Jobs navigation item, but it is not needed to browse the public rows. The public SmartRecruiters board is also readable without signing in.

The boundary changes at application and candidate status:

- The official PDP's Apply now link leaves `lifeatcanva.com` for `jobs.smartrecruiters.com`.
- SmartRecruiters' candidate terms describe a Candidate Portal at `my.smartrecruiters.com`; account registration uses an email address and password after applying or receiving a consent request.
- Canva's [Candidate Privacy Notice](https://www.lifeatcanva.com/en/privacy-policy/) describes application, contact, work-history, right-to-work, and other candidate data, and says third-party recruitment products are governed by their vendors' terms. None of those fields are in scope for a public job-record collector.

The collector must remain on public `lifeatcanva.com/en/jobs/...` pages, record an Apply href only if it is visible on an approved PDP, and never click Apply, open a SmartRecruiters form, enter candidate data, use a Candidate Portal, or collect personal/applicant data.

## Catalog mechanics observed

The current default catalog is a server-rendered public page with:

- `1 to 20 of 254 Live Results` at the time of this audit;
- 20 visible cards on the first page;
- numbered pagination links 1 through 9, an ellipsis, and page 13 (13 pages at the observed count); and
- card links containing a numeric job identifier, title, location text, and team text.

The current first page includes examples such as `Engineering Director - Print` (Sydney, Australia; Engineering), `Customer Success Manager (Contract)` (Austin, United States; Sales & Success), and `Senior Research Data Engineer` (Vienna, Austria; Engineering). Counts and roles are volatile and are only smoke-test observations.

The public filter surface has a keyword Search input, five selects, and a Search button. An indexed public filter view names the controls as:

- Team;
- Sub-speciality;
- Country;
- Location Type; and
- Work Type.

The public query shapes include `?page=2`, `?page=2&pagesize=20`, and combinations such as `?team=Marketing` or `?location=London`. Do not trust query parameters as proof that a filter was applied. Public crawls of URLs such as [team=Marketing](https://www.lifeatcanva.com/en/jobs/?page=2&pagesize=20&team=Marketing) and [location=London](https://www.lifeatcanva.com/en/jobs/?location=London&page=2) reported totals and rows that included unrelated teams or locations. The cause may be stale indexing, caching, or site-side filter behavior, but it is enough to require visible-control validation for any future filtered run.

The first low-credit spike therefore uses the unfiltered first page. A later full Discovery must use the visible controls where possible, capture every catalog page URL, and reject any row that does not satisfy the selected facets. A query string alone is not a filter guarantee.

The Careers footer and [site map](https://www.lifeatcanva.com/en/sitemap/) expose the main team and location taxonomy. The footer lists Engineering, Product Management, Design, Sales and Success, Marketing, Operations, Finance, Customer Happiness, Legal, People, and Information Technology. Live cards also currently show labels such as Content and Growth, so the collector must preserve the source team string and must not hardcode the footer list as exhaustive.

## Likely output fields

| Surface | Observed field | Collector treatment |
| --- | --- | --- |
| Listing card | Numeric ID in the official detail URL path | Required `jobId`; derive only from the canonical `lifeatcanva.com/en/jobs/{id}/...` URL and preserve the raw URL |
| Listing/PDP | Job title | Required `title`; preserve source text |
| Listing/PDP | City/region/country string, sometimes repeated for the same title | Required `location`; preserve the full visible label and do not collapse multi-location rows |
| Listing/PDP | Team/department label | Required `department`; preserve the source label, including values not in the footer taxonomy |
| Listing/PDP | Official detail URL | Required `companyJobUrl`; absolute URL on `lifeatcanva.com/en/jobs/` only |
| Collector input | Catalog page URL | Required `sourceCatalogUrl`; retain the actual catalog page that produced the row |
| PDP | Team | Required/confirmatory `department`; compare with the card rather than overwriting silently |
| PDP | Country/location | Required/confirmatory `location`; preserve the labeled value |
| PDP | Schedule, for example Full-time | Optional `employmentType`; only map the explicit Schedule label |
| PDP | Location Type, for example Hybrid, Remote, or Onsite | Optional `workplaceType`; `unknown` when the label is absent |
| PDP | Description sections and headings | Required `description` for a later PDP stage; exclude global navigation, footer, related jobs, and repeated boilerplate |
| PDP | Visible Apply now href | Optional `applyUrl`; record as an untouched link only, never follow it |
| PDP (variable) | Salary, date, or other detail | Optional only when explicitly printed; never infer missing values |
| All records | Collection timestamp | `collectedAt`; generated by the collector, not copied from page text |

The representative PDP shows `Team`, `Country`, `Schedule`, and `Location Type` before `Description`, followed by job-content sections such as About the team, What you would be doing, match criteria, benefits, and other candidate guidance. A PDP can contain related opportunities and site-wide teams/locations; those are navigation, not additional records.

## Robots, Terms, and site-policy signals

### Canva Careers host

The direct [lifeatcanva.com robots file](https://www.lifeatcanva.com/robots.txt) was read publicly on the research date. Its material signals are:

- `User-agent: *` has `Allow: /`, with `Disallow: /cdn-cgi/`;
- several named agents have crawl delays of 0.5, 1, or 2 seconds;
- named agents including PageFreezer, Detectify, MagnetmeBot, CCBot, Heritrix, SnapchatAdsBot, OpenindexSpider, and SiteAuditBot are disallowed from `/en/jobs/`; and
- GPTBot, ClaudeBot, anthropic-ai, Screaming Frog SEO Spider, Bytespider, and other named agents are disallowed from all paths.

This is a technical robots signal, not a contractual grant. The effective Scraper Studio user-agent was not established in this read-only audit, so the generic `Allow: /` line must not be treated as sufficient permission. The `/cdn-cgi/` path must not be probed or followed.

### Canva corporate host

The separate [Canva corporate robots file](https://www.canva.com/robots.txt) has a different policy surface: the generic group has product- and query-specific disallows, while multiple named AI/crawler agents are disallowed from `/`. Do not apply the corporate file mechanically to `lifeatcanva.com`, and do not apply the Careers file to Canva product pages.

The [Canva Terms of Use](https://www.canva.com/policies/terms-of-use/) are effective 19 August 2026. Section 2(e)(viii) says users will not use any form of data mining, extraction, or scraping on the Service or its contents for any purpose, including AI, machine learning, and data science; section 2(e)(ix) also prohibits bypassing measures that restrict access or copying. The Terms' Service definition describes Canva's visual communication platform and Canva websites such as Canva.com and affinity.studio, not the separately branded Careers host. That makes the scope a question for the project owner/legal reviewer, not a reason to assume either permission or prohibition silently.

### SmartRecruiters delegated host

The public [SmartRecruiters robots file](https://www.smartrecruiters.com/robots.txt) lists a sitemap and specific blocked company paths; the displayed file does not list Canva. An exact `jobs.smartrecruiters.com/robots.txt` or `careers.smartrecruiters.com/robots.txt` response was not verified in this audit, so no allow signal is inferred for those hosts.

The [SmartRecruiters Candidate Terms](https://www.smartrecruiters.com/legal/terms-of-use/) apply to its Talent Acquisition Platform and services, describe the candidate portal, and prohibit automatic means to access content or data from other users. The public job-board surface and the customer-specific Canva posting content are not clearly separated in the page's scope. Treat the SmartRecruiters boundary as permission-sensitive and keep it out of the spike. Its [visitor privacy policy](https://www.smartrecruiters.com/legal/general-privacy-policy/) also describes browsing data and cookies; do not collect anything beyond the public job posting.

### Policy conclusion

Public access, an `Allow: /` default robots group, and a first-party Apply link establish technical reachability and provenance, not authorization for Bright Data-managed automation. Before any live run, record the interpretation/approval that covers:

1. automated access to the public `lifeatcanva.com/en/jobs/` catalog and, if needed, its public PDPs;
2. Canva's current Terms of Use and any Careers-specific rules;
3. the SmartRecruiters application boundary as a link that is recorded but not followed; and
4. the effective user-agent, crawl rate, and one-input limit.

If that approval is not available, the policy gate fails and the spike stays on the controlled fixture.

## Bright Data pre-built overlap and worker choice

Public web research did not surface a Bright Data pre-built scraper specifically named Canva, Canva Careers, `lifeatcanva.com`, or the Canva SmartRecruiters tenant. This is only a public-search signal, not an account-level Marketplace or Scrapers Library proof. Before creating a custom collector, inspect the available account catalog without placing a live target call. If an applicable pre-built scraper is found, compare its scope and policy before using it; do not use it to bypass the Canva or SmartRecruiters gate.

Bright Data's [Scrapers Library overview](https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview) describes 660+ maintained pre-built scrapers, while the [Scraper Studio FAQ](https://docs.brightdata.com/datasets/scraper-studio/faqs) describes Studio as the custom environment for sites not in the library. The [worker-types guidance](https://docs.brightdata.com/datasets/scraper-studio/worker-types) says Code worker is faster and cheaper when the target data is in the raw HTML or a public endpoint; Browser worker is for client-rendered pages, clicks, forms, or JavaScript interaction.

The public catalog capture exposes the first-page cards in the returned content; confirm raw-HTML availability during an approved build and start the one-page experiment with the least interactive worker that can parse that response. Do not use a Browser worker, proxy escalation, Web Unlocker, or an ATS endpoint to evade a policy block. Switch to a Browser worker only if an approved run proves the cards are not available to a Code worker and the extra page-load cost is within the budget.

## Exact one-input low-credit Scraper Studio prompt

Use only after the policy/provenance gate passes. Submit exactly one input and stop at the first public catalog page:

Input:

```text
https://www.lifeatcanva.com/en/jobs/
```

Prompt:

```text
From the supplied public Canva Careers catalog URL, extract only the first visible catalog page. Do not click or open any job detail, search, filter, Saved Jobs, pagination, login, Apply, or SmartRecruiters link. Do not follow any URL on another host. Stop after the first 20 visible job cards, or after all visible cards if there are fewer than 20; do not paginate.

Return JSON records only, one object per card, with these fields:
- jobId: the numeric path segment from the canonical official detail URL
- title: the exact visible job title
- location: the exact visible card location string
- department: the exact visible card team string
- companyJobUrl: the absolute canonical lifeatcanva.com/en/jobs/... detail URL
- sourceCatalogUrl: the catalog URL that produced the card
- collectedAt: collection timestamp

Use only public Canva Careers content. Derive jobId only from the official detail URL; do not infer it from the title or description. Require non-empty jobId, title, location, department, and companyJobUrl. Reject rows whose URL is not on lifeatcanva.com/en/jobs/, rows missing a required field, non-job links, login/application data, or any data from SmartRecruiters. Preserve source wording exactly and do not invent dates, salary, employment type, workplace type, description, or applyUrl. If the catalog is unavailable, requires login, presents a challenge, or cannot be read without leaving the approved host, return one error object with errorType and message and stop. Emit records or one error object only.
```

This is a baseline-access/schema test, not a full catalog claim. It intentionally avoids the observed unreliable query filters, pagination, PDP loads, and the SmartRecruiters boundary. Keep the input count at one and record numeric usage outside the returned data.

## Conditional incremental PDP prompt

Do not include this in the one-input live spike. Use it only after a Discovery row has passed validation and only for new or changed detail URLs; never run it over the full catalog:

```text
From one supplied public Canva Careers detail URL, extract exactly one job record and return JSON. Read only the public lifeatcanva.com page. Return jobId (numeric path ID), title, department (the labeled Team), location (the labeled Country/location), employmentType (the labeled Schedule when present), workplaceType (the labeled Location Type when present, otherwise unknown), description (job-content sections only, excluding global navigation, footer, related opportunities, and repeated boilerplate), companyJobUrl (canonical lifeatcanva.com/en/jobs/... URL), applyUrl (the visible absolute jobs.smartrecruiters.com link if present, recorded but not opened), sourceCatalogUrl if supplied with the input, and collectedAt. Preserve source wording and use null/unknown for absent optional fields. Do not click Apply, open SmartRecruiters, log in, join a talent community, submit a form, or collect candidate data. Reject account, login, application, and non-job pages.
```

## Validation gates

Every gate is pass/fail. A failed gate stops further collection and preserves the prior known-good fixture.

### Gate A - provenance and policy

- [ ] Canva About or Newsroom still links to `lifeatcanva.com` as the Careers destination.
- [ ] The public catalog and representative PDP are still on `lifeatcanva.com/en/jobs/` and load without authentication.
- [ ] A recorded project-owner/legal decision covers automated access to the Careers host despite the current Canva Terms' scraping restriction on the Canva Service.
- [ ] The exact Careers robots file and SmartRecruiters host rules are rechecked on the run date; the effective user-agent is acceptable and `/cdn-cgi/` is not requested.
- [ ] The SmartRecruiters Apply link is treated only as an untouched outbound boundary; no application, candidate account, or ATS endpoint is accessed.

### Gate B - one-input access and cost

- [ ] The run submits exactly one input: `https://www.lifeatcanva.com/en/jobs/`.
- [ ] The first page is public, readable, and returns cards without a login, challenge, or policy warning.
- [ ] No job detail, filter, pagination, Saved Jobs, Apply, SmartRecruiters, or candidate-portal page is loaded.
- [ ] The run stops after the first 20 visible cards or fewer and records numeric usage externally; token, dashboard, and private response data never enter the output.

### Gate C - Discovery integrity

- [ ] Every record has non-empty `jobId`, `title`, `location`, `department`, and an absolute `companyJobUrl` on `lifeatcanva.com/en/jobs/`.
- [ ] `jobId` is the numeric ID from the official detail URL and is stable across duplicate observations.
- [ ] `sourceCatalogUrl` identifies the one input page; no record claims that pagination or the full 254-row catalog was collected.
- [ ] No duplicate `jobId` or canonical URL occurs within the first-page result.
- [ ] No output contains SmartRecruiters content, candidate data, or inferred fields.

### Gate D - filter and pagination behavior for any later expansion

- [ ] A later filtered run uses visible controls, captures the selected values, and validates every row against those values.
- [ ] Query parameters such as `team=Marketing` or `location=London` are not accepted as proof of filtering; mixed-team or mixed-location rows fail the run.
- [ ] A full Discovery records each page URL, stops at the actual final page, and reconciles visible count, page count, and duplicate rate.
- [ ] A full Discovery is not combined with a full PDP sweep; PDP work is incremental and limited to changed/new URLs.

### Gate E - optional PDP integrity

- [ ] Each later PDP resolves publicly and retains its numeric ID, title, Team, Country/location, and description.
- [ ] `employmentType` and `workplaceType` are null/unknown when their labels are absent; no values are inferred from title or location.
- [ ] `applyUrl`, if present, is recorded without opening the SmartRecruiters host.
- [ ] Description output contains job content only and excludes site chrome, related opportunities, and candidate/application fields.

### Gate F - safety and fallback

- [ ] No Bright Data proxy, Browser API, Web Unlocker, or alternate ATS URL is used to evade a block or policy ambiguity.
- [ ] No login, application form, candidate portal, talent-community form, or personal data is visited or stored.
- [ ] Any challenge, policy warning, unexpected page load, filter mismatch, or budget uncertainty stops the run immediately.
- [ ] A sanitized fixture snapshot remains available for the self-healing demo if the real target is stopped.

## Fallback recommendation

Canva should remain the first validation candidate because its official provenance, public catalog, stable detail URLs, and delegated Apply boundary are all observable. Run only the one-input first-page test after the policy decision in Gate A. If the policy decision is unavailable, do not live-run and do not pivot to direct SmartRecruiters APIs; use the controlled fixture and continue with the plan's next target, HackerEarth Careers, after applying the same provenance, policy, robots, public-access, and pre-built-overlap checks.

If the one-input test passes access and schema but later filter behavior remains mixed, keep the evidence as a constrained validation result and do not claim a reliable full catalog. If Canva's first page is blocked, requires a Browser worker that exceeds the remaining budget, or cannot satisfy the policy gate, stop without a retry and fall back to the fixture/next target.

## Source ledger

- [Canva About](https://www.canva.com/about/)
- [Canva Newsroom: How to land a job at Canva](https://www.canva.com/newsroom/news/how-to-land-a-job-at-canva/)
- [Canva Careers home](https://www.lifeatcanva.com/en/)
- [Canva Careers catalog](https://www.lifeatcanva.com/en/jobs/)
- [Canva Careers representative PDP](https://www.lifeatcanva.com/en/jobs/6000000001333306/engineering-director-print/)
- [Canva Careers site map](https://www.lifeatcanva.com/en/sitemap/)
- [Canva Careers Candidate Privacy Notice](https://www.lifeatcanva.com/en/privacy-policy/)
- [Canva Careers robots.txt](https://www.lifeatcanva.com/robots.txt)
- [SmartRecruiters Canva board](https://careers.smartrecruiters.com/canva)
- [SmartRecruiters representative Apply destination](https://jobs.smartrecruiters.com/Canva/6000000001333306-engineering-director-print?oga=true)
- [SmartRecruiters robots.txt](https://www.smartrecruiters.com/robots.txt)
- [SmartRecruiters Candidate Terms of Use](https://www.smartrecruiters.com/legal/terms-of-use/)
- [SmartRecruiters visitor privacy policy](https://www.smartrecruiters.com/legal/general-privacy-policy/)
- [Canva Terms of Use](https://www.canva.com/policies/terms-of-use/)
- [Canva corporate robots.txt](https://www.canva.com/robots.txt)
- [Bright Data Scrapers Library overview](https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview)
- [Bright Data Scraper Studio FAQ](https://docs.brightdata.com/datasets/scraper-studio/faqs)
- [Bright Data Scraper Studio worker types](https://docs.brightdata.com/datasets/scraper-studio/worker-types)
