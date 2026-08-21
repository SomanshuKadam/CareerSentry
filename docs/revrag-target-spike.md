# RevRag AI target spike

Evidence snapshot: 2026-08-22. This is a bounded public-careers result, not a claim that future collection is permitted if the site or its terms change.

## Decision

RevRag AI is a suitable long-tail target for a one-input public job-metadata spike. The official company site links to its own careers catalog, the catalog and detail pages stay on `www.revrag.ai`, and the pages were readable without login. Application workflows are outside the boundary.

## Provenance and public baseline

- Corporate site: [revrag.ai](https://www.revrag.ai/) -> [Careers](https://www.revrag.ai/careers).
- Catalog: `https://www.revrag.ai/careers`; detail pattern: `https://www.revrag.ai/careers/<role-slug>`.
- Baseline on 2026-08-22: 15 published role pages — **10 accepting applications (active)** and **5 marked Opening soon**.
- Cards and details were public and did not require an account. The Apply action delegates to Google Forms; those forms, their URLs, and applicant data are explicitly excluded.

## Robots and terms

[RevRag's robots.txt](https://www.revrag.ai/robots.txt) returned HTTP 200 with `User-agent: *`, `Allow: /`, and an official `Sitemap:` directive. This is a crawl signal, not legal permission.

The official site's [Terms & Conditions](https://www.revrag.ai/terms-and-condition/terms-conditions), updated 2026-07-28, apply to site visitors and prohibit circumvention, unlawful user-data collection, and source-code extraction. The reviewed text did not contain an explicit scraper, robot, automated-access, or public-job-metadata restriction. The spike therefore remains limited to already-public job metadata, with no bypass, applicant data, source-code extraction, login, or form interaction; robots and terms are separate checks.

## One-input collection boundary

Use exactly one public Discovery input: `https://www.revrag.ai/careers`.

Include only cards explicitly accepting applications and extract the published role slug (or the same-origin detail URL), title, department/category, location, employment type or internship duration, summary when present, application status, and the absolute same-origin company job URL. Accept only `https://www.revrag.ai/careers/...` detail URLs. Do not follow or emit Google Form URLs, open application pages, submit forms, or derive an ID from a title. Do not fan out to PDPs in this low-credit spike.

## Public Bright Data overlap check

Exact public-domain searches for `RevRag` restricted to Bright Data's public web-scraper and dataset product listings returned no match ([web scrapers](https://brightdata.com/products/web-scraper), [datasets](https://brightdata.com/products/datasets)). The first-party catalog is not a generic ATS, so no applicable host-level pre-built workflow was identified. This is only a public-search result: it cannot prove that an account-private Marketplace/catalog entry is absent.

## Collector evidence and gates

Collector: `c_mt3ctgtj2rqnwsqm8p`.

The first single-input run returned 15 array entries: 10 valid active roles and five `parse_error` envelopes for the five Opening soon cards. The valid rows had distinct role slugs, business fields, and first-party detail URLs, but generated `job_url` values pointed at Google Forms. That is a **degraded 10+5 run**, not a healthy snapshot.

An approval-gated cleanup was saved in place on the same Collector ID. It excluded Opening soon cards before detail navigation, emitted the same-origin detail URL as `company_job_url`, and did not open or emit application forms. Verification then returned 10 rows, zero error envelopes, zero Google/application-form references, 10 distinct same-origin detail URLs, and the expected business fields. Scraper Studio omitted a separate `job_id` after save; the verified ingestion boundary uses each explicitly published, unique detail-URL slug as the stable identity fallback. No title-derived identity is accepted.

Acceptance gates for any repeat are: the 10-active/5-opening-soon baseline is rechecked; exactly 10 active rows are accepted; error envelopes are zero; every company URL is same-origin under `/careers/`; detail slugs are non-empty and distinct; and no login, form, applicant data, or Google URL enters the snapshot.

## Sources

- [RevRag AI](https://www.revrag.ai/)
- [RevRag Careers](https://www.revrag.ai/careers)
- [RevRag robots.txt](https://www.revrag.ai/robots.txt)
- [RevRag Terms & Conditions](https://www.revrag.ai/terms-and-condition/terms-conditions) (updated 2026-07-28)
- [Bright Data web-scraper products](https://brightdata.com/products/web-scraper)
- [Bright Data datasets](https://brightdata.com/products/datasets)
