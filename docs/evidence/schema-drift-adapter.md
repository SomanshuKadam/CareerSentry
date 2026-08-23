# Bright Data schema-drift adapter

Status: implemented and tested offline; no Bright Data collector mutation or schema update was performed.

Bright Data Self-Healing may propose changed output labels and asks the operator to confirm schema changes before production save. CareerSentry now treats the Bright Data row as a raw boundary and maps only the aliases observed in the approved Layout-B proposal into the existing canonical database contract.

| Bright Data raw label | CareerSentry canonical field | Rule |
| --- | --- | --- |
| `role_id` | `job_id_value` | Allowed only when `job_id` and `job_id_value` are absent; conflicting IDs are rejected. |
| `team` | `department` | Allowed only when `department` is absent; conflicting values are rejected. |
| `official_role_url` | `company_job_url` | Allowed only when `company_job_url` is absent; URL origin and HTTPS are still enforced. |
| `product_page_url`, `input` | none | Known Bright Data metadata; ignored. |

The adapter does not infer arbitrary labels, change the PostgreSQL schema, weaken URL or row validation, or silently accept unknown fields. The canonical contract remains `job_id_value`, `title`, `location`, `department`, `employment_type`, and `company_job_url`.

The adapter makes a future Bright Data schema-update proposal testable, but it does not make the latest Layout-B experiment successful: no alternate-schema draft was approved or run, so full three-row B verification remains outstanding. A future live attempt still requires explicit approval and must validate the complete post-acceptance output before saving production.

See the [Bright Data Self-Healing guide](https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool) for its documented diff, draft-preview, schema-confirmation, and production-save sequence.
