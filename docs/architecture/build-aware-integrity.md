# Build-Aware Integrity

## Purpose

Build-Aware Integrity adds optional local build, test, lint, typecheck, and deploy-preview awareness to AuthToolkit Dev Integrity.

It uses a small redacted build summary JSON file to adjust confidence, review expectations, release posture, evidence requirements, and recovery reasoning.

## Optional Local Build Summary Input

The CLI accepts:

```text
npm run review -- --repo . --skill saana-plan --build-summary examples/sample-build-summary.json
```

The build summary must be local and should contain summaries only. Raw logs and secret values must not be included.

Example:

```json
{
  "status": "failed",
  "stage": "typecheck",
  "failedJobs": ["typecheck"],
  "failureCategory": "typescript",
  "summary": "TypeScript compile failed",
  "logsRedacted": true
}
```

## Build Posture States

Build posture values:

- `passed`
- `warning`
- `failed`
- `unknown`

If no build summary is provided, posture is `unknown`. Unknown does not reduce confidence, but it does require build evidence before trust is complete.

## Build Risk Logic

Build risk values:

- `low`
- `medium`
- `high`
- `critical`

Simple v1 rules:

- passed build: low risk
- warning, flaky tests, skipped tests, or partial success: medium risk
- build, test, lint, typecheck, or deploy-preview failure: high risk
- deploy failures involving production config, secrets, migrations, payment, auth, or runtime bindings: critical risk

## Failure Category Mapping

Failure categories map to review packs:

- `typescript` or `typecheck`: runtime-pack
- `lint`: planning-pack
- `test`: planning-pack
- `auth` or `security`: security-pack
- `payment` or `webhook`: payment-pack
- `sms`, `twilio`, or `whatsapp`: sms-compliance-pack
- `env`, `config`, `secret`, `binding`, `cloudflare`, or `wrangler`: vault-pack and runtime-pack
- `deploy`, `preview`, or `worker`: runtime-pack and release-readiness-pack
- `migration`, `database`, or `supabase`: security-pack and runtime-pack

## Confidence Impact

Build-Aware Integrity applies confidence caps:

- critical build issue: max confidence 25
- failed build: max confidence 40
- warning: max confidence 55
- passed: no confidence reduction
- unknown: no confidence reduction, but evidence is marked missing

## Pipeline Integration

Build-Aware Integrity feeds:

- confidence score
- PR Integrity
- Release Readiness
- Runtime Integrity
- Evidence-Aware Integrity
- Recovery-Aware Integrity
- markdown reports

## Limitations

Build-Aware Integrity v1 reads only a local summary JSON file.

It does not:

- ingest raw logs
- call CI/CD providers
- integrate with Jenkins
- integrate with GitHub Actions
- monitor live deploys
- run tests
- fix failures

## What This Does Not Do Yet

Build-Aware Integrity is not:

- Jenkins integration
- GitHub Actions integration
- Jira integration
- live CI/CD monitoring
- log ingestion
- SaaS
- deployment automation
