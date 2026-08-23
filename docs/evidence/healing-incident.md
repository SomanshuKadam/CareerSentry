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

## Safety gates demonstrated

- One stable Collector ID throughout.
- No automatic approval.
- Preview validation is necessary but not sufficient.
- Every approved repair requires a fresh production rerun.
- Invalid previews are rejected; failed saves do not trigger replacement collectors.
- Empty output after a non-empty baseline is treated as degraded, never as “no jobs.”
- The last reported Bright Data ledger remained $52.00 balance, $0.00 pending charge, $0.00 zone cost, and 0 B on CLI zones. The platform did not expose credit conversion, so run counts are retained in the canonical plan.

## Current state

The collector remains valid for layout A. Layout B is a documented unresolved `needs_review` incident because the prior saved repair still returned zero rows and the final API-level proposal was rejected before save. This is honest failure evidence, not a simulated success claim.
