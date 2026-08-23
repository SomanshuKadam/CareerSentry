# Controlled Scraper Studio healing incident

Date: 2026-08-21
Collector: `c_mt1wzptjco00s7w0p`
Owned target: `https://career-sentry.vercel.app/demo-target`

This evidence contains only CareerSentry-owned fixture job data. It contains no API token, account data, candidate data, application form, or real-company collection.

## Timeline

1. Codex created one custom Scraper Studio Discovery collector against layout A through the Bright Data CLI.
2. The first run returned three roles but exposed the requisition as `job_id_value`. CareerSentry now maps this explicit raw alias to canonical `JobRecord.jobId`.
3. An attempted literal `job_id` repair passed its representative preview but failed the required saved-template rerun: the requisition field disappeared. CareerSentry rejected recovery and moved the incident to `needs_review`.
4. A sharper repair still previewed `job_id_value` and was explicitly rejected before save.
5. A final bounded restore repair previewed the six required business fields, was approved, and saved the same Collector ID.
6. The full layout-A verification returned three distinct requisitions (`CS-101`, `CS-102`, `CS-103`), complete required fields, no duplicates, and only project-owned HTTPS URLs. See `layout-a-recovered.json`.
7. Running the same collector against layout B returned zero rows. The three-to-zero count drop created a degraded incident. See `layout-b-degraded.json`.
8. A selector-specific layout-B heal preserved the layout-A control preview, but Scraper Studio reported `status=failed` during approval and explicitly left the collector unchanged. No further live heal was attempted.

## Stable-URL API follow-up — 2026-08-23

The stable-URL collector was later tested with one owner-authorized direct AI Flow Self-Healing request. The fixture was deployed in layout B, and the stable URL was passed explicitly as `custom_input` so the request did not rely on the CLI's `--url` hint.

1. Collector `c_mt5mfwuv2910ltr23s` reached `pending_answer` / `user_approval`.
2. The preview contained one row rather than three and changed the established raw contract to `role_id`, `team`, and `official_role_url` instead of the required six fields.
3. The proposal was rejected before save. No post-approval run was made, and the Collector ID remained unchanged.
4. The fixture was restored to layout A. The sanitized preview is retained in [`layout-b-api-heal-rejected.json`](./layout-b-api-heal-rejected.json).

The follow-up is analyzed in the [Layout-B healing postmortem](./layout-b-healing-postmortem.md). In particular, the single preview row is sample output, not proof that the proposed scraper would enumerate only one role; the schema mismatch remains the concrete rejection reason.

## Selector-only API follow-up — 2026-08-23

The next owner-authorized attempt used the shorter selector-only prompt and retained the full sanitized progress envelope and diff summary in [`layout-b-selector-heal-rejected.json`](./layout-b-selector-heal-rejected.json).

1. Layout B was deployed and verified read-only: three `role-tile` elements, zero `job-card` elements, and the three fictional requisitions were present.
2. One Self-Healing request reached `pending_answer` / `user_approval`. The generated parser correctly switched to B selectors and extracted the six intermediate fields.
3. The final `collect` mapping still emitted `role_id`, `team`, `official_role_url`, and `product_page_url`, so the proposal changed the established raw contract even though the preview showed the intermediate six fields. It was not safe to approve.
4. The direct rejection call returned HTTP 400 without transitioning the job. Bright Data's supported CLI `--reject` path then closed the same proposal with `status=rejected`; no approval, save, or post-approval run occurred.
5. Layout A was restored. The fixture returned three A cards and no B tiles, while `/jobs` still rendered the 13 persisted RevRag roles.

## Safety gates demonstrated

- One stable Collector ID throughout.
- No automatic approval.
- Preview validation is necessary but not sufficient.
- Every approved repair requires a fresh production rerun.
- Invalid previews are rejected; failed saves do not trigger replacement collectors.
- Empty output after a non-empty baseline is treated as degraded, never as “no jobs.”
- The last reported Bright Data ledger remained $52.00 balance, $0.00 pending charge, $0.00 zone cost, and 0 B on CLI zones. The platform did not expose credit conversion, so run counts are retained in the canonical plan.

## Codex-assisted adapter-aware recovery — 2026-08-23

One separately authorized follow-up used the sanitized local Codex proposal and the allowlisted schema adapter rather than rejecting Bright Data's known aliases outright.

1. Layout B was deployed and verified with three `role-tile` elements and no `job-card` elements.
2. One direct Self-Healing request supplied the stable URL as `custom_input` and reached `pending_answer` / `user_approval`.
3. The retained diff iterated every B tile and emitted the already allowlisted Bright Data schema. The two preview rows were treated as samples, not a row-count claim.
4. The owner approved and saved the inspected diff. One post-approval run on `c_mt5mfwuv2910ltr23s` returned exactly `CS-101`, `CS-102`, and `CS-103`.
5. CareerSentry normalized all three rows into its six canonical fields with no validation errors. Layout A was then restored, and the separate 13-role RevRag snapshot remained unchanged.

The complete sanitized result is in [`layout-b-codex-assisted-success.json`](./layout-b-codex-assisted-success.json). It also records a fixture evidence issue: the listing's `Role type` and detail page's `Work arrangement` are different source concepts and must not be presented as identical values.

## Current state

The same stable collector is now verified for the controlled Layout-B page change: the saved repair returned three adapter-valid rows in the required post-approval run. The fixture is publicly restored to layout A, while the earlier zero-row and rejected-proposal records remain visible as historical failure evidence.

No RevRag collection or PostgreSQL mutation occurred during this experiment.
