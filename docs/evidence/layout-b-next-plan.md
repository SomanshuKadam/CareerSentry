# Next Layout-B recovery plan

Status: bounded live attempt completed; Layout-B recovery remains unresolved and no further live Bright Data operation is authorized.

The goal remains unchanged: repair collector `c_mt5mfwuv2910ltr23s` in place so the stable URL returns the same three fictional roles in layout B without changing CareerSentry's downstream contract.

The owner-authorized attempt used this plan's selector-only prompt. Bright Data changed the B parser selectors, but its final collection mapping still emitted the incompatible legacy fields. The proposal was rejected before save, the fixture was restored to A, and no post-approval run occurred. See [`layout-b-selector-heal-rejected.json`](./layout-b-selector-heal-rejected.json).

## Preparation completed

- Keep production on safe layout A.
- Keep RevRag, PostgreSQL, and product jobs out of scope.
- Validate the exact B-shaped raw contract locally.
- Treat `preview_result` as representative sample output, not a full-run count.
- Reject any proposal that renames, adds, removes, or reinterprets the established raw fields.
- Retain the complete sanitized progress envelope, preview, diff summary, and view URL before deciding.

## Selector-only prompt

```text
Modify extraction logic only. Do not rename, add, remove, or reinterpret fields. Preserve exactly: job_id_value, title, location, department, employment_type, company_job_url. On the current page, iterate section.role-tile; map the Requisition value to job_id_value, the h2 a text to title and its same-origin href to company_job_url, .role-tile__team to department, the strong value following Based in to location, and the strong value following Role type to employment_type. Do not use .job-card selectors. Do not change stages, navigation, or output schema.
```

## Future live gate

If separately approved, perform exactly this sequence:

1. Deploy the owned fixture in layout B and verify its public markup without Bright Data.
2. Trigger one Self-Healing request on the existing Collector ID with the stable URL passed explicitly as API `custom_input`.
3. Poll until approval, failure, or timeout. Inspect the generated diff and representative preview. Do not infer total row count from the preview.
4. Reject if the diff changes schema/fields, uses the old selectors, changes stages/navigation, or produces invalid field values.
5. Only after a valid diff and representative field shape are approved, save the same collector and run it once against B.
6. Accept recovery only when the post-approval dataset contains exactly `CS-101`, `CS-102`, and `CS-103`, with valid required fields, same-origin URLs, no duplicates, and the existing ingestion contract.
7. Restore layout A regardless of outcome. Do not retry or create a replacement collector.
