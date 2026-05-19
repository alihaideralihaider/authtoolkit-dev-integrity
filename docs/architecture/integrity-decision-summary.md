# Integrity Decision Summary

## Purpose

Integrity Decision Summary condenses the full AuthToolkit Dev Integrity pipeline into a single deterministic operational trust summary. It helps humans quickly understand whether a change is trusted, reviewable, risky, or blocked.

This is structured decision logic, not AI-generated prose.

## Operational Trust Philosophy

The pipeline may produce many layer-specific findings. The decision summary turns those findings into practical operating guidance:

- Can this change be trusted?
- What is the trust level?
- What is driving risk?
- What blocks merge or release?
- What human attention is required?
- What must happen next?

## Decision States

- trusted: release is ready, evidence is sufficient, runtime posture is stable, and no high or critical warning is present.
- trusted-with-review: the change can proceed after targeted review evidence is attached.
- caution: the change needs review, evidence, or release caution handling before it should proceed.
- high-risk: critical impact, recovery, policy escalation, rollback-watch, or critical diff signals require escalation.
- blocked: policy, PR, release, build, evidence, or recovery blockers prevent merge or release.

## Operational Trust Levels

- strong: normal review trust.
- moderate: review evidence is required, but no blocking condition is detected.
- guarded: caution posture exists and trust depends on additional evidence.
- low: high-risk posture requires escalation before proceeding.
- critical-review-required: blocked posture requires resolution before merge or release.

## Deterministic Summary Generation

The summary is generated from existing pipeline outputs:

- Build-Aware Integrity
- PR Integrity
- Release Readiness
- Runtime Integrity
- Architecture-Aware Integrity
- Policy-Aware Integrity
- Evidence-Aware Integrity
- Agent-Aware Integrity
- Recovery-Aware Integrity
- Impact-Aware Integrity
- Posture-Aware Integrity

The summary does not invent new evidence. It maps structured signals into concise fields:

- overall integrity decision
- operational trust level
- primary risk drivers
- blocking factors
- required next actions
- required human attention
- release trust summary
- recovery trust summary
- recommended operational decision

## Example Risk Drivers

- critical blast radius
- failed build/typecheck
- payment trust boundary
- runtime/Vault coupling
- missing rollback evidence
- service-role diff finding
- runtime degraded-risk
- policy escalation
- agent/automation-sensitive change

## Example Required Actions

- attach passing build evidence
- attach rollback evidence
- require architecture review
- require security review
- require payment review
- reduce blast radius
- validate runtime bindings
- verify idempotency/webhook replay safety
- confirm owner approval

## Limitations

Integrity Decision Summary v1 is deterministic and heuristic. It does not perform semantic review, read live logs, inspect production systems, approve pull requests, merge code, deploy changes, or replace human owner judgment.

## What This Does Not Do Yet

- It does not call external AI APIs.
- It does not generate natural-language summaries from raw code.
- It does not integrate with GitHub approvals.
- It does not enforce policy automatically.
- It does not modify target repos.
- It does not commit, push, deploy, or roll back changes.
