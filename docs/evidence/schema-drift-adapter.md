# Bright Data schema-drift adapter

Status: implemented, tested offline, and verified against one explicitly approved Layout-B full run.

Bright Data Self-Healing may propose changed output labels and asks the operator to confirm schema changes before production save. CareerSentry now treats the Bright Data row as a raw boundary and maps only the aliases observed in the approved Layout-B proposal into the existing canonical database contract.

| Bright Data raw label | CareerSentry canonical field | Rule |
| --- | --- | --- |
| `role_id` | `job_id_value` | Allowed only when `job_id` and `job_id_value` are absent; conflicting IDs are rejected. |
| `team` | `department` | Allowed only when `department` is absent; conflicting values are rejected. |
| `official_role_url` | `company_job_url` | Allowed only when `company_job_url` is absent; URL origin and HTTPS are still enforced. |
| `product_page_url`, `input` | none | Known Bright Data metadata; ignored. |

The adapter does not infer arbitrary labels, change the PostgreSQL schema, weaken URL or row validation, or silently accept unknown fields. The canonical contract remains `job_id_value`, `title`, `location`, `department`, `employment_type`, and `company_job_url`.

For less certain labels such as `function`, `business_unit`, `role_type`, or `based_in`, the proposal layer returns a review-level suggestion with confidence, reason, and evidence. It does not apply that suggestion unless the caller explicitly approves the exact source-to-target mapping. Values such as `Engineering`, `Support`, or `Manager` are preserved as values; they are never reclassified solely from their text.

The adapter was exercised against the approved same-ID Layout-B result on 2026-08-23. Bright Data returned exactly three rows using `role_id`, `team`, and `official_role_url`, plus known metadata. CareerSentry normalized all three into the six canonical fields with no validation errors. See [`layout-b-codex-assisted-success.json`](./layout-b-codex-assisted-success.json).

The verified result does not weaken the gate: future unknown labels still require explicit mapping review, and every saved repair still requires a complete post-approval run before recovery can be claimed.

See the [Bright Data Self-Healing guide](https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool) for its documented diff, draft-preview, schema-confirmation, and production-save sequence.
