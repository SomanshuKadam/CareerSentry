# HackerEarth target spike

Research date: 2026-08-20 (Asia/Calcutta). This is a read-only public-web audit. No Bright Data token, authenticated request, Marketplace account call, or live Bright Data run was used.

## Decision

HackerEarth is technically viable for the current one-input validation, and the Trakstar catalog has a first-party provenance path. The important caveat is that HackerEarth currently exposes two different public hiring surfaces:

```text
https://www.hackerearth.com/companies/hackerearth/jobs/
    -> redirects to https://hackerearthjobs.hire.trakstar.com/

https://www.hackerearth.com/careers/
    -> embeds https://hackerearth.applytojob.com/apply/ (JazzHR)
```

The first path is a current official HackerEarth URL and is therefore sufficient to establish corporate-to-delegated-Trakstar provenance. The reciprocal Trakstar `Website` link points back to `www.hackerearth.com`, and the Trakstar board is publicly branded HackerEarth. However, the Trakstar board currently lists five roles while the `/careers/` JazzHR embed lists four rows (including two separate rows with the same title). This is evidence of a split or migrating hiring configuration, not a reason to merge the two catalogs silently.

Recommendation: an approved low-credit spike may use exactly one input, the official HackerEarth redirect path, and stop at the first public Trakstar catalog page. It must not follow job details, application links, the legacy Recruiterbox URL, or any login/application surface during Discovery. Treat Trakstar's current policy signals as narrow permission for public job-card reads only: robots permits the relevant paths, but Trakstar's AUP and subscription terms prohibit unauthorized access, personal-data collection, and screen-scraping/bot behavior in the system. If the project owner cannot record that this bounded public catalog read is acceptable, use the official JazzHR catalog as a fallback only after its own policy gate, or use the controlled fixture/next target. Do not use either ATS to bypass a policy block.

## Corporate-to-careers and delegated catalog provenance

### First-party HackerEarth paths

The official [HackerEarth `/companies/hackerearth/jobs/` URL](https://www.hackerearth.com/companies/hackerearth/jobs/) currently redirects to `https://hackerearthjobs.hire.trakstar.com/`. The resulting public page has a `Website` link to `www.hackerearth.com`, the HackerEarth name, a Careers section, five public openings, and a `powered by Trakstar Hire` footer. This is the strongest proof that Trakstar is an official/delegated catalog for HackerEarth, even though the link is an older alternate path rather than the current marketing page's iframe.

The official [HackerEarth Careers page](https://www.hackerearth.com/careers/) separately says `Current openings` and embeds `https://hackerearth.applytojob.com/apply/`. Opening the iframe destination identifies it as a JazzHR career page and exposes four public rows. Thus the current corporate site has two first-party hiring paths; a collector must pin its source to one approved path and preserve that source in every record.

The [HackerEarth recruiter login page](https://app.hackerearth.com/recruiters/login/) links its Company > Careers item back to `www.hackerearth.com`, while the public developer [Jobs page](https://www.hackerearth.com/jobs/) is an app shell that shows login/loading behavior. The latter is not the company hiring catalog and must not be used for this target.

### Current Trakstar inventory

The public [HackerEarth Trakstar board](https://hackerearthjobs.hire.trakstar.com/) currently shows:

1. Account Executive - Sales - Bengaluru, Karnataka, India - India Sales - Full-time
2. Account Executive - Solution Selling - Bengaluru, Karnataka, India - Sales - Full-time
3. Account Manager - International Sales (US Shift) - Bengaluru, Karnataka, India - International Sales - Full-time
4. Sales Development Representative - North America - Bengaluru, Karnataka, India - International Sales - Full-time
5. Sales Executive - Enterprise - Bengaluru, Karnataka, India - India Sales - Full-time

The board's indexed rendering exposes Country (India and Karnataka), City (Bengaluru), and Team facets (India Sales, International Sales, and Sales), a public search box, and `1 - 5 of 5 Jobs` with Prev/Next controls. The open board is small enough for a bounded first-page smoke test, but count and roles are volatile.

The first public Trakstar detail page inspected, [Account Executive - Sales](https://hackerearthjobs.hire.trakstar.com/jobs/fk0vqiq/), has a stable-looking slug ID (`fk0vqiq`), title, location, team, employment type, full job description, visible Apply/LinkedIn/Indeed links, and a public application form rendered on the same page. It also contains a stale-looking link to `http://hackerearthjobs.recruiterbox.com/jobs`. Do not follow that old link. The Trakstar board's footer also links to `recruiterbox.com`, consistent with a vendor migration, not a separate source to crawl.

### Current JazzHR inventory (reconciliation only)

The current official [HackerEarth Careers embed](https://hackerearth.applytojob.com/apply/jobs/) lists four public rows:

1. Account Executive - SMB Sales - Bangalore, Karnataka, India
2. Sales Development Representative - North America - Bangalore, Karnataka, India
3. Sales Development Representative - North America - Bangalore, Karnataka, India
4. Senior Software Engineer ( Backend) - Bengaluru, Karnataka, India

The two SDR rows resolve to different JazzHR detail IDs (`PDCUD1FBQh` and `VlEHSj9IA7`), so the duplicate title is not necessarily a duplicate record. JazzHR detail pages expose title, location, Full Time, description, and a candidate form. A representative detail URL is [Senior Software Engineer (Backend)](https://hackerearth.applytojob.com/apply/jobs/details/ZhjBt8T9ip). JazzHR's public board provides Advanced Search controls for Job title, City or town, State or province, Keywords, Type of employment, and Department or business unit.

The JazzHR and Trakstar counts do not match. This may be a staging/migration split, stale requisitions, or different internal posting configurations. A Trakstar run must not claim to be the complete `/careers/` catalog, and a JazzHR run must not be mixed with Trakstar records. Reconcile the two inventories in evidence only; choose one source for a collector.

## Public access and login/application boundaries

The Trakstar catalog and its job details are publicly readable without an account. The same is true of the JazzHR board and representative detail pages. This public reachability is limited to vacancy content:

- Trakstar's detail page renders an Application Form with First Name, Last Name, Email, Phone, Resume, hybrid-work question, current/expected CTC, and joining timing.
- JazzHR detail pages render first/last name, email, phone, location, resume, CTC/salary, notice period, experience, relocation, and a human-check field, varying by role.
- `Apply`, LinkedIn, Indeed, `?apply=true`, resume upload/paste controls, and any candidate-account or form workflow are outside the catalog boundary.
- The HackerEarth developer Jobs page and recruiter pages can show login or account-only content; no login is allowed.
- The old `hackerearthjobs.recruiterbox.com` link is a legacy/vendor boundary. Do not use it as an alternate input or redirect target.

The collector may record a visible apply href as an untouched `applyUrl` if the approved PDP prompt needs it, but it must never open that href, click Apply, submit a form, create a candidate account, or store candidate/application data. Public job descriptions may mention working models or compensation questions; those are role text, not application fields, and must not be confused with collected applicant data.

## Catalog mechanics and likely fields

### Trakstar Discovery mechanics

Observed public behavior:

- The catalog is a server-rendered/public hosted-careers page with a search input.
- The indexed page exposes Country, City, and Team facets and a five-row first page.
- Prev/Next controls are present even though the current count fits one page. Do not click them in the low-credit spike.
- Each card links to `/jobs/<slug>/`; the slug is the only safe `jobId` source. Do not synthesize IDs from titles.
- Cards expose title, location, team, and employment type. Some detail content can expose remote/hybrid wording, but the card header does not always label a workplace type.
- A public detail page combines the job description and application form. Discovery must not load detail pages; later PDP work is incremental only for new/changed rows.

### Recommended JobRecord mapping

| Surface | Observed field | Collector treatment |
| --- | --- | --- |
| Trakstar card link | Slug in `/jobs/<slug>/` | Required `jobId`; derive only from the canonical public detail URL |
| Card/PDP | Job title | Required `title`; preserve exact source text |
| Card/PDP | Location string | Required `location`; preserve `Bengaluru, Karnataka, India` rather than normalizing silently |
| Card/PDP | Team | Required `department`; preserve `India Sales`, `International Sales`, or `Sales` |
| Card/PDP | Employment type | Optional `employmentType`; map explicit `Full-time` only |
| PDP | Remote/hybrid wording | Optional `workplaceType`; use only an explicit labeled value, otherwise `unknown` |
| PDP | Job description | Required only for incremental PDP; exclude application form, global chrome, and related links |
| PDP | Visible Apply href | Optional `applyUrl`; record without opening it |
| Canonical detail URL | Public Trakstar URL | Required `companyJobUrl`; keep the approved Trakstar host and slug |
| Input page | Official HackerEarth redirect input | Required `sourceCatalogUrl`; preserve the first-party source URL |
| Resolved page | Trakstar catalog URL | Required `resolvedCatalogUrl`; prove the public redirect target without replacing the source |
| All records | Collector timestamp | `collectedAt`; generate at collection time |

Do not infer posted date, salary, seniority, work arrangement, or department from free text. Do not emit the CTC/application questions as job fields. If a value is absent, use null/unknown according to the application schema rather than guessing.

### JazzHR fallback fields

If the official Trakstar path fails its policy or access gate and a separate fallback run is approved, the JazzHR detail URL uses an opaque ID under `/apply/jobs/details/<id>`. Map that ID to `jobId`, preserve title/location/department/employment type only when explicit, and keep `sourceCatalogUrl=https://hackerearth.applytojob.com/apply/jobs/`. Do not mix JazzHR and Trakstar IDs or claim that one host is the other's mirror.

## Robots, Terms, and site-policy signals

Robots files were fetched publicly and read-only on the research date. A robots `Allow` is a technical crawl signal, not a contractual permission grant.

### HackerEarth corporate host

The [HackerEarth robots.txt](https://www.hackerearth.com/robots.txt) currently says:

```text
User-agent: *
Allow: /
Disallow: /*?login=
Disallow: /*&login=
Disallow: /*AJAX
Disallow: /ru/*
Disallow: /fr/*
Disallow: /de/*
Disallow: /zh/*
Disallow: /pt-br/*
Disallow: /ja/*
```

The official `/companies/hackerearth/jobs/` source URL is not in those disallowed patterns. Do not request login, AJAX, localized paths, or unrelated corporate content. The generic group allows the source path, but the current [HackerEarth Terms of Service](https://www.hackerearth.com/terms-of-service/) (last updated June 8, 2024) still governs use of HackerEarth services and prohibits unauthorized use, reverse engineering, unlawful use, and disclosure of other users' personal/proprietary information. No explicit scraping sentence was found in the public Terms. That absence is not an affirmative automation license.

The [HackerEarth Privacy Policy](https://webflow.hackerearth.com/privacy) (last updated September 15, 2025) covers `hackerearth.com` and its subdomains and describes names, emails, addresses, titles, resumes, and other personal data. It reinforces the no-candidate-data boundary.

### Trakstar public hosted-careers host

The [Trakstar board robots.txt](https://hackerearthjobs.hire.trakstar.com/robots.txt) currently says:

```text
User-agent: *
Disallow: /prepare*
Disallow: /published_jobs_list_v2*
Allow: /
Sitemap: https://hackerearthjobs.hire.trakstar.com/sitemap.xml
```

The public `/` catalog and `/jobs/<slug>/` detail paths are not disallowed. Do not request `/prepare*` or `/published_jobs_list_v2*`; do not use the sitemap as a reason to expand the spike beyond one input.

The current [Trakstar Acceptable Use Policy](https://mitratech.com/en-gb/legal-notice/trakstar/acceptable-use-policy/) (last updated July 28, 2026) expressly applies to `hire.trakstar.com` services. It prohibits accessing content not intended for the user, probing or testing security, overloading/flooding services, fraudulent job listings or job-board terms violations, misrepresenting affiliation, and collecting or storing personal data about third parties without their knowledge or consent. It does not expressly grant or prohibit a small public job-card read. The collector should therefore stay on clearly public listing content, use one bounded input, avoid rate/concurrency escalation, and never collect candidate data.

The current [Trakstar Terms and Conditions](https://mitratech.com/en-gb/legal-notice/trakstar/trakstar-terms-and-conditions/) contain a more direct warning in section 1.7(b): the Client may not transmit code that attempts to automatically gather information from the screen (screen scraping) or use automated bots to upload multiple candidate data streams. This clause is written for a Trakstar Client/System and candidate-data workflows, not plainly for an unauthenticated visitor reading a hosted careers page. Treat it as a material caution: the proposed spike is read-only public cards, never candidate upload or application workflow, and requires project-owner approval before a live run.

### Trakstar account host

The separate [hire.trakstar.com robots.txt](https://hire.trakstar.com/robots.txt) currently disallows all paths:

```text
User-agent: *
Disallow: /
Disallow: /*
Disallow: /*?
```

This is an account/product host, not the public HackerEarth hosted-careers host. Do not request it, log in, or treat the public board's `hire.trakstar.com` subdomain as permission to access the account host.

### Legacy Recruiterbox host

The [legacy Recruiterbox robots URL](https://hackerearthjobs.recruiterbox.com/robots.txt) resolves to the same Trakstar rules and public sitemap. The Trakstar page itself links to the old HTTP Recruiterbox jobs URL, but that stale link is not an approved alternate source. Do not follow it, and do not use a legacy URL to evade the current host's policy or inventory.

### Current JazzHR host (reconciliation/fallback only)

The official `/careers/` iframe's [ApplyToJob robots.txt](https://hackerearth.applytojob.com/robots.txt) currently says:

```text
User-agent: SemrushBot
User-agent: dotbot
Disallow: /

User-agent: *
Disallow: /cb
```

Its public board and detail paths are not disallowed for the generic group. The file advertises JazzHR `app.jazz.co` sitemaps; do not fetch those sitemaps for this spike.

The [JazzHR Terms of Service](https://www.jazzhr.com/terms-of-service) were last updated November 27, 2024. They are a customer/service agreement: they prohibit direct competitors from accessing JazzHR software/services without written consent and restrict reverse engineering, unauthorized use, and making the service available to third parties. They do not clearly authorize an external public-board collector. The [JazzHR security page](https://www.jazzhr.com/security) confirms that the platform processes applicant/resume data, which is another reason to keep the form boundary untouched.

For completeness, the provider policy hosts read publicly were:

- [JazzHR marketing robots.txt](https://www.jazzhr.com/robots.txt): generic `Allow: /`, with `/studio/`, `/api/`, `/404`, and `/500` disallowed; this does not grant access to the customer-specific `applytojob.com` tenant.
- [JazzHR info robots.txt](https://info.jazzhr.com/robots.txt): `Disallow: /rs/`; no request to that host is needed.
- [JazzHR app robots.txt](https://app.jazz.co/robots.txt): `SemrushBot` and `dotbot` disallowed globally, generic `/cb` disallowed; no request to this provider sitemap is needed.
- [Trakstar marketing robots.txt](https://www.trakstar.com/robots.txt): marketing/WordPress paths are selectively disallowed; it is not the hosted careers source.

## Bright Data Marketplace overlap and worker choice

Public research did not surface a Bright Data pre-built scraper or Marketplace dataset specifically named HackerEarth, HackerEarth Careers, `hackerearthjobs.hire.trakstar.com`, `hackerearth.applytojob.com`, Trakstar Hire, or JazzHR. This is only a public-search signal, not proof about the private account catalog. Before creating a custom collector, inspect the available account catalog without placing a live target call. A generic [Bright Data Jobs Scraper API](https://brightdata.com/products/web-scraper/jobs-scraper) exists, but its public examples emphasize major job sites and it is not evidence of a HackerEarth-specific pre-built schema. It also does not override the mandatory custom Scraper Studio path or the target's policy gate.

Bright Data's [Scrapers Library overview](https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview) describes 660+ pre-built scrapers and says custom scrapers are appropriate for a site not covered by the library. The [Scraper Studio FAQ](https://docs.brightdata.com/datasets/scraper-studio/faqs) distinguishes Discovery and PDP modes, while [worker-type guidance](https://docs.brightdata.com/datasets/scraper-studio/worker-types) says Code worker is faster/cheaper when raw HTML or a public endpoint contains the needed data and Browser worker is for client-rendered interaction. Start with the least interactive approved worker. Do not use a proxy, Browser worker, Web Unlocker, direct Trakstar API, or legacy ATS endpoint to evade robots, terms, or a block.

## Exact one-input low-credit Scraper Studio prompts

Use the Discovery prompt only after the provenance, robots, policy, and budget gates below pass. The input count is exactly one.

### Discovery input

```text
https://www.hackerearth.com/companies/hackerearth/jobs/
```

### Discovery prompt

```text
From the supplied public HackerEarth company-careers URL, extract only the first visible public catalog page. Follow at most the normal public redirect from https://www.hackerearth.com/companies/hackerearth/jobs/ to https://hackerearthjobs.hire.trakstar.com/. Do not use any other input or alternate ATS URL.

Do not click or open job details, Apply, LinkedIn, Indeed, ?apply=true, pagination, Prev, Next, filters, search controls, recruiter login, candidate login, the legacy recruiterbox.com link, any sitemap, or any account/application page. Do not submit a form, upload a file, or collect candidate/application data. Stop after the first visible page; do not paginate or fan out to PDPs.

Return JSON records only, one object per visible public job card, with these fields:
- jobId: the exact slug from the canonical public /jobs/<slug>/ detail href
- title: the exact visible job title
- location: the exact visible location string
- department: the exact visible Team string when shown
- employmentType: the exact visible employment type when shown, otherwise null
- companyJobUrl: the absolute canonical https://hackerearthjobs.hire.trakstar.com/jobs/<slug>/ URL
- sourceCatalogUrl: https://www.hackerearth.com/companies/hackerearth/jobs/
- resolvedCatalogUrl: the public Trakstar catalog URL reached by the normal redirect
- collectedAt: collection timestamp

Use only public HackerEarth/Trakstar catalog content. Derive jobId only from the detail href; never infer it from a title or description. Require non-empty jobId, title, location, department, and companyJobUrl. Reject rows whose detail URL is not on hackerearthjobs.hire.trakstar.com/jobs/, rows missing a required field, non-job links, filter/search results, login/application data, legacy recruiterbox data, or any candidate PII. Preserve source wording exactly. Do not invent salary, posted date, seniority, workplace type, description, or close date. If the source is unavailable, requires login, presents a challenge, violates a robots/policy gate, or cannot be read without leaving the approved public path, return one error object with errorType and message and stop. Emit records or one error object only.
```

This is a first-page access/schema test, not a claim that all five current roles or all future roles were collected. It deliberately avoids the search facets, pagination, five PDP loads, stale Recruiterbox link, and application form. Record numeric usage outside the output; do not place credentials or Bright Data response metadata in the job records.

### Incremental PDP prompt

Use this only for one Discovery URL that is new or changed. It is not part of the first Discovery input and must not be run over the whole catalog.

```text
From one supplied public HackerEarth Trakstar job-detail URL, extract exactly one public job record and return JSON. Read only the public https://hackerearthjobs.hire.trakstar.com/jobs/<slug>/ page. Do not follow or open Apply, LinkedIn, Indeed, ?apply=true, recruiterbox.com, login, candidate accounts, or any application form. Do not submit, upload, or enter data.

Return:
- jobId: the exact slug from the canonical /jobs/<slug>/ URL
- title: the exact job title
- location: the exact labeled location
- department: the exact labeled team/department
- employmentType: the exact labeled employment type when present, otherwise null
- workplaceType: an explicit labeled remote/hybrid/onsite value when present, otherwise unknown
- description: public role-description sections only; exclude site navigation, footer, related links, Apply controls, and all application-form fields
- companyJobUrl: the canonical public Trakstar detail URL
- applyUrl: the visible Apply href if present, recorded only and never opened
- sourceCatalogUrl: the source catalog URL if supplied with the input
- collectedAt: collection timestamp

Preserve source wording and use null/unknown for absent optional values. Reject login, application, non-job, legacy Recruiterbox, and candidate-data pages. If the page cannot be read without leaving the approved public path, return one error object and stop.
```

## Validation gates

Every gate is pass/fail. A failed gate stops collection and preserves the prior fixture.

### Gate A - provenance and source selection

- [ ] The official `/companies/hackerearth/jobs/` URL still redirects to `hackerearthjobs.hire.trakstar.com`.
- [ ] The redirect target still has a HackerEarth `Website` link, HackerEarth branding, and `powered by Trakstar Hire`.
- [ ] The run source is explicitly pinned to Trakstar or JazzHR; outputs are never mixed.
- [ ] The current `/careers/` JazzHR inventory and Trakstar inventory are reconciled as separate evidence, including the current 5-versus-4 count difference.
- [ ] No legacy Recruiterbox or independent job aggregator is used as provenance.

### Gate B - policy and host boundaries

- [ ] Recheck the HackerEarth, Trakstar-board, ApplyToJob, and relevant provider robots files on the run date.
- [ ] The effective worker/user-agent is compatible with the relevant robots rules; no `/prepare*`, `/published_jobs_list_v2*`, login, AJAX, localized, account, or application path is requested.
- [ ] Project owner records that a bounded public job-card read is acceptable under the current HackerEarth Terms, Trakstar AUP/Terms, and any JazzHR fallback interpretation.
- [ ] No candidate/application PII, form fields, resumes, CTC questions, cookies, accounts, or authentication data are collected.
- [ ] No request is made to `hire.trakstar.com`, direct Trakstar APIs, old Recruiterbox, or an alternate host to evade a restriction.

### Gate C - one-input access and cost

- [ ] Exactly one input is submitted: `https://www.hackerearth.com/companies/hackerearth/jobs/`.
- [ ] The run follows only the normal public redirect and stops at the first visible Trakstar catalog page.
- [ ] No filters, search, pagination, detail, Apply, or vendor legacy links are loaded during Discovery.
- [ ] The first page is public and readable without login, challenge, or policy warning.
- [ ] Numeric usage is recorded outside output and stays within the current plan's one-input/low-credit budget gate.

### Gate D - Discovery schema and provenance

- [ ] Every record has non-empty `jobId`, `title`, `location`, `department`, and canonical `companyJobUrl` on the approved Trakstar host.
- [ ] `jobId` is taken from the `/jobs/<slug>/` href and is stable across reruns.
- [ ] `sourceCatalogUrl` remains the first-party HackerEarth URL and `resolvedCatalogUrl` remains the observed Trakstar catalog.
- [ ] No duplicate slug or canonical URL appears in the first-page output.
- [ ] No output contains candidate/application data or claims full-catalog coverage.

### Gate E - incremental PDP

- [ ] PDP is run only for a new or changed Discovery URL, never for every first-page card by default.
- [ ] PDP preserves title, location, team, employment type, and public role description while excluding form fields and site chrome.
- [ ] `workplaceType` is null/unknown unless explicitly labeled; do not infer from a sentence such as `Hybrid` in the description.
- [ ] `applyUrl`, if recorded, is an untouched outbound link and no delegated application host is opened.
- [ ] Any missing, changed, or contradictory field is surfaced for review instead of silently merging JazzHR and Trakstar values.

### Gate F - filters, pagination, and fallback expansion

- [ ] Any later filtered run uses the visible Country/City/Team controls and validates each returned row against the selected values.
- [ ] Query strings or a `1 - N of N` label alone do not prove that a filter or complete inventory was applied.
- [ ] Any later pagination run records page URLs, actual final-page behavior, duplicate rate, and count reconciliation.
- [ ] Full Discovery is not paired with a full PDP sweep; detail fetches remain incremental.
- [ ] Any challenge, policy warning, robots change, inventory mismatch that cannot be explained, or budget uncertainty stops the run immediately.

## Fallback recommendation

Use the official HackerEarth redirect-to-Trakstar path for the first one-input experiment if the gates pass. It is the only source in this audit with both a first-party corporate URL redirect and a public Trakstar catalog. Keep the JazzHR `/careers/` embed as a documented reconciliation and fallback source, not as a hidden second input.

If Trakstar's current AUP/Terms interpretation is not approved, or if the public redirect/path changes, do not switch to the direct Trakstar API, old Recruiterbox, a job aggregator, or a proxy/browser escalation. First consider the official JazzHR catalog (`https://hackerearth.applytojob.com/apply/jobs/`) as a separately gated one-input fallback. If JazzHR is also not approved or blocked, preserve the controlled fixture and move to the next plan target. Any fallback run must use its own exact prompt, source host, robots check, schema, and evidence; never merge the four JazzHR rows into the five Trakstar rows.

If the Trakstar first page passes access but fields fail, keep the sanitized first-page evidence as a constrained validation result and stop. Do not claim reliable pagination or full inventory until the filter/pagination gates pass on a later approved run.

## Source ledger

- [HackerEarth home](https://www.hackerearth.com/)
- [HackerEarth official Careers page](https://www.hackerearth.com/careers/)
- [HackerEarth first-party `/companies/hackerearth/jobs/` redirect](https://www.hackerearth.com/companies/hackerearth/jobs/)
- [HackerEarth public developer Jobs page](https://www.hackerearth.com/jobs/)
- [HackerEarth recruiter login](https://app.hackerearth.com/recruiters/login/)
- [HackerEarth Trakstar public catalog](https://hackerearthjobs.hire.trakstar.com/)
- [Trakstar representative public PDP](https://hackerearthjobs.hire.trakstar.com/jobs/fk0vqiq/)
- [HackerEarth JazzHR public catalog](https://hackerearth.applytojob.com/apply/jobs/)
- [HackerEarth JazzHR representative PDP](https://hackerearth.applytojob.com/apply/jobs/details/ZhjBt8T9ip)
- [HackerEarth Terms of Service](https://www.hackerearth.com/terms-of-service/)
- [HackerEarth Privacy Policy](https://webflow.hackerearth.com/privacy)
- [HackerEarth robots.txt](https://www.hackerearth.com/robots.txt)
- [Trakstar board robots.txt](https://hackerearthjobs.hire.trakstar.com/robots.txt)
- [Trakstar Acceptable Use Policy](https://mitratech.com/en-gb/legal-notice/trakstar/acceptable-use-policy/)
- [Trakstar Terms and Conditions](https://mitratech.com/en-gb/legal-notice/trakstar/trakstar-terms-and-conditions/)
- [Trakstar account-host robots.txt](https://hire.trakstar.com/robots.txt)
- [Legacy Recruiterbox robots.txt](https://hackerearthjobs.recruiterbox.com/robots.txt)
- [JazzHR ApplyToJob robots.txt](https://hackerearth.applytojob.com/robots.txt)
- [JazzHR Terms of Service](https://www.jazzhr.com/terms-of-service)
- [JazzHR Security and Compliance](https://www.jazzhr.com/security)
- [JazzHR marketing robots.txt](https://www.jazzhr.com/robots.txt)
- [JazzHR info robots.txt](https://info.jazzhr.com/robots.txt)
- [JazzHR app robots.txt](https://app.jazz.co/robots.txt)
- [Trakstar marketing robots.txt](https://www.trakstar.com/robots.txt)
- [Trakstar public candidate-application mechanics](https://support.hire.trakstar.com/article/1699-how-do-candidates-apply-to-my-roles)
- [Trakstar published/internal opening visibility](https://support.hire.trakstar.com/article/102-what-are-draft-published-internal-and-archived-openings)
- [Bright Data Scrapers Library overview](https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview)
- [Bright Data Scraper Studio FAQ](https://docs.brightdata.com/datasets/scraper-studio/faqs)
- [Bright Data Scraper Studio worker types](https://docs.brightdata.com/datasets/scraper-studio/worker-types)
- [Bright Data Jobs Scraper API](https://brightdata.com/products/web-scraper/jobs-scraper)
