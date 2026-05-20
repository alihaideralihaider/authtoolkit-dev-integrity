# Workflow Routing Summary

## Purpose

Workflow Routing Summary connects awareness, decision, and control-room outputs into deterministic operational workflow routing.

It shows humans which workflows are currently active, why they were triggered, who should pay attention, what evidence is needed, and what should happen next.

This is not workflow automation. It does not create Jira tickets, comment on GitHub, send Slack messages, approve changes, merge code, deploy, or execute recovery steps.

## Deterministic Workflow Routing

Workflow routing is template-based and rule-based. It consumes existing Integrity Engine outputs and produces a small routing summary for the markdown report.

Inputs include:

- Integrity Decision Summary
- Integrity Control Room Overview
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

## Workflow Activation Rules

Possible active workflows:

- merge-review
- release-review
- runtime-watch
- escalation-review
- recovery-review
- evidence-review
- agent-review

V1 activation rules:

- merge-review: active when PR Integrity merge readiness is not `ready`.
- release-review: active when release decision is not `ready`.
- runtime-watch: active when runtime posture is not `stable`.
- escalation-review: active when the decision is `high-risk` or `blocked`, policy escalation exists, critical blast radius exists, or critical impact exists.
- recovery-review: active when recovery is difficult or high-risk, runtime posture is `rollback-watch`, or recovery risk is critical.
- evidence-review: active when evidence posture is not `sufficient`.
- agent-review: active when agent-assisted, automation-generated, suspected generated, or sensitive agent review requirement signals exist.

## Workflow Priorities

Workflow priority values:

- normal: no elevated routing condition was detected.
- elevated: review or evidence is needed, but no high-risk or critical workflow condition is present.
- high-risk: escalation or high-risk posture exists.
- critical: blockers, critical blast radius, critical impact, or critical recovery risk exists.

Priority is not an approval decision. It tells humans how urgent and constrained the active workflow path is.

## Workflow Owners

Workflow Routing Summary may identify owner roles such as:

- engineering reviewer
- security reviewer
- runtime operator
- release owner
- architecture reviewer
- payment reviewer
- recovery coordinator
- founder/owner

These are role expectations, not identity assignments.

## Evidence Needs

Workflow evidence needs may include:

- rollback evidence
- build evidence
- runtime validation
- architecture review notes
- security review notes
- payment review notes
- owner approval
- canary validation

Generated report evidence remains baseline evidence only. Sensitive workflows may still require reviewer, release, runtime, rollback, and approval evidence.

## Relationship To Workflow Framework

The Integrity Workflow Framework defines how humans should operationally interact with the engine across merge, release, runtime, escalation, recovery, evidence, and agent review workflows.

Workflow Routing Summary is the generated report view of that framework. It does not execute workflows. It routes attention.

## Limitations

- It is deterministic and heuristic.
- It does not integrate with GitHub, Jira, Slack, or CI/CD.
- It does not assign real people.
- It does not create tickets.
- It does not approve, merge, deploy, roll back, or recover systems.
- It does not replace human judgment.
- It only summarizes workflow routing based on current local review output.
