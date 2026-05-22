# Integrity Release Control Room

## Purpose

The Integrity Release Control Room connects code review, test/build signals, release decisions, deployment records, and runtime rollout awareness.

Dev Integrity should not only review code before merge. It should guard the release path from PR to build, release gate, deployment, and runtime rollout confidence.

## Why This Matters

Modern teams can still ship risky changes even when the normal review path appears healthy:

- PRs can pass tests but still affect sensitive runtime, payment, auth, or recovery boundaries.
- Approvals can be blind when reviewers lack release context.
- Builds can pass without enough operational context.
- Deployments can happen without a clear release confidence decision.
- Teams need a simple risk and gate layer before merge and after deploy.

The Release Control Room makes release confidence visible before a change merges, before it deploys, and after rollout begins.

## Core Loop

```text
PR review
-> build/test signal
-> release gate decision
-> deployment awareness
-> runtime rollout awareness
-> confidence update
-> rollback/recovery recommendation if needed
```

## Release Gates

Release gates convert review, build, and risk signals into a release-facing decision.

Release Gate Decision v1 is the first deterministic gate output. It combines Release Signals, Release Workflow Plan, GitHub Checks, GitHub Actions, CI/CD Context, evidence posture, recovery posture, and the Integrity Decision Summary into one `pass`, `warn`, `block`, or `needs human review` recommendation.

Release Gate Scoring adds deterministic release confidence reasoning to that gate. It shows the positive and negative weighted contributors so a founder, reviewer, or release owner can see why confidence is high or low without relying on hidden scoring or ML.

Gate outputs:

- `pass`
- `warn`
- `block`
- `needs human review`

Gate inputs:

- PR summary
- changed files
- test results
- security review
- compliance review
- confidence score
- risky area detection
- reviewer approval status
- linked Jira/ticket context when available

Example `release_gate_decision`:

```json
{
  "type": "release_gate_decision",
  "repo": "owner/repo",
  "pr_number": 123,
  "commit_sha": "abc1234",
  "gate_output": "warn",
  "confidence_score": 72,
  "risky_areas": ["runtime", "vault"],
  "required_reviews": ["runtime review", "vault review"],
  "reviewer_approval_status": "approved-with-release-caution",
  "linked_ticket": "JIRA-123",
  "reason": "Runtime and secret/config boundaries changed together.",
  "recommended_action": "Confirm runtime bindings and required secret names before deployment."
}
```

## Deployment Awareness

Deployment Awareness tracks what actually moved toward an environment after review and release gating.

Track:

- repo
- PR number
- commit SHA
- branch
- environment
- deployment provider
- deploy time
- deployment status
- related Jira/ticket
- rollback link or revert command when available

Example `deployment_record`:

```json
{
  "type": "deployment_record",
  "repo": "owner/repo",
  "pr_number": 123,
  "commit_sha": "abc1234",
  "branch": "feature/release-control-room",
  "environment": "preview",
  "deployment_provider": "github-actions",
  "deploy_time": "2026-05-21T00:00:00.000Z",
  "deployment_status": "succeeded",
  "related_ticket": "JIRA-123",
  "rollback_reference": "git revert abc1234"
}
```

## Runtime Rollout Awareness

Runtime Rollout Awareness tracks whether the deployed change remains healthy after release begins.

Track after deployment:

- smoke test result
- error spike
- failed route checks
- user-facing failures
- log alerts
- rollback recommendation
- post-deploy confidence score

Example `runtime_rollout_check`:

```json
{
  "type": "runtime_rollout_check",
  "repo": "owner/repo",
  "deployment_environment": "preview",
  "commit_sha": "abc1234",
  "smoke_test_result": "passed",
  "error_spike": false,
  "failed_route_checks": [],
  "user_facing_failures": [],
  "log_alerts": [],
  "post_deploy_confidence_score": 86,
  "rollback_recommendation": "not-needed",
  "recommended_action": "Continue runtime watch through the first post-deploy window."
}
```

## Product Positioning

Integrity Release Control Room helps teams understand whether a change is safe to merge, safe to deploy, and still healthy after rollout.

It is a release confidence layer over PR review, build signals, deployment awareness, and runtime rollout checks. It should remain explainable and operationally grounded.

## What Not To Build Yet

Do not build these in this step:

- no Jenkins integration yet
- no full SaaS orchestration engine yet
- no chaos/log ingestion yet
- no complex deployment automation yet
- no automatic production rollback yet

Jenkins should remain deferred. GitHub Actions should stay the first CI/CD integration path because the current workflow is GitHub-first.

## Near-Term Build Path

Recommended order:

1. Document gate schema.
2. Create sample release gate JSON.
3. Create sample deployment record JSON.
4. Create sample runtime rollout JSON.
5. Add Release Signals v1 as the first small provider-neutral signal input for release gates.
6. Later connect GitHub Actions read-only signals.
7. Later show these in a dashboard/control room.

This keeps the module small and framework-first while leaving a clean path toward productized release confidence.

Release Signals v1 should stay intentionally narrow: workflow status, workflow name, conclusion, run URL, commit SHA, timestamps, and source provider. It should feed release confidence without becoming a CI/CD dashboard.

## Future Integrations

Future integration paths, not active build priorities:

- GitHub Actions
- GitHub Deployments API
- Vercel/Cloudflare deployment signals
- Jira context
- Slack release notifications
- Jenkins later only if enterprise need appears
- API Intake Contract v1 for GitHub, Slack, Jira, CLI, and code-agent review context

Integrations are delivery mechanisms. The release confidence model should remain deterministic, explainable, and independent of any single provider.

API intake is the future bridge between external tools and local review execution. It lets integrations describe repo, PR, ticket, and signal context in a normalized request without granting write authority, storing tokens, running a hosted multi-tenant API, or modifying target repositories. Webhook intake, auth, tenant isolation, and provider-specific write flows remain future work.

## Founder Reminder

Current priorities remain:

- launch SaanaOS
- complete Integrity separation
- keep this module small and framework-first
- avoid Jenkins distraction

The Release Control Room should strengthen the path from code review to release confidence without becoming a deployment platform too early.
