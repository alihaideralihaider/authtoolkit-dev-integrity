import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export type IntegrityRunStatus = "active" | "completed" | "failed" | "cancelled";
export type IntegrityFindingStatus = "open" | "resolved" | "accepted_risk";

export type IntegrityRunEvent = {
  event_id: string;
  run_id: string;
  type: string;
  message: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type IntegrityFinding = {
  finding_id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  affected_file: string;
  status: IntegrityFindingStatus;
  suggested_fix: string;
  evidence_required: string;
};

export type IntegrityRunRecord = {
  run_id: string;
  project_id: string;
  project_name: string;
  repo_name: string;
  branch: string;
  commit_sha: string;
  status: IntegrityRunStatus;
  stage: string;
  created_at: string;
  updated_at: string;
  confidence_before: number | null;
  confidence_after: number | null;
  findings: IntegrityFinding[];
  events: IntegrityRunEvent[];
};

export type IntegrityRunSummary = {
  run_id: string;
  project_id: string;
  project_name: string;
  repo_name: string;
  branch: string;
  commit_sha: string;
  status: IntegrityRunStatus;
  stage: string;
  created_at: string;
  updated_at: string;
  confidence_before: number | null;
  confidence_after: number | null;
  finding_count: number;
  unresolved_finding_count: number;
  last_event: IntegrityRunEvent | null;
  run_path: string;
};

export type IntegrityRunIndex = {
  generated_at: string;
  runs: IntegrityRunSummary[];
};

export type CreateRunInput = {
  runId?: string;
  projectId: string;
  projectName: string;
  repoName: string;
  branch?: string;
  commitSha?: string;
  status?: IntegrityRunStatus;
  stage?: string;
  confidenceBefore?: number | null;
};

export type AddFindingInput = {
  runId: string;
  severity: string;
  category: string;
  title: string;
  description?: string;
  affectedFile?: string;
  suggestedFix?: string;
  evidenceRequired?: string;
};

export type AppendEventInput = {
  runId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type ResolveFindingInput = {
  runId: string;
  findingId: string;
  status?: IntegrityFindingStatus;
  message?: string;
};

export type RecheckInput = {
  runId: string;
  confidenceAfter?: number | null;
  stage?: string;
  status?: IntegrityRunStatus;
  message?: string;
  metadata?: Record<string, unknown>;
};

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function stateRoot(root = repoRoot()): string {
  return path.join(root, "reports", "state");
}

function runsRoot(root = repoRoot()): string {
  return path.join(stateRoot(root), "runs");
}

function indexPath(root = repoRoot()): string {
  return path.join(stateRoot(root), "index.json");
}

function runPath(runId: string, root = repoRoot()): string {
  return path.join(runsRoot(root), `${safeId(runId)}.json`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeId(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
}

function ensureStateDirs(root = repoRoot()): void {
  mkdirSync(runsRoot(root), { recursive: true });
}

function normalizeConfidence(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function readRun(runId: string, root = repoRoot()): IntegrityRunRecord {
  const filePath = runPath(runId, root);
  if (!existsSync(filePath)) {
    throw new Error(`Integrity run not found: ${runId}`);
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as IntegrityRunRecord;
}

function writeRun(run: IntegrityRunRecord, root = repoRoot()): IntegrityRunRecord {
  ensureStateDirs(root);
  writeFileSync(runPath(run.run_id, root), `${JSON.stringify(run, null, 2)}\n`);
  writeIndex(root);
  return run;
}

function summarizeRun(run: IntegrityRunRecord, root = repoRoot()): IntegrityRunSummary {
  const unresolved = run.findings.filter((finding) => finding.status === "open");
  const lastEvent = run.events.length ? run.events[run.events.length - 1] : null;

  return {
    run_id: run.run_id,
    project_id: run.project_id,
    project_name: run.project_name,
    repo_name: run.repo_name,
    branch: run.branch,
    commit_sha: run.commit_sha,
    status: run.status,
    stage: run.stage,
    created_at: run.created_at,
    updated_at: run.updated_at,
    confidence_before: run.confidence_before,
    confidence_after: run.confidence_after,
    finding_count: run.findings.length,
    unresolved_finding_count: unresolved.length,
    last_event: lastEvent,
    run_path: path.relative(root, runPath(run.run_id, root)),
  };
}

function loadRuns(root = repoRoot()): IntegrityRunRecord[] {
  const dir = runsRoot(root);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      try {
        return JSON.parse(readFileSync(path.join(dir, name), "utf8")) as IntegrityRunRecord;
      } catch {
        return null;
      }
    })
    .filter((run): run is IntegrityRunRecord => Boolean(run?.run_id));
}

export function writeIndex(root = repoRoot()): IntegrityRunIndex {
  ensureStateDirs(root);
  const runs = loadRuns(root)
    .map((run) => summarizeRun(run, root))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const index: IntegrityRunIndex = {
    generated_at: nowIso(),
    runs,
  };
  writeFileSync(indexPath(root), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

export function createRun(input: CreateRunInput, root = repoRoot()): IntegrityRunRecord {
  const timestamp = nowIso();
  const runId = safeId(input.runId || createId("run"));
  const run: IntegrityRunRecord = {
    run_id: runId,
    project_id: input.projectId,
    project_name: input.projectName,
    repo_name: input.repoName,
    branch: input.branch || "unknown",
    commit_sha: input.commitSha || "unknown",
    status: input.status || "active",
    stage: input.stage || "intake_received",
    created_at: timestamp,
    updated_at: timestamp,
    confidence_before: normalizeConfidence(input.confidenceBefore),
    confidence_after: null,
    findings: [],
    events: [
      {
        event_id: createId("evt"),
        run_id: runId,
        type: "run.created",
        message: "Integrity review run created.",
        created_at: timestamp,
        metadata: {},
      },
    ],
  };

  return writeRun(run, root);
}

export function appendEvent(input: AppendEventInput, root = repoRoot()): IntegrityRunRecord {
  const run = readRun(input.runId, root);
  const timestamp = nowIso();
  run.events.push({
    event_id: createId("evt"),
    run_id: run.run_id,
    type: input.type,
    message: input.message,
    created_at: timestamp,
    metadata: input.metadata || {},
  });
  run.updated_at = timestamp;
  return writeRun(run, root);
}

export function addFinding(input: AddFindingInput, root = repoRoot()): IntegrityRunRecord {
  const run = readRun(input.runId, root);
  const timestamp = nowIso();
  const finding: IntegrityFinding = {
    finding_id: createId("finding"),
    severity: input.severity,
    category: input.category,
    title: input.title,
    description: input.description || "",
    affected_file: input.affectedFile || "",
    status: "open",
    suggested_fix: input.suggestedFix || "",
    evidence_required: input.evidenceRequired || "",
  };

  run.findings.push(finding);
  run.events.push({
    event_id: createId("evt"),
    run_id: run.run_id,
    type: "finding.added",
    message: `Finding added: ${finding.title}`,
    created_at: timestamp,
    metadata: {
      finding_id: finding.finding_id,
      severity: finding.severity,
      category: finding.category,
    },
  });
  run.updated_at = timestamp;
  return writeRun(run, root);
}

export function resolveFinding(input: ResolveFindingInput, root = repoRoot()): IntegrityRunRecord {
  const run = readRun(input.runId, root);
  const finding = run.findings.find((candidate) => candidate.finding_id === input.findingId);
  if (!finding) {
    throw new Error(`Finding not found in run ${input.runId}: ${input.findingId}`);
  }

  const timestamp = nowIso();
  finding.status = input.status || "resolved";
  run.events.push({
    event_id: createId("evt"),
    run_id: run.run_id,
    type: "finding.status_updated",
    message: input.message || `Finding marked ${finding.status}: ${finding.title}`,
    created_at: timestamp,
    metadata: {
      finding_id: finding.finding_id,
      status: finding.status,
    },
  });
  run.updated_at = timestamp;
  return writeRun(run, root);
}

export function recheckRun(input: RecheckInput, root = repoRoot()): IntegrityRunRecord {
  const run = readRun(input.runId, root);
  const timestamp = nowIso();

  run.confidence_after = normalizeConfidence(input.confidenceAfter);
  run.stage = input.stage || "recheck_completed";
  run.status = input.status || run.status;
  run.events.push({
    event_id: createId("evt"),
    run_id: run.run_id,
    type: "run.rechecked",
    message: input.message || "Integrity review run rechecked.",
    created_at: timestamp,
    metadata: {
      confidence_after: run.confidence_after,
      ...(input.metadata || {}),
    },
  });
  run.updated_at = timestamp;
  return writeRun(run, root);
}

export function loadRun(runId: string, root = repoRoot()): IntegrityRunRecord {
  return readRun(runId, root);
}

export function loadRunIndex(root = repoRoot()): IntegrityRunIndex {
  const filePath = indexPath(root);
  if (!existsSync(filePath)) return writeIndex(root);
  return JSON.parse(readFileSync(filePath, "utf8")) as IntegrityRunIndex;
}

export function statePaths(runId?: string, root = repoRoot()): {
  stateRoot: string;
  runsRoot: string;
  indexPath: string;
  runPath?: string;
} {
  return {
    stateRoot: stateRoot(root),
    runsRoot: runsRoot(root),
    indexPath: indexPath(root),
    runPath: runId ? runPath(runId, root) : undefined,
  };
}
