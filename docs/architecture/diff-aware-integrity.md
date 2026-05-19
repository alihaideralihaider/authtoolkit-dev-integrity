# Diff-Aware Integrity

## Purpose

Diff-Aware Integrity moves AuthToolkit Dev Integrity beyond file-path heuristics by inspecting safe Git diff signals in changed content.

It is deterministic, local-first, and explainable. It does not call AI APIs, does not auto-fix, and does not print full raw diffs or secret values.

## What It Inspects

Diff-Aware Integrity consumes parsed output from `git diff --unified=0` and reviews added and removed lines only.

It looks for simple indicators such as:

- removed auth guard terms
- removed authorization or tenant-boundary terms
- added public-access terms
- service-role usage changes
- webhook handling changes
- removed signature verification terms
- payment state or idempotency changes
- env var name additions or removals
- Cloudflare, Wrangler, binding, deploy, route, or runtime changes
- SMS, WhatsApp, Twilio, consent, STOP, or HELP changes
- secret-like assignment names

## Safe Evidence Rules

Reports must not include full raw diff lines.

Reports may include:

- finding name
- severity
- file path
- signal type
- safe reason
- env var or secret-like name only when the name is safe to show
- redacted value summary
- suggested review packs
- suggested next action

Reports must not include:

- secret values
- raw env values
- full source snippets
- full raw diffs
- logs
- customer data
- payment data
- session data

## Why Diff-Aware Review Matters

Path-based Git Monitoring can identify that a checkout, webhook, auth, or config file changed. Diff-Aware Integrity adds a second layer by asking whether sensitive indicators changed inside the file.

Examples:

- Removing a signature verification indicator from a webhook file is more sensitive than editing comments.
- Adding a service-role reference requires Vault and security review.
- Changing payment state or idempotency logic requires payment review.
- Adding an env var name requires runtime and Vault readiness checks.

## Confidence Impact

Diff-Aware Integrity caps confidence when deterministic findings are present:

- critical diff finding: confidence max 30
- high diff finding: confidence max 45
- medium diff finding: confidence max 55
- no diff finding: no confidence impact

This cap is a routing signal. It does not prove a defect exists.

## Pipeline Integration

Diff-Aware Integrity feeds:

- confidence score
- PR Integrity
- Release Readiness
- Runtime Integrity
- Evidence Timeline
- markdown reports

## Limitations

Diff-Aware Integrity v1 is pattern-based only.

It does not:

- understand full program semantics
- prove a route is safe
- prove authorization is correct
- inspect runtime logs
- execute tests
- inspect provider dashboards
- replace human review

False positives are expected when keywords appear in comments, docs, tests, or integrity tooling.

## What This Does Not Do Yet

Diff-Aware Integrity v1 is not:

- AI analysis
- semantic LLM review
- autofix
- dashboard
- SaaS
- PR approval
- release automation
- runtime monitoring
