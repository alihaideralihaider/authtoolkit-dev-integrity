# CLI Review Runner Contract

## Purpose

Define the first local CLI contract for AuthToolkit Dev Integrity.

The runner should accept a repository path and a selected review skill, then produce a markdown integrity report.

## Input

```json
{
  "repo_path": "/path/to/project",
  "selected_skill": "saana-security-review"
}
```

## Output

```text
integrity-report.md
```

The report should be markdown so it can be reviewed in Git, attached to issues, stored as evidence, or copied into a future Control Room.

## Runner Flow

1. Validate that `repo_path` exists.
2. Validate that `selected_skill` exists in the skill registry.
3. Read the selected skill instructions.
4. Inspect the repository locally.
5. Classify changed files if Git metadata is available.
6. Run deterministic checks available for the selected skill.
7. Generate findings, evidence, confidence, and suggested next actions.
8. Write a markdown integrity report.

## Markdown Report Shape

```md
# AuthToolkit Dev Integrity Report

## Summary

- Repo path:
- Selected skill:
- Created at:
- Confidence:
- Decision:

## Findings

### Severity: Finding title

- Category:
- Evidence:
- Affected files:
- Why it matters:
- Suggested fix:

## Validation

- Checks run:
- Checks skipped:
- Remaining risk:

## Next Actions

- Recommended follow-up:
```

## Rules

- Do not call external AI APIs.
- Do not print or store secret values.
- Do not modify the target repository unless an explicit future fix mode is added.
- Keep the first version local-first and dependency-light.
- Reports should use paths, names, summaries, and evidence, not raw secrets or private records.

