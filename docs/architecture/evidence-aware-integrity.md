# Evidence-Aware Integrity

## Purpose

Evidence-Aware Integrity evaluates whether the evidence required by the Integrity Pipeline is missing, weak, partial, sufficient, or blocking.

It separates baseline generated evidence from human review, test, release, runtime, rollback, and policy evidence.

## Evidence Posture States

Evidence posture values:

- `sufficient`: no blockers, no missing evidence, policy posture is compliant, release is ready, and PR is ready
- `partial`: baseline evidence exists but some approval or release evidence remains
- `weak`: generated reports exist, but reviewer, test, or release evidence is missing
- `missing`: required approvals or sensitive review evidence are not attached
- `blocking-gap`: merge or release should stop until evidence blockers are resolved

## Baseline Evidence

For v1, generated local artifacts count as baseline evidence only:

- integrity report generated
- evidence timeline generated
- deterministic rules applied
- no raw secret values stored
- local audit snapshot preserved

Baseline evidence is useful, but it does not replace reviewer approval, test results, release notes, rollback evidence, runtime watch evidence, or owner approval.

## Missing Evidence Logic

Evidence gaps are collected from:

- PR Integrity missing evidence
- Release Readiness missing release evidence
- Runtime Integrity owner attention items
- Policy-Aware Integrity required approvals
- Policy-Aware Integrity policy violations
- Architecture-Aware Integrity architecture warnings

The report groups evidence requirements by timing:

- before merge
- before release
- after release
- for policy/governance

## Blocking Evidence Gaps

Evidence-Aware Integrity reports a blocking gap when:

- policy posture is `policy-blocked`
- release decision is `blocked`
- PR merge readiness is `blocked`
- critical blast radius lacks required architecture or owner approval evidence
- critical diff finding lacks required security evidence

## Evidence Warnings

Warnings explain that generated evidence is not enough when sensitive review, approval, release, rollback, or runtime evidence is still missing.

## Limitations

Evidence-Aware Integrity v1 is local and deterministic.

It does not:

- verify that a human approval actually happened
- read GitHub PR reviews
- integrate with Jira
- store evidence in a database
- validate external release notes
- collect runtime logs
- verify legal or compliance evidence

## What This Does Not Do Yet

Evidence-Aware Integrity is not:

- Jira integration
- GitHub approval integration
- a database
- SaaS
- compliance automation
- legal review
- approval automation
