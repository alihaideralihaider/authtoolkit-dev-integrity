# AuthToolkit Dev Integrity Project Map

## Repo Purpose

AuthToolkit Dev Integrity is a local-first operational trust system for AI-assisted engineering. It inspects Git changes, classifies risk, routes review packs, evaluates awareness-layer posture, writes markdown reports, and preserves local evidence timeline snapshots.

The repo is intentionally small and deterministic-first. The current implementation is a local CLI and engine foundation, not a SaaS service or dashboard.

## Key Directories

- `src/`: TypeScript source for the local CLI, review runner, awareness layers, report writer, and evidence timeline.
- `docs/architecture/`: architecture documents for the engine, awareness stack, decision summary, control room, and blueprint.
- `docs/skills/`: review skill definitions and checklists selected by the review runner.
- `docs/runbooks/`: operational runbooks for onboarding, deploy checks, canary checks, incidents, and recovery.
- `docs/control-rooms/`: control room framework documents.
- `docs/audits/`: audit framework documents.
- `docs/product/`: product vision and strategy.
- `docs/examples/`: compact sample output summaries for humans.
- `examples/`: sample configs, build summaries, inventory files, and report examples.
- `reports/`: generated local markdown reports. This is generated output and should not be treated as product source.
- `reports/timeline/`: generated local JSON evidence timeline snapshots.

## CLI Entry Point

The CLI entry point is:

- `src/cli.ts`

The npm script is defined in `package.json`:

```sh
npm run review -- --repo . --skill saana-plan
```

The CLI parses arguments, calls the review runner, writes the report, and prints the generated report path.

Optional build evidence can be supplied with:

```sh
npm run review -- --repo . --skill saana-plan --build-summary examples/sample-build-summary.json
```

## Review Runner Flow

The main orchestration file is:

- `src/reviewRunner.ts`

High-level flow:

```text
CLI arguments
-> monitor Git changes
-> classify file risk
-> detect risk combinations
-> inspect safe diff signals
-> load optional build summary
-> select review packs
-> evaluate PR, release, runtime, architecture, policy, evidence, agent, recovery, impact, and posture layers
-> build Integrity Decision Summary
-> build Integrity Control Room Overview
-> return ReviewResult
-> write markdown report and evidence timeline
```

The runner does not modify the target repo. It reads Git status, Git diff metadata, changed files, and optional local build summary data.

## Awareness Modules Map

Core Git and risk modules:

- `src/gitMonitor.ts`: reads local Git status and diff metadata.
- `src/riskClassifier.ts`: classifies changed files into risk categories and severity.
- `src/reviewSelector.ts`: maps risks to suggested reviews and review packs.
- `src/riskCombinationDetector.ts`: detects dangerous combinations across changed files.
- `src/diffAwareIntegrity.ts`: inspects safe diff signals without printing full raw diffs or secret values.

Awareness layers:

- `src/buildAwareIntegrity.ts`: evaluates optional local build summary input.
- `src/prIntegrity.ts`: evaluates merge readiness and approval risk.
- `src/releaseReadiness.ts`: evaluates release decision, release risk, checks, rollback, and canary needs.
- `src/runtimeIntegrity.ts`: evaluates post-release runtime posture and signals to watch.
- `src/architectureAwareIntegrity.ts`: evaluates affected systems, boundaries, dependencies, and blast radius.
- `src/policyAwareIntegrity.ts`: evaluates governance rules, escalation, and required approvals.
- `src/evidenceAwareIntegrity.ts`: evaluates evidence posture, gaps, strengths, and evidence requirements.
- `src/agentAwareIntegrity.ts`: detects agent/automation signals and adjusts review expectations.
- `src/recoveryAwareIntegrity.ts`: evaluates rollback feasibility, recovery complexity, and operator burden.
- `src/impactAwareIntegrity.ts`: translates technical risk into customer, admin, payment, runtime, data, compliance, and owner/operator impact.
- `src/postureAwareIntegrity.ts`: compares current and previous local evidence timeline snapshots and reports posture plus layer-specific drift.

Decision and control room layers:

- `src/integrityDecisionSummary.ts`: condenses awareness outputs into one operational trust decision.
- `src/controlRoomOverview.ts`: presents the engine and awareness stack as one operational command summary.

## Report Writer

The report writer is:

- `src/reportWriter.ts`

It writes:

- a markdown report under `reports/`
- a JSON evidence timeline snapshot under `reports/timeline/`

The report starts with the Integrity Control Room Overview and Integrity Decision Summary, then includes detailed layer sections.

## Evidence Timeline

Evidence timeline logic lives in:

- `src/evidenceTimeline.ts`

The evidence timeline stores compact local JSON snapshots. It is used by Posture-Aware Integrity to compare the current review against previous runs for the same repo.

Timeline snapshots should not include raw secret values, raw logs, raw diffs, or private runtime data.

## Control Room Overview

The Control Room Overview is generated by:

- `src/controlRoomOverview.ts`

It produces:

- control room status: `green`, `yellow`, `orange`, or `red`
- executive summary
- decision snapshot
- awareness snapshot
- risk snapshot
- required actions
- human attention areas
- drift snapshot
- control room warnings
- recommended action

It is a local markdown/control-room summary, not a web dashboard.

## Sample Build Summary

The sample build summary lives at:

- `examples/sample-build-summary.json`

It demonstrates the optional `--build-summary` input shape. The build summary should be redacted and should not include raw logs or secret values.

## Safety Rules

AuthToolkit Dev Integrity must preserve these rules:

- local-first by default
- no external AI APIs in the local runner
- no database requirement for v1
- do not modify the target repo
- do not auto-fix
- do not auto-approve
- do not auto-commit
- do not auto-push
- do not deploy
- never print or store secret values
- do not print full raw diffs
- treat generated reports as baseline evidence only
- preserve human review and approval boundaries

## Where To Add Future Integrations

Keep integrations thin and route them through the existing engine outputs.

Suggested locations:

- CLI flags and argument parsing: `src/cli.ts`
- review orchestration: `src/reviewRunner.ts`
- new awareness layer: add a focused `src/*AwareIntegrity.ts` module and document it in `docs/architecture/`
- report output: `src/reportWriter.ts`
- evidence snapshot fields: `src/evidenceTimeline.ts`
- review routing: `src/reviewSelector.ts`
- risk heuristics: `src/riskClassifier.ts` and `src/riskCombinationDetector.ts`
- future GitHub/Jira/Slack/CI delivery adapters: add integration-specific modules that consume `ReviewResult` rather than duplicating engine logic

Future integrations should be delivery mechanisms. The Integrity Engine remains the reasoning core.
