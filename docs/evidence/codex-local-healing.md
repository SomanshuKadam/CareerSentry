# Local Codex-assisted healing workflow

Status: implemented for offline proposal generation; no Bright Data operation is performed by the workflow.

CareerSentry can use the user's local Codex access without an OpenAI API integration. The application or an operator first saves a sanitized evidence bundle containing:

- the same Collector ID and stable target URL;
- the known-good and broken row counts;
- representative raw preview rows;
- the canonical six-field contract;
- observed selector/markup facts; and
- the retained, sanitized diff summary and failure reason.

The checked-in [`layout-b-codex-input.json`](./layout-b-codex-input.json) is a replayable Layout-B example. It contains fictional project-owned data only and has all mutation flags disabled.

## Run locally

From the repository root, after signing in to Codex CLI locally:

```bash
npm run healing:codex -- --input docs/evidence/layout-b-codex-input.json
```

The command uses `codex exec` with a read-only sandbox, an output JSON Schema, and an ignored output path:

```text
artifacts/codex-healing/layout-b-proposal.json
```

Pass `--force` to replace an existing local proposal. The command fails if the input contains known secret markers, does not declare `secretsRedacted`, targets a path outside this repository, or violates the no-mutation constraints.

If a host process stops after Codex has written the artifact, validate it without invoking Codex again:

```bash
npm run healing:codex -- --validate-only --input docs/evidence/layout-b-codex-input.json
```

The Codex response must contain:

- a diagnosis and confidence score;
- selector/extraction changes for a zero-row failure;
- optional field mappings with confidence, reason, and evidence;
- a Bright Data prompt no longer than 1,000 characters;
- explicit full-run verification checks; and
- an execution policy that is local-only, approval-gated, and unable to mutate Bright Data or PostgreSQL.

The local gate reports either `reviewable` or `rejected`. `reviewable` means only that the proposal is safe to inspect; it is not approval and is not evidence of healing.

## Offline run history

The first local runs caught wrapper issues before any model proposal was accepted: Codex's strict output-schema checker rejected unsupported `const`/`uri` forms and an optional selector property, and one attempt inherited stdin and waited for input. A first corrected run generated the artifact but exceeded the surrounding host command's 180-second limit before returning the wrapper's final status. The final wrapper now isolates Codex to a temporary sanitized workspace; that end-to-end run completed in about 149 seconds and passed the local gate. This remains a local integration result, not Layout-B recovery.

The replay bundle also contained a mixed employment-field expectation: it combined old detail-page work-arrangement values with the listing's role-type concept. The later live review caught and disclosed that evidence defect before approval. The exact historical input remains unchanged so the failure record is reproducible.

## Human-controlled next step

If the proposal is useful, the operator may inspect it and decide whether to copy its bounded prompt into the Bright Data Self-Healing workflow. A separate owner approval is still required before any Bright Data request, preview approval, collector save, or post-approval run. The existing CareerSentry adapter validates the resulting full dataset after that operation.

This workflow cannot prove Layout-B recovery locally. A zero-row failure requires selector or extraction repair; field renaming alone cannot produce rows. The separately authorized live follow-up later returned `CS-101`, `CS-102`, and `CS-103` on the unchanged Collector ID and passed the adapter gate; that external verification—not the local proposal—established recovery. See [`layout-b-codex-assisted-success.json`](./layout-b-codex-assisted-success.json).

The official OpenAI Docs describe [`codex exec`](https://learn.chatgpt.com/docs/non-interactive-mode) as the non-interactive CLI mode for scripts and pipelines, with read-only defaults and structured output support. This repository uses that capability locally rather than adding an OpenAI API dependency or running Codex inside Vercel.
