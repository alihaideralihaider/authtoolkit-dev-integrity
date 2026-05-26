# Agent Checkpointing & Integrity State Pattern

## Purpose

Document the durable state pattern AuthToolkit Dev Integrity should use as it evolves from static metadata/report flows into stateful agent-assisted integrity review workflows.

This is an architecture note only. It does not add a checkpoint database, hosted execution, external APIs, or a new agent runtime.

## Core Idea

Real agents need durable state.

In-memory state is only useful for demos. Production agent systems need:

- checkpoint persistence
- namespace isolation
- tool-backed actions
- deterministic evidence collection
- controlled LLM usage
- TTL cleanup

For Dev Integrity, a review run should be able to survive process restarts, local API restarts, dashboard reloads, and multi-stage review loops.

## Why Memory-Only State Is Not Enough

In-memory state is acceptable for:

- demos
- local playground experiments
- one-request dry runs
- mock examples

It is not enough for:

- multi-stage review workflows
- external dashboard feeds
- remediation loops
- release gate decisions
- audit-grade evidence
- customer/project history
- long-running or resumable agent sessions

Once a process restarts, memory-only state disappears. A Dev Integrity agent must be able to reload prior review context from durable checkpoints.

## Required State Keys

Every persisted checkpoint should include:

- `tenant_id`
- `project_id`
- `repo_id`
- `run_id`
- `thread_id`
- `checkpoint_namespace`
- `checkpoint_id`
- `created_at`
- `metadata`
- `serialized_state`

Recommended optional fields:

- `expires_at`
- `stage`
- `status`
- `source`
- `schema_version`
- `artifact_reference`
- `parent_checkpoint_id`
- `evidence_count`
- `finding_count`

## AuthToolkit Dev Integrity Mapping

- `thread_id` = review/run ID
- `checkpoint_namespace` = tenant/project/repo namespace
- checkpoint state = current review progress
- tools = API-backed integrity checks
- TTL = based on run type and customer plan

Example namespace:

```text
tenant:<tenant_id>/project:<project_id>/repo:<repo_id>
```

Example lookup key:

```text
checkpoint_namespace + thread_id
```

This allows the same `thread_id` shape to exist safely across tenants, projects, and repos.

## Agent Execution Pattern

1. Intake event or review request.
2. Load latest checkpoint by `thread_id` + `checkpoint_namespace`.
3. Run deterministic checks first.
4. Store evidence and intermediate findings.
5. Call LLM only for interpretation, prioritization, and explanation.
6. Save checkpoint after each major stage.
7. Emit dashboard event.
8. Apply TTL / retention policy.

## Design Rule

Use deterministic software for facts.

Use LLMs for judgment, explanation, and synthesis.

Do not make the LLM responsible for everything.

## Deterministic Checks First

Use deterministic checks for facts such as:

- missing env vars
- failed build results
- failed routes
- missing auth checks
- unsafe secret references
- bad migration patterns
- broken API responses
- missing required files
- dependency lifecycle scripts
- unsigned commits
- artifact hash mismatch
- suspicious lockfile drift

These should be implemented as tools/checks with structured evidence.

## LLM Usage Boundary

Use LLMs for:

- risk explanation
- architecture review
- prioritization
- root-cause summary
- remediation planning
- confidence narrative
- founder/reviewer-readable summaries

Avoid calling an LLM for every small step.

Better pipeline:

```text
collect evidence
-> run deterministic scanners
-> store findings
-> call LLM once to synthesize/prioritize/explain
-> persist final summary
```

This is cheaper, faster, easier to test, and more enterprise-friendly.

## Tool-Backed Agent Actions

Agents should run software through explicit tools/APIs, not behave like free-form chatbots.

Candidate Dev Integrity tools:

- `read_project_map`
- `scan_changed_files`
- `run_secret_check`
- `run_route_check`
- `run_build_summary_check`
- `run_dependency_integrity_check`
- `run_release_gate_score`
- `create_review_report`
- `suggest_fix`
- `mark_finding_resolved`
- `publish_dashboard_event`

The LLM should be bound to tools only when the workflow expects it to choose or invoke a tool. Otherwise, deterministic orchestration should call tools directly.

## Checkpoint Stages

Recommended checkpoint stages:

1. `intake_received`
2. `context_loaded`
3. `deterministic_checks_started`
4. `evidence_collected`
5. `findings_generated`
6. `llm_synthesis_started`
7. `summary_generated`
8. `report_metadata_saved`
9. `dashboard_event_emitted`
10. `completed`
11. `failed`

Save after each major stage so a run can resume without losing prior evidence.

## Serialized State Shape

Example checkpoint state:

```json
{
  "stage": "findings_generated",
  "request": {
    "source": "api-playground",
    "mode": "real_local",
    "packs": ["schedules", "env-vars", "routes", "auth"]
  },
  "context": {
    "tenantId": "tenant_local",
    "projectId": "devproj_123",
    "repoId": "repo_abc",
    "runId": "run_456"
  },
  "evidence": [
    {
      "id": "env.missing-example",
      "type": "env",
      "severity": "warning",
      "source": "deterministic_check"
    }
  ],
  "findings": [
    {
      "id": "auth.admin-route-boundary",
      "severity": "blocker",
      "confidence": "high"
    }
  ],
  "summary": null
}
```

## Persistence Options

### Local v1

For local-only experimentation:

- SQLite
- local JSONL checkpoint log
- file-backed store under a project-local `.dev-integrity/` directory

### Hosted/Product Later

For product use:

- Supabase/Postgres checkpoint table
- tenant/project/repo namespace columns
- JSONB serialized state
- indexes for `thread_id`, `checkpoint_namespace`, `created_at`, `expires_at`

Dev Integrity should prefer Postgres/Supabase when persistence becomes productized.

## Namespace Isolation

Namespace isolation prevents cross-tenant/project collisions.

Two projects can safely use the same `thread_id` when their checkpoint namespaces differ.

Rules:

- Never load checkpoint state by `thread_id` alone.
- Always include namespace.
- Namespace must include at least tenant and project.
- Repo should be included when repo-specific context exists.
- Avoid placing secrets in namespace strings.

## TTL and Retention

Checkpoint retention should vary by run type.

Suggested defaults:

- local playground runs: 24–72 hours
- dry-run command previews: 24 hours
- report metadata-only checkpoints: 30 days
- project review history: 30–90 days
- audit-grade evidence: configurable and longer-lived
- enterprise export: customer-controlled retention

Expired checkpoints should be deleted or compacted.

Compaction strategy:

- keep final report metadata
- keep aggregate finding counts
- keep artifact references
- delete verbose intermediate tool state
- delete raw logs that are not needed for audit/export

## Dashboard Feed Relationship

Checkpoint state should feed dashboard events, but the dashboard should not rely on raw checkpoints.

Preferred flow:

```text
checkpoint saved
-> dashboard event emitted
-> report metadata updated
-> dashboard feed reads report/project summaries
```

The dashboard feed should remain metadata-oriented.

## Failure and Resume Behavior

When a run fails:

- save failure checkpoint
- include stage
- include safe error message
- include evidence collected so far
- mark retry/resume eligibility
- emit dashboard event

When a run resumes:

- load latest checkpoint by namespace + thread
- verify schema version
- verify project/repo ownership
- continue from last completed stage
- avoid re-running expensive or side-effecting tools unless idempotent

## Idempotency

Every side-effecting action should have an idempotency key.

Examples:

- `checkpoint:<run_id>:<stage>`
- `dashboard_event:<run_id>:<stage>`
- `report_metadata:<run_id>`
- `artifact_link:<run_id>:<artifact_type>`

Idempotency matters for retries, restarts, and duplicated callbacks.

## Open Questions

- Should local runner checkpoints live inside the reviewed repo or the Dev Integrity repo?
- Should checkpoint state be importable into report metadata APIs?
- How much raw evidence should be retained after report generation?
- Should hosted Dev Integrity expose checkpoint APIs, or keep checkpoints internal?
- What retention defaults should apply to pilots versus paid plans?

## First Implementation Direction

Do not build a full stateful agent runtime yet.

Recommended first step later:

1. Add a local checkpoint table/interface for review runs.
2. Persist stage, evidence, findings, and summary state.
3. Add TTL cleanup.
4. Emit dashboard events from checkpoint transitions.
5. Keep deterministic checks separate from LLM synthesis.

## Future Build Prompt Placeholder

Build Dev Integrity Checkpointing v1:

- add local checkpoint storage for review runs
- include tenant/project/repo/run/thread namespace keys
- save checkpoints after intake, evidence, findings, summary, and report metadata stages
- add TTL cleanup
- keep dashboard feed metadata-only
- run deterministic checks before LLM synthesis
- do not add hosted execution
- do not add external APIs
- do not expose raw checkpoint state publicly
