# Sample Integrity Report Summary

This is a compact example of the top-level summary humans should read first in a generated AuthToolkit Dev Integrity report.

## Integrity Control Room Overview

- Control room status: `orange`
- Executive summary: Control Room is orange because release trust is guarded until caution items and evidence gaps are cleared.
- Recommended action: Escalate to required reviewers and complete targeted validation before proceeding.

## Integrity Decision Summary

- Overall integrity decision: `high-risk`
- Operational trust level: `low`
- Release trust summary: Release trust is guarded until caution items and evidence gaps are cleared.
- Recovery trust summary: Recovery trust is guarded because rollback may be difficult.
- Recommended operational decision: Escalate to the required human reviewers before merge or release.

## Primary Risk Drivers

- runtime degraded-risk
- policy escalation
- missing rollback evidence
- broad or critical architecture blast radius

## Blocking Factors

- none in this sample

If blocking factors are present, merge or release should stop until they are resolved and evidence is attached.

## Required Next Actions

- attach passing build evidence
- attach merge review evidence
- attach release evidence
- attach rollback evidence
- confirm owner approval when required

## Human Attention Areas

- runtime/deployment
- recovery coordination
- policy escalation review
- independent human review

## How To Interpret This

The Control Room status is the fastest read:

- `green`: proceed through normal review.
- `yellow`: proceed only after required evidence is attached.
- `orange`: escalate and complete targeted validation before proceeding.
- `red`: do not merge or release until blockers are resolved.

Generated reports are baseline evidence only. Sensitive changes may still require reviewer evidence, release evidence, runtime evidence, rollback evidence, and approval evidence.
