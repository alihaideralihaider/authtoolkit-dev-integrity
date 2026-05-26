import {
  addFinding,
  appendEvent,
  createRun,
  loadRun,
  loadRunIndex,
  recheckRun,
  resolveFinding,
  statePaths,
  writeIndex,
  type IntegrityFindingStatus,
  type IntegrityRunStatus,
} from "./runState.ts";

type ParsedArgs = {
  command: string;
  flags: Record<string, string | boolean>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command, flags };
}

function required(flags: Record<string, string | boolean>, key: string): string {
  const value = flags[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`--${key} is required.`);
  }
  return value.trim();
}

function optionalString(flags: Record<string, string | boolean>, key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(flags: Record<string, string | boolean>, key: string): number | null | undefined {
  const value = flags[key];
  if (typeof value !== "string" || !value.trim()) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`--${key} must be a number.`);
  return number;
}

function metadata(flags: Record<string, string | boolean>): Record<string, unknown> {
  const raw = optionalString(flags, "metadata-json");
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--metadata-json must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function printUsage(): void {
  console.log(`Usage:
  npm run run-state -- create --project-id devproj_local --project-name "Pilot Project" --repo-name missed-call-platform [--branch main] [--commit-sha abc123] [--confidence-before 62]
  npm run run-state -- append-event --run-id run_123 --type evidence.collected --message "Collected route evidence" [--metadata-json '{"source":"local"}']
  npm run run-state -- add-finding --run-id run_123 --severity warning --category auth --title "Admin route needs boundary" [--affected-file app/api/admin/route.ts]
  npm run run-state -- resolve-finding --run-id run_123 --finding-id finding_123 [--status resolved]
  npm run run-state -- recheck --run-id run_123 --confidence-after 82 [--stage recheck_completed] [--status completed]
  npm run run-state -- show --run-id run_123
  npm run run-state -- list
  npm run run-state -- rebuild-index
`);
}

function printResult(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  if (command === "help" || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "create") {
    const run = createRun({
      runId: optionalString(flags, "run-id"),
      projectId: required(flags, "project-id"),
      projectName: required(flags, "project-name"),
      repoName: required(flags, "repo-name"),
      branch: optionalString(flags, "branch"),
      commitSha: optionalString(flags, "commit-sha"),
      stage: optionalString(flags, "stage"),
      status: optionalString(flags, "status") as IntegrityRunStatus | undefined,
      confidenceBefore: optionalNumber(flags, "confidence-before"),
    });
    printResult({ ok: true, run, paths: statePaths(run.run_id) });
    return;
  }

  if (command === "append-event") {
    const run = appendEvent({
      runId: required(flags, "run-id"),
      type: required(flags, "type"),
      message: required(flags, "message"),
      metadata: metadata(flags),
    });
    printResult({ ok: true, run });
    return;
  }

  if (command === "add-finding") {
    const run = addFinding({
      runId: required(flags, "run-id"),
      severity: required(flags, "severity"),
      category: required(flags, "category"),
      title: required(flags, "title"),
      description: optionalString(flags, "description"),
      affectedFile: optionalString(flags, "affected-file"),
      suggestedFix: optionalString(flags, "suggested-fix"),
      evidenceRequired: optionalString(flags, "evidence-required"),
    });
    printResult({ ok: true, run });
    return;
  }

  if (command === "resolve-finding") {
    const run = resolveFinding({
      runId: required(flags, "run-id"),
      findingId: required(flags, "finding-id"),
      status: optionalString(flags, "status") as IntegrityFindingStatus | undefined,
      message: optionalString(flags, "message"),
    });
    printResult({ ok: true, run });
    return;
  }

  if (command === "recheck") {
    const run = recheckRun({
      runId: required(flags, "run-id"),
      confidenceAfter: optionalNumber(flags, "confidence-after"),
      stage: optionalString(flags, "stage"),
      status: optionalString(flags, "status") as IntegrityRunStatus | undefined,
      message: optionalString(flags, "message"),
      metadata: metadata(flags),
    });
    printResult({ ok: true, run });
    return;
  }

  if (command === "show") {
    printResult(loadRun(required(flags, "run-id")));
    return;
  }

  if (command === "list") {
    printResult(loadRunIndex());
    return;
  }

  if (command === "rebuild-index") {
    printResult(writeIndex());
    return;
  }

  printUsage();
  throw new Error(`Unknown run-state command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
