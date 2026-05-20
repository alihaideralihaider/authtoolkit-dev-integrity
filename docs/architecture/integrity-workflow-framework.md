# Integrity Workflow Framework

## Workflow Philosophy

AuthToolkit Dev Integrity recommends and routes work. Humans remain accountable for merge, release, escalation, and recovery decisions.

The Integrity Engine and Awareness Stack produce posture, evidence, warnings, required actions, and operational decisions. Workflows operationalize those outputs without replacing human trust boundaries.

Core workflow principles:

- Integrity recommends; humans decide.
- The system preserves review, approval, release, and recovery boundaries.
- Awareness layers produce structured posture and evidence.
- The Decision Layer condenses posture into operational trust guidance.
- The Control Room Layer presents the current command summary.
- Workflows define how people act on the engine output.

This framework is not workflow automation. It is the canonical model for how humans should use the engine output.

## Core Workflow Types

AuthToolkit Dev Integrity supports these workflow types:

- Merge Review Workflow
- Release Workflow
- Runtime Watch Workflow
- Escalation Workflow
- Recovery Workflow
- Evidence Workflow
- Agent Review Workflow

Each workflow starts from structured engine output and ends with human accountability, evidence capture, or rerun of the review.

## Merge Review Workflow

Flow:

```text
Git change
-> awareness layers
-> decision summary
-> required reviews
-> evidence attachment
-> merge readiness
```

Merge review begins with Git Monitoring and risk classification. The engine identifies changed files, risk categories, severity, risk combinations, and review packs.

Review packs may include:

- planning-pack
- security-pack
- payment-pack
- sms-compliance-pack
- vault-pack
- runtime-pack
- ux-pack
- release-readiness-pack

Merge review should use:

- PR Integrity merge readiness
- Policy-Aware required approvals
- Evidence-Aware evidence gaps
- Agent-Aware review requirements
- Architecture-Aware blast radius
- Integrity Decision Summary blocking factors and required next actions

Required approvals depend on the affected systems and policies. Security, payment, runtime, architecture, owner, and rollback approvals should be explicit when required.

Evidence expectations:

- generated integrity report
- evidence timeline snapshot
- reviewer notes for selected review packs
- build/test evidence when available
- explicit acceptance or remediation notes for unresolved warnings

Independent review boundaries matter when sensitive systems or agent/automation signals are present. Agent-assisted or automation-generated changes should not self-approve sensitive changes.

## Release Workflow

Flow:

```text
merge-ready candidate
-> build-aware checks
-> release-aware checks
-> runtime-aware checks
-> recovery-aware checks
-> operational decision
-> release trust decision
```

Release workflow evaluates whether a merge-ready candidate can safely ship. It should not rely only on merge readiness.

Release review should use:

- Build-Aware build posture and build evidence requirements
- Release Readiness decision, release risk, and required release checks
- Runtime Integrity runtime posture and signals to watch
- Recovery-Aware rollback feasibility and operator burden
- Architecture-Aware blast radius
- Impact-Aware operational impact
- Integrity Decision Summary release trust summary

Canary guidance should come from Release Readiness and Runtime Integrity. A sensitive release may require monitoring login, checkout, webhook health, SMS delivery, runtime errors, admin access, or customer flows.

Rollback readiness should be explicit before release when runtime, Vault, payment, webhook, database, service-role, or deployment boundaries are affected.

Release evidence may include:

- passing build evidence
- deploy target confirmation
- runtime binding confirmation
- canary plan
- rollback plan
- release owner confirmation
- selected review pack evidence

Blast radius review is required when Architecture-Aware Integrity reports broad or critical blast radius.

## Runtime Watch Workflow

Flow:

```text
release completed
-> runtime posture
-> runtime signals
-> drift monitoring
-> operator review
-> escalation if needed
```

Runtime watch begins after release. It uses Runtime Integrity and Posture-Aware Integrity to define what humans should observe.

Runtime watch items may include:

- login failures
- admin access errors
- unexpected 401/403/200 behavior
- checkout failures
- webhook delivery failures
- payment/order state mismatch
- SMS delivery failures
- provider webhook failures
- missing env/runtime config errors
- worker/runtime exceptions
- route failures

Owner attention items should be reviewed during the first post-release window. If runtime posture is `degraded-risk` or `rollback-watch`, runtime review should be treated as active operational work, not passive observation.

Rollback triggers may include:

- auth bypass or admin exposure
- payment state mismatch or broken checkout
- repeated 5xx or route outage
- missing required secret/config in runtime
- non-compliant outbound messaging behavior
- critical customer/admin flow unusable

Drift worsening should trigger operator review. If build, runtime, architecture, policy, evidence, agent, or recovery drift worsens, the team should inspect the related layer and attach updated evidence.

## Escalation Workflow

Flow:

```text
high-risk or blocked decision
-> policy escalation
-> architecture/security/payment review
-> evidence attachment
-> operational re-evaluation
```

Escalation workflow applies when the Integrity Decision Summary is `high-risk` or `blocked`, when Policy-Aware Integrity reports `escalation-required` or `policy-blocked`, or when Control Room status is `orange` or `red`.

Escalation may be required for:

- critical blast radius
- policy-blocked posture
- release blocked posture
- critical diff-aware finding
- service-role/security finding
- payment trust boundary
- runtime/Vault coupling
- missing rollback evidence
- agent/automation signal near sensitive systems

Human review boundaries must remain explicit. A high-risk or blocked change should not proceed based only on generated evidence.

Escalation review should attach:

- architecture review notes
- security review notes
- payment review notes when payment state or webhooks are affected
- runtime review notes when deployment, bindings, or config are affected
- owner approval when required
- rollback approval when release or recovery posture requires it

After evidence is attached or the change is narrowed, rerun the review and compare posture.

## Recovery Workflow

Flow:

```text
release/runtime issue
-> recovery-aware review
-> rollback feasibility
-> operator coordination
-> evidence capture
-> recovery validation
```

Recovery workflow starts when a release or runtime issue is detected, or when Recovery-Aware Integrity reports difficult or high-risk recovery before release.

Recovery review should evaluate:

- rollback coordination
- provider state
- runtime bindings
- payment or data reconciliation
- webhook replay safety
- tenant/data consistency
- customer messaging state
- operator burden

Provider state may include Stripe payment state, Twilio delivery state, Supabase data state, webhook replay behavior, email delivery, Cloudflare routes, or other runtime dependencies.

Runtime binding recovery should confirm whether the correct Worker, route, binding, env/config, queue, storage, or provider target can be restored.

Recovery evidence may include:

- rollback plan
- rollback owner
- recovery checklist
- provider state notes
- reconciliation notes
- post-recovery validation evidence
- incident notes when applicable

Recovery validation should confirm the affected operational path is healthy after rollback or fix.

## Evidence Workflow

Generated evidence is baseline only.

Evidence types:

- generated evidence: local markdown report and evidence timeline snapshot.
- reviewer evidence: human review notes for security, payment, runtime, architecture, UX, SMS, Vault, or owner review.
- release evidence: build/test result, deploy target confirmation, release notes, canary plan, and release readiness confirmation.
- runtime evidence: post-release observations, route checks, provider health, webhook delivery, error checks, and operator watch notes.
- rollback evidence: rollback path, rollback owner, restoration steps, and recovery validation.
- approval evidence: required approvals, escalation signoff, separation-of-duties confirmation, and owner approval.

Evidence-Aware Integrity should make missing evidence explicit. Workflows should attach the missing evidence or document why the risk is accepted before proceeding.

Generated reports should not contain raw secrets, raw env values, raw private logs, raw customer data, or full raw diffs.

## Agent Review Workflow

Agent-assisted change requires clear human trust boundaries.

Flow:

```text
agent-assisted change
-> authorship/automation signals
-> sensitive boundary check
-> independent review when required
-> evidence attachment
-> operational re-evaluation
```

Agent-Aware Integrity treats authorship and automation indicators as signals, not proof. Signals should adjust review expectations when they intersect sensitive systems.

Sensitive boundaries include:

- auth and session behavior
- admin/API boundaries
- tenant/data boundaries
- payment trust boundaries
- runtime/deployment boundaries
- secret/config boundaries
- customer communication boundaries

Agent-assisted sensitive changes may require:

- independent human review
- security review
- payment review
- runtime review
- architecture review
- owner approval
- evidence attachment before approval

Integrity acts as operational trust compression. It reduces many low-level signals into clear review requirements, required actions, and human attention areas.

## Future Workflow Integrations

Future integrations may include:

- GitHub PR workflows
- Jira workflows
- Slack escalation
- CI/CD triggers
- runtime telemetry ingestion
- enterprise approvals

Integrations are workflow delivery mechanisms, not reasoning engines. They should consume Integrity Engine output rather than duplicate or replace the engine.

The workflow model should remain usable locally, in CI, behind an API, or inside enterprise systems.

## Workflow State Model

Example workflow states:

- review-required: review packs, approvals, or evidence are required before trust can increase.
- escalation-required: policy, architecture, impact, recovery, or agent-sensitive signals require escalation.
- blocked: merge or release should stop until blockers are resolved.
- ready: no blocking condition is detected and required evidence is sufficient for the current posture.
- caution: release or workflow trust is guarded and needs additional evidence or review.
- runtime-watch: post-release runtime observation is required.
- rollback-watch: release should not proceed, or an already released change needs immediate rollback monitoring.
- recovery-active: recovery, rollback, reconciliation, or operator coordination is underway.

These states should remain explainable and traceable to engine outputs.

## Final Workflow Summary

The workflow model is:

```text
Awareness
-> posture
-> evidence
-> operational decision
-> workflow routing
-> human accountability
```

AuthToolkit Dev Integrity does not remove human responsibility. It makes engineering, release, runtime, evidence, recovery, and agent trust concerns explicit so humans can act with better context.
