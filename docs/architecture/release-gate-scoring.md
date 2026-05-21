# Release Gate Scoring

Release Gate Scoring v1 adds deterministic weighted scoring to Release Gate Decision.

## Purpose

The score explains why release confidence is high or low. It turns a gate result such as `pass`, `warn`, `block`, or `needs-human-review` into auditable operational confidence reasoning.

## Deterministic Weighted Scoring

Scoring starts at `100`. Known release risks subtract points and healthy signals add points. The final score is clamped between `0` and `100`.

There are no hidden weights, random values, adaptive learning, or machine-learning models.

## Why This Is Not ML

Release Gate Scoring is a static ruleset. The same inputs produce the same score every time. Every score contribution is printed in the report so humans can review the reason for the final confidence band.

## Negative Contributors

Critical blockers:

- Control Room red: `-30`
- integrity decision blocked: `-25`
- release workflow blocked: `-20`
- recovery risk critical: `-20`

GitHub:

- failed GitHub checks: `-10` each, capped at `-25`
- pending GitHub checks: `-4` each, capped at `-12`

GitHub Actions:

- failed workflow run: `-8` each, capped at `-20`
- failed job: `-4` each, capped at `-20`
- pending workflow: `-3` each, capped at `-12`
- cancelled workflow: `-5` each, capped at `-10`

Release Signals:

- release signal failure: `-15`
- cancelled/skipped release signal: `-8`

CI/CD:

- failed CI/CD: `-12`
- warning CI/CD: `-6`
- cancelled/skipped CI/CD: `-8`

Evidence:

- evidence posture missing/blocking-gap: `-15`
- each evidence gap: `-3`, capped at `-15`

Runtime and impact:

- runtime unstable: `-10`
- runtime degraded: `-5`
- impact critical: `-12`
- impact high: `-6`

## Positive Contributors

- release signal success: `+5`
- runtime stable: `+5`
- evidence sufficient: `+5`
- release workflow ready: `+5`
- trusted integrity decision: `+5`
- no failed GitHub checks: `+3`
- no failed GitHub Actions runs/jobs: `+3`

Positive contributors can improve confidence but do not erase release blockers.

## Confidence Bands

- `0-20`: very-low
- `21-40`: low
- `41-60`: medium
- `61-80`: high
- `81-100`: very-high

## Report Output

Reports show:

- release gate score
- confidence band
- positive score contributors
- negative score contributors
- scoring warnings
- scoring summary

Example contributors:

- `Control Room red: -30`
- `Recovery risk critical: -20`
- `Release signal success: +5`
- `Evidence sufficient: +5`

## Limitations

- v1 weights are conservative defaults.
- v1 does not learn from historical outcomes.
- v1 does not replace release owner judgment.
- v1 should be tuned only through explicit versioned rule changes.

## Future Tuning Philosophy

Future tuning should keep weights explicit, documented, and reviewable. If teams customize weights later, the active scoring profile should be shown in the report.
