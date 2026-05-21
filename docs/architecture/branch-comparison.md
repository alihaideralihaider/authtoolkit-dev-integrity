# Branch Comparison

## Purpose

Branch Comparison summarizes local branch changes against the selected base branch before AuthToolkit Dev Integrity has GitHub PR integration.

It helps humans understand what the current branch introduces compared with base without printing raw diffs or calling external Git hosting APIs.

## Local-Only Behavior

Branch Comparison uses local Git commands only:

- `git diff --name-status <mergeBase>..HEAD`
- `git log --oneline <mergeBase>..HEAD`
- `git diff --stat <mergeBase>..HEAD`

It does not fetch remotes, call GitHub, post PR comments, query CI/CD systems, or modify the target repository.

## Outputs

Branch Comparison produces:

- `comparisonBase`
- `comparisonHead`
- `filesChangedAgainstBase`
- `commitsAheadOfBase`
- `branchChangeSummary`
- `branchRiskSummary`
- `branchReviewFocus`
- `branchComparisonWarnings`

## Safety Rules

Branch Comparison must not include:

- full raw diffs
- raw logs
- secret values
- environment values
- source snippets
- tokens

It reports counts, statuses, commit counts, risk categories, and review focus only.

## Warning Rules

Branch Comparison records warnings when:

- merge base is unknown
- there are no commits ahead of base but the working tree is dirty
- there are commits ahead of base and the working tree is also dirty

This helps reviewers distinguish committed branch impact from uncommitted working tree changes.

## Relationship To PR Context

PR Context includes the branch comparison summary so local reports can explain the merge candidate before GitHub PR integration exists.

## Limitations

Branch Comparison v1 is intentionally small:

- no GitHub API
- no PR API
- no branch protection awareness
- no remote fetch
- no review approval metadata
- no full diff rendering

Future GitHub integration can attach this comparison to a real PR while preserving the local deterministic summary.
