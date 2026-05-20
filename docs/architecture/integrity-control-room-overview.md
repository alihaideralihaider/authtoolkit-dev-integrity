# Integrity Control Room Overview

## Purpose

Integrity Control Room Overview is the first local Control Room surface on top of the AuthToolkit Dev Integrity engine and awareness stack. It turns the full review result into one operational command summary for humans.

This is a local-first markdown summary, not a web dashboard.

## How It Fits

The Integrity Engine produces detailed layer outputs. The Control Room Overview sits above those layers and summarizes:

- the final decision
- current trust posture
- awareness layer status
- operational risk
- required actions
- human attention areas
- drift signals
- warnings
- recommended next action

## Status Colors

- green: trusted, release ready, runtime stable, and evidence sufficient.
- yellow: caution or trusted-with-review, release caution, build warning/failure, or worsened drift.
- orange: high-risk decision, policy escalation, missing evidence, degraded runtime, or high-risk recovery.
- red: blocked decision, critical-review-required trust, critical blast radius, critical impact, or critical recovery risk.

## What It Summarizes

The overview consumes existing deterministic outputs:

- Integrity Decision Summary
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

## Output Shape

The local markdown report includes:

- control room status
- executive summary
- decision snapshot
- awareness snapshot
- risk snapshot
- required actions
- human attention areas
- drift snapshot
- control room warnings
- recommended control room action

## Design Philosophy

The Control Room Overview should help a founder, engineer, operator, or reviewer answer:

- Is this change trusted?
- What is the current status color?
- What must happen next?
- Who needs to pay attention?
- Which awareness layers are driving risk?

## What This Does Not Do Yet

- It does not render a web dashboard.
- It does not call external APIs.
- It does not integrate with GitHub, Jira, CI, or runtime logs.
- It does not approve, merge, deploy, or roll back changes.
- It does not modify the target repo.
- It does not replace detailed layer reports.
