# Release Signals

Release Signals v1 captures small provider-neutral build or workflow signals that improve release confidence without becoming a CI/CD dashboard.

## Purpose

Release Signals gives the Integrity Engine a compact read-only record of whether a workflow completed, what it concluded, which commit it referenced, and where humans can trace the run.

It is intentionally smaller than CI/CD Context and GitHub Actions Context. It exists to feed release gates with minimal signal metadata.

## Small Signal Philosophy

The release gate does not need raw logs or full CI/CD orchestration to make a better decision. v1 stores only enough metadata to answer:

- Which provider produced the signal?
- Which workflow ran?
- Which commit and branch did it evaluate?
- Did it succeed, fail, cancel, skip, or remain unknown?
- Is the signal redacted and traceable?

## Provider-Neutral Shape

Release Signals can come from GitHub Actions, a local script, a future deployment provider, or another CI/CD system. The input is a local JSON file passed with:

```bash
npm run review -- --repo . --skill saana-plan --release-signals examples/sample-release-signals.json
```

Core fields:

- provider
- workflow name
- run id
- run URL
- commit SHA
- branch
- status
- conclusion
- started/completed timestamps
- logs redacted flag

## Safety Rules

Release Signals must not include:

- raw logs
- secret values
- env values
- tokens
- customer data
- source snippets

The runner performs no external API calls for Release Signals v1. It only reads the local JSON file provided by the user.

## Relationship To GitHub Actions Context

GitHub Actions Context can read workflow run/job metadata from GitHub when explicitly configured. Release Signals is simpler: it consumes a local provider-neutral summary file and does not call GitHub.

GitHub Actions Context can deepen the signal later, but Release Signals remains useful for provider-neutral release gates.

## Relationship To Release Workflow Plan

Release Workflow Plan uses Release Signals to add evidence requirements:

- `success` supports release confidence.
- `failure` requires rerun evidence.
- `cancelled` or `skipped` means release evidence is incomplete.
- branch or commit mismatch requires review.

## Limitations

- v1 reads one local release signal summary file.
- v1 does not fetch provider data.
- v1 does not inspect logs.
- v1 does not trigger reruns.
- v1 does not deploy or roll back.

## Future Enhancements

Future versions may support multiple release signals, deployment provider summaries, GitHub Deployments API, and dashboard visualization. Those should remain read-only until an explicit workflow execution layer exists.
