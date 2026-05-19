# Layer-Specific Drift

## Purpose

Layer-specific drift adds simple trend signals inside the existing awareness stack without creating one giant Drift-Aware Integrity engine.

Each awareness layer owns its own posture vocabulary. Drift should stay close to that vocabulary so the signal remains explainable.

## Why There Is No Giant Drift-Aware Layer

A single drift engine would centralize too many unrelated concepts:

- build posture
- runtime posture
- architecture blast radius
- policy posture
- evidence posture
- agent/automation signals
- recovery posture

Those concepts change for different reasons. Keeping drift close to each layer makes the report easier to understand and easier to extend.

## v1 Drift Signals

Posture-Aware Integrity now reports:

- buildDrift
- runtimeDrift
- architectureDrift
- policyDrift
- evidenceDrift
- agentDrift
- recoveryDrift

Each value is:

- `improved`
- `stable`
- `worsened`
- `unknown`

If no previous timeline exists, or the previous timeline does not contain the required compact layer summary, the drift value is `unknown`.

## Drift Meanings

Build drift:

- worsened when build posture moves from passed to warning, failed, or unknown, or warning to failed
- improved when failed or warning moves to passed

Runtime drift:

- worsened when runtime posture moves from stable or watch to degraded-risk or rollback-watch
- improved when degraded-risk or rollback-watch moves to watch or stable

Architecture drift:

- worsened when blast radius increases
- improved when blast radius decreases

Policy drift:

- worsened when policy posture moves from compliant or review-required to escalation-required or policy-blocked
- improved when policy-blocked or escalation-required moves to review-required or compliant

Evidence drift:

- worsened when evidence posture moves from sufficient or partial to weak, missing, or blocking-gap
- improved when missing, weak, or blocking-gap moves to partial or sufficient

Agent drift:

- worsened when agent or automation signals appear or review requirements increase
- improved when agent or automation signals disappear or review requirements reduce

Recovery drift:

- worsened when recovery posture moves from easily-recoverable or recoverable-with-coordination to difficult-recovery or high-risk-recovery
- improved when difficult-recovery or high-risk-recovery moves to recoverable-with-coordination or easily-recoverable

## Compact Timeline Data

Evidence Timeline stores compact layer summaries only.

It must not store:

- raw diffs
- raw build logs
- secret values
- source code snippets
- customer data
- payment data
- session data

## Limitations

Layer-specific drift v1 compares only the current local timeline to the most recent previous local timeline for the same repo.

It does not:

- infer root cause
- query CI/CD systems
- query production monitoring
- compare branches
- produce statistical anomaly detection

## What This Does Not Do Yet

Layer-specific drift is not:

- a giant drift engine
- SaaS analytics
- anomaly detection
- external monitoring
- compliance automation
- deployment automation

For local validation, repeated review runs can confirm that compact layer summaries are being compared.
