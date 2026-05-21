import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReviewResult } from "./reviewRunner.ts";

export type ReportCatalogEntry = {
  generatedAt: string;
  repoPath: string;
  selectedSkill: string;
  reportPath: string;
  timelinePath: string;
  controlRoomStatus: string;
  overallIntegrityDecision: string;
  operationalTrustLevel: string;
  workflowPriority: string;
  activeWorkflows: string[];
  currentBranch: string;
  baseBranch: string;
  currentCommit: string;
  prReadinessLabel: string;
  cicdProvider: string;
  pipelineStatus: string;
  pipelineRunId: string;
  releaseSignalProvider: string;
  releaseSignalConclusion: string;
  releaseSignalRunId: string;
  releaseGateScore: number;
  releaseGateConfidenceBand: string;
  githubRepo: string;
  githubPrNumber: string;
  githubFailedChecks: number;
  githubPendingChecks: number;
  githubActionsRunsFound: number;
  githubActionsFailedRuns: number;
  githubActionsPendingRuns: number;
  commitsAheadOfBase: number;
  filesChangedAgainstBase: number;
  highestSeverity: string;
  confidenceScore: number;
};

type UpdateReportCatalogInput = {
  result: ReviewResult;
  reportPath: string;
  timelinePath: string;
  repoRoot: string;
};

function catalogJsonPath(repoRoot: string): string {
  return path.join(repoRoot, "reports", "catalog.json");
}

function catalogMarkdownPath(repoRoot: string): string {
  return path.join(repoRoot, "reports", "catalog.md");
}

function loadCatalog(repoRoot: string): ReportCatalogEntry[] {
  const filePath = catalogJsonPath(repoRoot);
  if (!existsSync(filePath)) return [];

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCatalogEntry)
      .map((entry) => ({
        ...entry,
        currentBranch: entry.currentBranch || "unknown",
        baseBranch: entry.baseBranch || "unknown",
        currentCommit: entry.currentCommit || "unknown",
        prReadinessLabel: entry.prReadinessLabel || "unknown",
        cicdProvider: entry.cicdProvider || "unknown",
        pipelineStatus: entry.pipelineStatus || "unknown",
        pipelineRunId: entry.pipelineRunId || "unknown",
        releaseSignalProvider: entry.releaseSignalProvider || "unknown",
        releaseSignalConclusion: entry.releaseSignalConclusion || "unknown",
        releaseSignalRunId: entry.releaseSignalRunId || "unknown",
        releaseGateScore: entry.releaseGateScore || 0,
        releaseGateConfidenceBand: entry.releaseGateConfidenceBand || "unknown",
        githubRepo: entry.githubRepo || "unknown",
        githubPrNumber: entry.githubPrNumber || "unknown",
        githubFailedChecks: entry.githubFailedChecks || 0,
        githubPendingChecks: entry.githubPendingChecks || 0,
        githubActionsRunsFound: entry.githubActionsRunsFound || 0,
        githubActionsFailedRuns: entry.githubActionsFailedRuns || 0,
        githubActionsPendingRuns: entry.githubActionsPendingRuns || 0,
        commitsAheadOfBase: entry.commitsAheadOfBase || 0,
        filesChangedAgainstBase: entry.filesChangedAgainstBase || 0,
      }));
  } catch {
    return [];
  }
}

function isCatalogEntry(value: unknown): value is ReportCatalogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ReportCatalogEntry>;

  return typeof entry.generatedAt === "string"
    && typeof entry.repoPath === "string"
    && typeof entry.selectedSkill === "string"
    && typeof entry.reportPath === "string"
    && typeof entry.timelinePath === "string"
    && typeof entry.controlRoomStatus === "string"
    && typeof entry.overallIntegrityDecision === "string"
    && typeof entry.operationalTrustLevel === "string"
    && typeof entry.workflowPriority === "string"
    && Array.isArray(entry.activeWorkflows)
    && (entry.currentBranch === undefined || typeof entry.currentBranch === "string")
    && (entry.baseBranch === undefined || typeof entry.baseBranch === "string")
    && (entry.currentCommit === undefined || typeof entry.currentCommit === "string")
    && (entry.prReadinessLabel === undefined || typeof entry.prReadinessLabel === "string")
    && (entry.cicdProvider === undefined || typeof entry.cicdProvider === "string")
    && (entry.pipelineStatus === undefined || typeof entry.pipelineStatus === "string")
    && (entry.pipelineRunId === undefined || typeof entry.pipelineRunId === "string")
    && (entry.releaseSignalProvider === undefined || typeof entry.releaseSignalProvider === "string")
    && (entry.releaseSignalConclusion === undefined || typeof entry.releaseSignalConclusion === "string")
    && (entry.releaseSignalRunId === undefined || typeof entry.releaseSignalRunId === "string")
    && (entry.releaseGateScore === undefined || typeof entry.releaseGateScore === "number")
    && (entry.releaseGateConfidenceBand === undefined || typeof entry.releaseGateConfidenceBand === "string")
    && (entry.githubRepo === undefined || typeof entry.githubRepo === "string")
    && (entry.githubPrNumber === undefined || typeof entry.githubPrNumber === "string")
    && (entry.githubFailedChecks === undefined || typeof entry.githubFailedChecks === "number")
    && (entry.githubPendingChecks === undefined || typeof entry.githubPendingChecks === "number")
    && (entry.githubActionsRunsFound === undefined || typeof entry.githubActionsRunsFound === "number")
    && (entry.githubActionsFailedRuns === undefined || typeof entry.githubActionsFailedRuns === "number")
    && (entry.githubActionsPendingRuns === undefined || typeof entry.githubActionsPendingRuns === "number")
    && (entry.commitsAheadOfBase === undefined || typeof entry.commitsAheadOfBase === "number")
    && (entry.filesChangedAgainstBase === undefined || typeof entry.filesChangedAgainstBase === "number")
    && typeof entry.highestSeverity === "string"
    && typeof entry.confidenceScore === "number";
}

function markdownCell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function shortRepoName(repoPath: string): string {
  return path.basename(repoPath) || repoPath;
}

function buildMarkdownCatalog(entries: ReportCatalogEntry[]): string {
  const rows = entries.flatMap((entry) => {
    const workflows = entry.activeWorkflows.length ? entry.activeWorkflows.join(", ") : "none";

    return [
      `| ${markdownCell(entry.generatedAt)} | ${markdownCell(shortRepoName(entry.repoPath))} | ${markdownCell(entry.selectedSkill)} | ${markdownCell(entry.controlRoomStatus)} | ${markdownCell(entry.overallIntegrityDecision)} | ${markdownCell(entry.operationalTrustLevel)} | ${markdownCell(entry.workflowPriority)} | ${markdownCell(entry.reportPath)} |`,
      `|  | workflows: ${markdownCell(workflows)} | branch: ${markdownCell(entry.currentBranch)} | base: ${markdownCell(entry.baseBranch)} | PR: ${markdownCell(entry.prReadinessLabel)} | release gate: ${entry.releaseGateScore}/${markdownCell(entry.releaseGateConfidenceBand)} | release signal: ${markdownCell(entry.releaseSignalProvider)}/${markdownCell(entry.releaseSignalConclusion)} | timeline: ${markdownCell(entry.timelinePath)} |`,
    ];
  });

  return `# Integrity Report Catalog

This local generated catalog indexes recent AuthToolkit Dev Integrity reports. It stores report metadata only and does not store raw diffs, raw logs, secret values, env values, or source snippets.

| Generated | Repo | Skill | Control Room | Decision | Trust | Workflow Priority | Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.length ? rows.join("\n") : "| none | none | none | none | none | none | none | none |"}
`;
}

export function updateReportCatalog(input: UpdateReportCatalogInput): void {
  const reportPath = path.relative(input.repoRoot, input.reportPath);
  const timelinePath = path.relative(input.repoRoot, input.timelinePath);
  const entry: ReportCatalogEntry = {
    generatedAt: input.result.timestamp,
    repoPath: input.result.repoPath,
    selectedSkill: input.result.selectedSkill,
    reportPath,
    timelinePath,
    controlRoomStatus: input.result.controlRoomOverview.controlRoomStatus,
    overallIntegrityDecision: input.result.integrityDecisionSummary.overallIntegrityDecision,
    operationalTrustLevel: input.result.integrityDecisionSummary.operationalTrustLevel,
    workflowPriority: input.result.workflowRoutingSummary.workflowPriority,
    activeWorkflows: input.result.workflowRoutingSummary.activeWorkflows,
    currentBranch: input.result.gitContext.currentBranch,
    baseBranch: input.result.gitContext.baseBranch,
    currentCommit: input.result.gitContext.currentCommit,
    prReadinessLabel: input.result.prContext.prReadinessLabel,
    cicdProvider: input.result.cicdContext.cicdProvider,
    pipelineStatus: input.result.cicdContext.pipelineStatus,
    pipelineRunId: input.result.cicdContext.pipelineRunId,
    releaseSignalProvider: input.result.releaseSignals.releaseSignalProvider,
    releaseSignalConclusion: input.result.releaseSignals.signalConclusion,
    releaseSignalRunId: input.result.releaseSignals.runId,
    releaseGateScore: input.result.releaseGateDecision.releaseGateScore,
    releaseGateConfidenceBand: input.result.releaseGateDecision.releaseGateConfidenceBand,
    githubRepo: input.result.githubChecksContext.githubRepo,
    githubPrNumber: input.result.githubChecksContext.githubPrNumber,
    githubFailedChecks: input.result.githubChecksContext.failedChecks,
    githubPendingChecks: input.result.githubChecksContext.pendingChecks,
    githubActionsRunsFound: input.result.githubActionsContext.workflowRunsFound,
    githubActionsFailedRuns: input.result.githubActionsContext.failedWorkflowRuns.length,
    githubActionsPendingRuns: input.result.githubActionsContext.pendingWorkflowRuns.length,
    commitsAheadOfBase: input.result.branchComparison.commitsAheadOfBase,
    filesChangedAgainstBase: input.result.branchComparison.filesChangedAgainstBase,
    highestSeverity: input.result.highestSeverity,
    confidenceScore: input.result.confidenceScore,
  };

  const existingEntries = loadCatalog(input.repoRoot).filter((catalogEntry) => catalogEntry.reportPath !== entry.reportPath);
  const entries = [entry, ...existingEntries]
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

  writeFileSync(catalogJsonPath(input.repoRoot), `${JSON.stringify(entries, null, 2)}\n`);
  writeFileSync(catalogMarkdownPath(input.repoRoot), buildMarkdownCatalog(entries));
}
