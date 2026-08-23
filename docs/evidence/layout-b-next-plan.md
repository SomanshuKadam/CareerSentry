# Next Layout-B recovery plan

Status: bounded Codex-assisted follow-up completed; Layout-B recovery verified on 2026-08-23.

The goal remains unchanged: repair collector `c_mt5mfwuv2910ltr23s` in place so the stable URL returns the same three fictional roles in layout B without changing CareerSentry's downstream contract.

The owner-authorized attempt used this plan's selector-only prompt. Bright Data changed the B parser selectors, but its final collection mapping still emitted the incompatible legacy fields. The proposal was rejected before save, the fixture was restored to A, and no post-approval run occurred. See [`layout-b-selector-heal-rejected.json`](./layout-b-selector-heal-rejected.json).

CareerSentry added an offline, allowlisted schema-drift adapter for the observed legacy labels. A later explicitly authorized attempt inspected and accepted that schema, then established recovery through one complete post-approval run. The sanitized result is retained in [`layout-b-codex-assisted-success.json`](./layout-b-codex-assisted-success.json).

## Completed outcome

- One local Codex proposal identified the stale listing iterator and adapter-compatible schema aliases.
- One direct Self-Healing request supplied the stable URL as `custom_input` and reached the approval gate.
- The retained diff iterated every `section.role-tile`, removed the old selectors, and preserved the allowlisted Bright Data output schema.
- After explicit approval/save, the unchanged Collector ID returned exactly `CS-101`, `CS-102`, and `CS-103`.
- CareerSentry's adapter normalized all three rows with no validation error, and the fixture was restored to layout A.
- The run disclosed that the B listing's `Role type` and the old detail page's `Work arrangement` are different source concepts; earlier mixed expectations remain historical evidence rather than exact parity claims.

## Preparation completed

- Keep production on safe layout A.
- Keep RevRag, PostgreSQL, and product jobs out of scope.
- Validate the exact B-shaped raw contract locally.
- Treat `preview_result` as representative sample output, not a full-run count.
- Initially reject raw schema changes; after the adapter was implemented, allow only the exact observed aliases and known metadata while preserving the canonical downstream contract.
- Retain the complete sanitized progress envelope, preview, diff summary, and view URL before deciding.

## Selector-only prompt used by the rejected attempt

```text
Modify extraction logic only. Do not rename, add, remove, or reinterpret fields. Preserve exactly: job_id_value, title, location, department, employment_type, company_job_url. On the current page, iterate section.role-tile; map the Requisition value to job_id_value, the h2 a text to title and its same-origin href to company_job_url, .role-tile__team to department, the strong value following Based in to location, and the strong value following Role type to employment_type. Do not use .job-card selectors. Do not change stages, navigation, or output schema.
```

## Adapter-aware gate used by the successful follow-up

The separately approved follow-up performed this sequence:

1. Deploy the owned fixture in layout B and verify its public markup without Bright Data.
2. Trigger one Self-Healing request on the existing Collector ID with the stable URL passed explicitly as API `custom_input`.
3. Poll until approval, failure, or timeout. Inspect the generated diff and representative preview. Do not infer total row count from the preview.
4. Reject unknown/conflicting schema changes, old selectors, unrelated navigation changes, or invalid values; allow only the exact adapter-supported aliases and known metadata.
5. Only after a valid diff and representative field shape are approved, save the same collector and run it once against B.
6. Accept recovery only when the post-approval dataset contains exactly `CS-101`, `CS-102`, and `CS-103`, with valid required fields, same-origin URLs, no duplicates, and the existing ingestion contract.
7. Restore layout A regardless of outcome. Do not retry or create a replacement collector.
