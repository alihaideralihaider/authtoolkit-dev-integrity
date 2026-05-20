# Release Workflow Plan

## Purpose

Release Workflow Plan turns release, runtime, recovery, CI/CD, impact, and evidence signals into a local checklist for humans.

It helps operators understand what must happen before release, during release, and after release without deploying, approving, or automating the release.

## Inputs

Release Workflow Plan consumes existing AuthToolkit Dev Integrity outputs:

- Release Readiness
- Build-Aware Integrity
- CI/CD Context
- Runtime Integrity
- Recovery-Aware Integrity
- Impact-Aware Integrity
- Evidence-Aware Integrity
- Workflow Routing Summary
- Control Room Overview

## Status Values

The plan emits `releaseWorkflowStatus`:

- `ready`
- `caution`
- `blocked`
- `not-applicable`

Deterministic v1 rules:

- `blocked` if release decision is blocked, Control Room is red, or recovery risk is critical.
- `caution` if release decision is caution, CI/CD failed or warned, evidence is missing, or runtime is not stable.
- `ready` if release is ready, build passed, evidence is sufficient, and runtime is stable.
- `not-applicable` if no release workflow is currently active and no stronger status applies.

## Checklists

The generated report includes:

- pre-release checklist
- release execution checklist
- post-release watch checklist
- rollback readiness checklist
- required release evidence
- release owner attention

The checklist is assembled from existing findings and required evidence. It does not execute any release step.

## Safety Rules

Release Workflow Plan does not:

- deploy
- rollback
- approve releases
- call CI/CD providers
- call GitHub APIs
- post comments
- modify the target repository

It is local guidance only.

## Limitations

Release Workflow Plan v1 is intentionally small:

- no deployment automation
- no GitHub Actions integration
- no Jenkins integration
- no release approval workflow execution
- no runtime telemetry ingestion
- no automatic rollback

Future integrations can attach this plan to PRs, release tickets, dashboards, or CI/CD systems while preserving the local deterministic checklist as the source of truth.
