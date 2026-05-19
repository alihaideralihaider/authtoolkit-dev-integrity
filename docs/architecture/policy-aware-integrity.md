# Policy-Aware Integrity

## Purpose

Policy-Aware Integrity adds organizational governance and rule-awareness to AuthToolkit Dev Integrity.

It determines whether a change triggers review policies, violates governance expectations, requires escalation, or needs additional approvals before merge or release.

## Governance Philosophy

Policy-Aware Integrity is deterministic and explainable.

It does not decide whether code is legally compliant. It turns existing integrity signals into organizational review expectations:

- which policies were triggered
- which approvals are required
- which escalation paths are needed
- which governance warnings should be visible
- whether the change can proceed under normal review

## Policy Posture States

Policy posture values:

- `compliant`: no special policy action is required beyond normal review
- `review-required`: standard review evidence or approval is required
- `escalation-required`: owner, architecture, security, or independent review is required
- `policy-blocked`: the change should not proceed until the blocking policy issue is resolved

## v1 Policies

Policy-Aware Integrity v1 includes these deterministic policies:

- `critical-blast-radius-review`
- `payment-release-review-required`
- `service-role-security-review`
- `runtime-config-change-review`
- `critical-diff-finding-block`
- `rollback-evidence-required`
- `unknown-risk-escalation`
- `self-approval-not-recommended`

## Escalation Logic

Escalation is triggered when sensitive boundaries or governance expectations are crossed.

Examples:

- critical architecture blast radius
- service-role usage in a diff-aware finding
- unresolved review posture intersecting sensitive systems
- critical diff-aware findings
- self-approval risk for critical changes

## Required Approvals

Required approvals can include:

- security review
- payment review
- runtime review
- release review
- architecture review
- owner approval
- rollback approval

Approvals are generated from review packs, release posture, and architecture blast radius.

## Separation of Duties

For high-risk or critical changes, Policy-Aware Integrity should remind the operator that self-approval is not recommended.

v1 does not enforce identities or approval workflows. It only records that independent review or owner approval is expected.

## Governance Warnings

Governance warnings include:

- Sensitive systems changed together.
- Critical release posture exists.
- Rollback evidence missing.
- Policy escalation path required.
- Unknown risk intersects sensitive systems.

## Report Output

Markdown reports include:

- policy posture
- triggered policies
- policy violations
- policy escalations
- required approvals
- governance warnings
- policy review notes
- recommended policy action

## Limitations

Policy-Aware Integrity v1 is rule-based and local-only.

It does not:

- verify human identity
- collect approvals
- integrate with Jira or GitHub approvals
- enforce separation of duties
- execute release workflow
- replace legal, compliance, or audit review

## What This Does Not Do Yet

Policy-Aware Integrity is not:

- legal compliance
- SOX automation
- Jira integration
- approval automation
- enterprise workflow orchestration
- SaaS analytics
- release automation
