# Git Monitoring

## Purpose

Git Monitoring is the first real Integrity Pipeline component for AuthToolkit Dev Integrity.

Its purpose is to inspect Git changes in a target repository and generate structured review context.

## Pipeline

```text
Git changes -> risk classification -> selected reviews -> markdown report
```

## Scope

Git Monitoring v1:

- Confirms the target path is a Git repository.
- Runs `git status --short`.
- Runs `git diff --name-only`.
- Collects changed files.
- Detects added, modified, deleted, renamed, and unknown file statuses.
- Classifies files with simple path/name heuristics.
- Selects suggested reviews from risk categories.
- Writes a markdown integrity report.

## What It Does Not Do Yet

Git Monitoring v1 is not:

- PR Integrity
- Release Monitoring
- Runtime Integrity
- Dev Control Room
- Architecture Control Room
- Vault Control Room
- A SaaS service
- A dashboard
- An autofix system

## Safety Rules

- Never print env var values.
- Never modify the target repo.
- Never auto-fix.
- Never auto-commit.
- Never auto-push.
- Do not call external AI APIs.

