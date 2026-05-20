# PR Context

## Purpose

PR Context turns local Git Context and Integrity output into a pull-request-style review summary.

It helps humans understand the local change as if it were a merge candidate, even before AuthToolkit Dev Integrity has GitHub, Jira, or CI/CD integrations.

## Local-Only Behavior

PR Context is generated from local review data only:

- Git Context
- changed files
- risk categories
- suggested review packs
- Integrity Decision Summary
- Workflow Routing Summary

It does not call GitHub APIs, does not post PR comments, does not inspect Jira, does not read CI/CD systems, and does not modify the target repository.

## Fields Produced

PR Context v1 produces:

- `prTitleSuggestion`
- `prSummary`
- `prChangeScope`
- `prRiskSummary`
- `prReviewFocus`
- `prRequiredEvidence`
- `prRecommendedReviewerTypes`
- `prReadinessLabel`

## PR Readiness Labels

Readiness labels are deterministic:

- `blocked`: overall integrity decision is blocked.
- `needs-escalation`: overall integrity decision is high-risk, or workflow priority is high-risk or critical.
- `needs-evidence`: evidence-review workflow is active.
- `ready-for-review`: no blocker, escalation, or evidence routing condition applies.

## Report And Catalog Output

Generated reports include a `PR Context` section near the local Git Context section.

The local report catalog stores `prReadinessLabel` so recent runs can be scanned without opening each report.

## Limitations

PR Context v1 is intentionally small:

- no GitHub PR API
- no PR comment posting
- no review approval detection
- no branch protection awareness
- no Jira integration
- no CI/CD integration
- no merge automation

It is a local summary layer, not a hosted pull request system.

## Future GitHub Relationship

Future GitHub integration can use PR Context as the deterministic local summary to post or attach to a real pull request. GitHub can add PR number, labels, review status, checks, and comments later. The PR Context model should remain usable without external services.
