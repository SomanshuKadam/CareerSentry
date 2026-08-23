# Layout-B healing postmortem

Date: 2026-08-23
Collector: `c_mt5mfwuv2910ltr23s`
Target: `https://career-sentry.vercel.app/demo-target/live`
Status: unresolved; no further live attempt is authorized without a new decision.

## What happened

The stable fixture returned three rows on the before-change page and an empty array on the after-change page. The first CLI healing attempt used the same Collector ID, reached approval, was saved, and still returned an empty array after approval.

One final API-level attempt deployed the fixture in the after-change state and passed the stable URL explicitly as `custom_input`. Bright Data reached `pending_answer` / `user_approval`. Its preview contained a representative row with these fields:

- `role_id`
- `title`
- `team`
- `location`
- `employment_type`
- `official_role_url`
- `product_page_url`

The proposal was rejected before save because it did not preserve CareerSentry's established six-field raw contract (`job_id_value`, `title`, `location`, `department`, `employment_type`, `company_job_url`). No post-approval run was made.

A subsequent owner-authorized selector-only attempt retained the generated diff. It successfully changed the listing parser to `section.role-tile`, `h2 a`, `.role-tile__team`, and the `Based in` / `Role type` / `Requisition` labels, and its intermediate parser output contained the six required fields. However, the final `collect` code still mapped those values to `role_id`, `team`, `official_role_url`, and `product_page_url`. The preview therefore looked contract-compatible at the intermediate stage while the proposed saved output remained incompatible. The direct rejection request returned HTTP 400 without changing the pending state; the supported CLI `--reject` path then closed the same proposal as `rejected`. It was never approved or saved, and no post-approval run was made. The complete sanitized progress and diff summary are in [`layout-b-selector-heal-rejected.json`](./layout-b-selector-heal-rejected.json).

## What CareerSentry did wrong

1. The first attempt treated CLI `--url` as input to the healing job. Bright Data's CLI reference says that flag is only woven into the `next_step` hint; it is not sent to the heal call.
2. The API attempt treated `preview_result` containing one row as evidence that the repair enumerated only one role. Bright Data describes this as sample output, so preview row count is not a full-run count assertion.
3. We did not inspect and retain the generated diff or the full sanitized approval envelope before rejecting. That removed the clearest evidence of whether the proposed code actually switched from the A selectors to the B selectors.
4. The prompt combined selector repair, enumeration requirements, and schema preservation. A shorter selector-only prompt may reduce the chance that the AI rewrites the output contract.

## What Bright Data proposed incorrectly

The preview changed field names and appeared to use an alternative schema despite the prompt requesting the existing fields. It also did not provide enough evidence to establish full enumeration. Because the proposal was rejected, no code was saved and the collector remained unchanged.

The explicit `custom_input` attempt suggests the B page context may have reached the AI flow—the returned values match the B page's labels—but the discarded diff is unavailable, so this remains an inference rather than proof.

## Contract boundary added after the incident

CareerSentry now has an allowlisted schema-drift adapter for the observed Bright Data aliases: `role_id` can map to `job_id_value`, `team` to `department`, and `official_role_url` to `company_job_url`. Known platform metadata remains ignored, while unknown or conflicting mappings are rejected. This lets a future Bright Data schema-update proposal be evaluated without changing the database contract.

This does not retroactively make the rejected healing attempt successful. That proposal was never approved or run, so its full B output was never verified. The adapter only changes the future acceptance gate: a complete post-acceptance run must still produce exactly the expected roles and valid canonical fields.

## What was done correctly

- The stable Collector ID was preserved.
- The fixture was owned, public, fictional, and isolated from RevRag and PostgreSQL.
- The approval gate was not bypassed.
- The incompatible proposal was rejected before save.
- No post-approval result was described as successful.
- The fixture was restored to layout A after the experiment.

## Correct next-attempt discipline (not authorized)

If a new attempt is later approved, it should use the selector-only prompt and gates in [`layout-b-next-plan.md`](./layout-b-next-plan.md). The operator should inspect the generated diff and treat the preview as representative field evidence only. Full row count, duplicates, provenance, and unchanged downstream shape must be verified by the one post-approval B run.

Bright Data's documented flow is asynchronous: trigger Self-Healing, poll progress, review the proposed change, approve or reject it, then collect again. See the [CLI healing reference](https://github.com/brightdata/cli#scraper-heal), [Self-Healing API](https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/trigger-self-healing), and [approval API](https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/resume-self-healing-job).
