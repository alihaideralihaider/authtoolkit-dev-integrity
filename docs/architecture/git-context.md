# Git Context

## Purpose

Git Context adds local branch, commit, and base comparison metadata to AuthToolkit Dev Integrity reviews.

It helps the review output explain what local Git state was evaluated before any future GitHub, Jira, or CI/CD integrations exist.

## Local-Only Behavior

Git Context uses local Git commands only. It does not call external Git hosting APIs, does not fetch remotes, does not modify the target repository, and does not push or commit.

The collected context is metadata only. It does not include raw diffs, raw logs, secret values, environment values, or source snippets.

## Base Branch Resolution

Git Context resolves the base branch in this order:

1. CLI flag `--base-branch` if provided
2. `origin/main` if available locally
3. `main` if available locally
4. `origin/master` if available locally
5. `master` if available locally
6. `unknown`

If a base branch cannot be resolved or a Git command fails, the review continues and records a Git Context warning.

## Fields Collected

Git Context v1 collects:

- `currentBranch`
- `baseBranch`
- `currentCommit`
- `mergeBase`
- `commitRange`
- `commitsInRange`
- `aheadBehindSummary`
- `workingTreeState`
- `gitContextWarnings`

## Report And Catalog Output

Generated reports include a `Git Context` section near the top after `Git Status Summary`.

The local report catalog includes:

- current branch
- base branch
- current commit

## Limitations

Git Context v1 is intentionally small:

- no GitHub PR API
- no Jira issue lookup
- no CI/CD integration
- no remote fetch
- no branch protection awareness
- no reviewer or approval metadata

The ahead/behind summary is based only on refs already available in the local repository.

## Future GitHub PR Relationship

Future GitHub PR integration can use Git Context as the local baseline for PR-aware review. GitHub can add PR number, target branch, approvals, checks, and review comments later. The local Git Context remains the deterministic source for branch and commit metadata that can be collected without network access.
