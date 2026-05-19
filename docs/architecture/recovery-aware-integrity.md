# Recovery-Aware Integrity

## Purpose

Recovery-Aware Integrity evaluates how difficult, risky, or operationally expensive recovery may be if a change fails after merge or release.

It turns release, runtime, architecture, policy, evidence, agent, and diff-aware signals into rollback feasibility and operator burden guidance.

## Recovery Philosophy

Integrity is not only whether a change can ship. It is also whether the team can recover safely if the change fails.

Recovery-Aware Integrity asks:

- Can the change be rolled back safely?
- Which systems must be coordinated during rollback?
- Which provider or runtime states may drift?
- Is rollback evidence complete?
- How much operator attention would recovery require?

## Rollback Feasibility

Rollback feasibility values:

- `straightforward`
- `coordinated`
- `difficult`
- `dangerous`

Feasibility is based on blast radius, affected boundaries, runtime posture, policy posture, evidence posture, and diff-aware findings.

## Recovery Posture

Recovery posture values:

- `easily-recoverable`
- `recoverable-with-coordination`
- `difficult-recovery`
- `high-risk-recovery`
- `unknown-recovery`

High-risk recovery is reported when critical blast radius, payment trust, service-role/security findings, runtime plus Vault release caution, policy block, or rollback-watch posture appears.

## Operator Burden

Operator recovery burden values:

- `low`
- `medium`
- `high`
- `extreme`

Operator burden increases when recovery depends on provider state, webhook replay safety, runtime bindings, env/config restoration, tenant/data consistency, or customer communication state.

## Blast Radius and Recovery

Broad or critical blast radius usually means recovery needs coordination.

Examples:

- Payment trust changes may require payment reconciliation.
- Webhook changes may require replay and idempotency verification.
- Runtime plus Vault changes may require binding and env restoration.
- Service-role changes require security review during rollback.
- Customer messaging changes may cause communication state drift.

## Report Output

Markdown reports include:

- recovery posture
- rollback complexity
- recovery risk
- recovery dependencies
- recovery warnings
- rollback feasibility
- operator recovery burden
- recommended recovery action

## Limitations

Recovery-Aware Integrity v1 is deterministic and local-only.

It does not:

- execute rollbacks
- verify provider state
- inspect runtime logs
- orchestrate disaster recovery
- call external APIs
- create incidents
- monitor production

## What This Does Not Do Yet

Recovery-Aware Integrity is not:

- rollback automation
- incident response automation
- disaster recovery orchestration
- SaaS
- external monitoring
- deployment automation
