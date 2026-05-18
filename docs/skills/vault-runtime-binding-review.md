# vault-runtime-binding-review

## Purpose
Review runtime bindings, deployment targets, provider callbacks, and environment-specific wiring.

## When to run
- Cloudflare, OpenNext, Worker, queue, R2, D1, KV, or service binding config changes.
- Webhook URLs change.
- Provider project targets change.

## Inputs
- Runtime binding inventory
- Deployment config
- Provider callback names
- Expected environment targets

## Checklist
- Worker names and routes match expected environment.
- Bindings point to expected resources.
- Webhook URLs match provider dashboard intent.
- Preview and production are not confused.
- Drift is documented.

## Output format
- Binding risks
- Drift findings
- Evidence needed
- Recommended next action

## Failure examples
- Production Worker points to preview resource.
- Webhook URL targets old deployment.
- Service binding name changed without inventory update.

## Suggested fix format
Verify expected target, update docs/config only if confirmed, and rerun runtime binding review.

