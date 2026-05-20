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
      `|  | workflows: ${markdownCell(workflows)} | branch: ${markdownCell(entry.currentBranch)} | base: ${markdownCell(entry.baseBranch)} | commit: ${markdownCell(entry.currentCommit)} |  |  | timeline: ${markdownCell(entry.timelinePath)} |`,
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
    highestSeverity: input.result.highestSeverity,
    confidenceScore: input.result.confidenceScore,
  };

  const existingEntries = loadCatalog(input.repoRoot).filter((catalogEntry) => catalogEntry.reportPath !== entry.reportPath);
  const entries = [entry, ...existingEntries]
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));

  writeFileSync(catalogJsonPath(input.repoRoot), `${JSON.stringify(entries, null, 2)}\n`);
  writeFileSync(catalogMarkdownPath(input.repoRoot), buildMarkdownCatalog(entries));
}
