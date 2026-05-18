# vault-recovery-review

## Purpose
Review whether the project can be recovered from a fresh machine, server, or CI runner without relying on founder memory.

## When to run
- New machine setup.
- Contractor onboarding.
- Deployment process changes.
- Missing env vars incident.
- Password manager or vault process changes.

## Inputs
- Secret inventory
- Onboarding runbook
- Recovery checklist
- CI/deploy process notes

## Checklist
- Required secret names are discoverable.
- Actual values live outside Git in an approved vault/provider console.
- CI can deploy without one local machine.
- Emergency access is documented.
- Missing items have owners and next actions.

## Output format
- Recovery score
- Missing recovery items
- Blockers
- Recommended updates

## Failure examples
- Only one laptop has deployable env vars.
- Provider account owner is unknown.
- Recovery process requires undocumented manual memory.

## Suggested fix format
Document source of truth, owner, and bootstrap steps with no secret values, then rerun recovery review.

