# CI/CD Context

## Purpose

CI/CD Context adds provider-neutral pipeline metadata to AuthToolkit Dev Integrity reviews from a local redacted summary file.

It helps the report explain pipeline status, failed stage, deployment target, rerun state, and safe artifact references before any Jenkins, GitHub Actions, or other provider integrations exist.

## Local Summary Input

CI/CD Context is supplied with:

```sh
npm run review -- --repo . --skill saana-plan --cicd-summary examples/sample-cicd-summary.json
```

The summary file is local JSON and should contain metadata only, such as:

- provider
- pipeline name
- run id
- branch
- commit
- status
- failed stage
- failed jobs
- deployment target
- environment
- duration
- rerun status
- safe artifact references

## Safety Rules

CI/CD summary files must not include:

- raw logs
- secret values
- environment values
- tokens
- credentials
- source snippets
- customer data

`logsRedacted` should be `true`. If it is missing or false, the review records a warning.

## Provider-Neutral Contract

CI/CD Context v1 supports these normalized pipeline statuses:

- `passed`
- `warning`
- `failed`
- `cancelled`
- `skipped`
- `unknown`

Provider-specific integrations can map their native state into this local contract later.

## Relationship To Build-Aware Integrity

Build-Aware Integrity remains the direct local build/test signal when `--build-summary` is supplied.

If no build summary is supplied, CI/CD Context can provide a build-aware fallback signal for failed, warning, skipped, cancelled, or passed pipeline state. This avoids duplicating build sources while still letting pipeline metadata influence evidence, release, and workflow expectations.

## Future Jenkins And GitHub Actions Relationship

Future integrations may fetch CI/CD metadata from Jenkins, GitHub Actions, or other providers. Those integrations should produce the same redacted CI/CD summary shape and keep raw logs, tokens, and secret values out of AuthToolkit Dev Integrity outputs.

## Limitations

CI/CD Context v1 is intentionally small:

- no Jenkins API
- no GitHub Actions API
- no live CI/CD monitoring
- no log ingestion
- no artifact download
- no deployment automation
- no rerun automation

It is a local metadata layer, not a CI/CD platform integration.
