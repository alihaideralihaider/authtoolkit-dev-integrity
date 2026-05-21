# Release Gate Decision

Release Gate Decision v1 converts release, CI/CD, GitHub, evidence, recovery, and Control Room signals into one deterministic gate recommendation.

## Purpose

The gate answers one operational question:

Should this change pass, warn, block, or require human review before release?

It is a recommendation layer. It does not deploy, roll back, write GitHub statuses, approve pull requests, or orchestrate CI/CD.

## Inputs

Release Gate Decision consumes existing Integrity outputs:

- Integrity Decision Summary
- Control Room Overview
- Workflow Routing Summary
- Release Workflow Plan
- Release Signals
- CI/CD Context
- GitHub Checks Context
- GitHub Actions Context
- Evidence-Aware Integrity
- Recovery-Aware Integrity

## Gate Values

- `pass`: release gate can proceed through the normal release path with evidence preserved.
- `warn`: release may proceed only with release owner acknowledgement and post-release watch.
- `block`: release should not proceed until blockers are resolved.
- `needs-human-review`: human release review and gate evidence are required before release.

## Deterministic Rules

Block if any of these are true:

- Control Room is red.
- Overall integrity decision is blocked.
- Release Workflow Plan is blocked.
- Recovery risk is critical.
- GitHub checks failed.
- GitHub Actions workflows or jobs failed.
- Release signal failed.

Needs human review if any of these are true and no blocker exists:

- Integrity decision is high-risk.
- Escalation workflow is active.
- Evidence posture is not sufficient.
- Required gate evidence is missing.

Warn if any of these are true and no blocker or human-review condition exists:

- Integrity decision is caution.
- GitHub checks are pending.
- GitHub Actions workflows are pending.
- Release signal was cancelled or skipped.
- CI/CD context has warning status.

Pass only when:

- Integrity decision is trusted.
- Release Workflow Plan is ready.
- Release signal is successful.
- No blockers exist.
- Evidence posture is sufficient.

## Output Fields

The gate emits:

- release gate decision
- release gate confidence
- reasons
- blockers
- warnings
- required gate evidence
- recommended gate action

## Safety

Release Gate Decision stores no raw logs, secret values, env values, tokens, or raw diffs. It uses already-normalized Integrity signals.

## Limitations

- v1 is deterministic and rule-based.
- v1 does not know organization-specific approval policies beyond existing Integrity outputs.
- v1 does not write statuses or enforce releases.
- v1 does not replace human release ownership.
