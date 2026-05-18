# saana-plan

## Purpose
Create a clear implementation plan before work begins.

## When to run
- Any code, config, docs, or deployment change.
- Any ambiguous request.
- Any production-sensitive work.

## Inputs
- User request
- Current repo state
- Relevant docs and runbooks
- Known guardrails

## Checklist
- Define scope.
- Identify files likely to change.
- Identify risks and review packs.
- Confirm no secrets or production assumptions are needed.
- Define validation commands.

## Output format
- Scope
- Plan
- Risks
- Validation
- Open questions

## Failure examples
- Starts implementation without understanding scope.
- Misses production-sensitive risk.
- Plans to modify unrelated files.

## Suggested fix format
Summarize the scope issue, narrow the plan, identify required reviews, and rerun planning.

