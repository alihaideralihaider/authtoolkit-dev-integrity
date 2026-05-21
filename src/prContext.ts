import type { BranchComparison } from "./branchComparison.ts";
import type { CicdContext } from "./cicdContext.ts";
import type { GitContext } from "./gitContext.ts";
import type { GitHubChecksContext } from "./githubChecksContext.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { ClassifiedFile, RiskCategory } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";
import type { WorkflowRoutingSummaryResult } from "./workflowRoutingSummary.ts";

export type PrReadinessLabel = "ready-for-review" | "needs-evidence" | "needs-escalation" | "blocked";

export type PrContextInput = {
  gitContext: GitContext;
  branchComparison: BranchComparison;
  changedFiles: ClassifiedFile[];
  riskCategories: RiskCategory[];
  suggestedReviewPacks: ReviewPack[];
  integrityDecisionSummary: IntegrityDecisionSummaryResult;
  workflowRoutingSummary: WorkflowRoutingSummaryResult;
  cicdContext: CicdContext;
  githubChecksContext?: GitHubChecksContext;
};

export type PrContext = {
  prTitleSuggestion: string;
  prSummary: string;
  prChangeScope: string[];
  prRiskSummary: string[];
  prReviewFocus: string[];
  prRequiredEvidence: string[];
  prRecommendedReviewerTypes: string[];
  prReadinessLabel: PrReadinessLabel;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

function readinessLabel(input: PrContextInput): PrReadinessLabel {
  if (input.integrityDecisionSummary.overallIntegrityDecision === "blocked") return "blocked";
  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "high-risk" ||
    input.workflowRoutingSummary.workflowPriority === "high-risk" ||
    input.workflowRoutingSummary.workflowPriority === "critical"
  ) {
    return "needs-escalation";
  }
  if (input.workflowRoutingSummary.activeWorkflows.includes("evidence-review")) return "needs-evidence";
  return "ready-for-review";
}

function titleSuggestion(input: PrContextInput, label: PrReadinessLabel): string {
  const scope = input.changedFiles.length ? `${input.changedFiles.length} changed file${input.changedFiles.length === 1 ? "" : "s"}` : "no file changes";
  const risks = input.riskCategories.length ? input.riskCategories.join("/") : "low-risk";
  return `[${label}] ${scope} - ${risks}`;
}

function changeScope(input: PrContextInput): string[] {
  if (!input.changedFiles.length) return ["No working tree file changes were detected."];

  return unique([
    `${input.changedFiles.length} changed file${input.changedFiles.length === 1 ? "" : "s"}`,
    ...input.changedFiles.slice(0, 10).map((file) => `${file.path} (${file.status})`),
    ...(input.changedFiles.length > 10 ? [`${input.changedFiles.length - 10} additional changed files not listed in PR Context.`] : []),
  ]);
}

function riskSummary(input: PrContextInput): string[] {
  return unique([
    `Overall integrity decision: ${input.integrityDecisionSummary.overallIntegrityDecision}`,
    `Workflow priority: ${input.workflowRoutingSummary.workflowPriority}`,
    ...(input.riskCategories.length ? [`Risk categories: ${input.riskCategories.join(", ")}`] : ["Risk categories: none"]),
    ...(input.suggestedReviewPacks.length ? [`Suggested review packs: ${input.suggestedReviewPacks.join(", ")}`] : ["Suggested review packs: none"]),
    `CI/CD status: ${input.cicdContext.pipelineStatus}`,
    `CI/CD trust: ${input.cicdContext.cicdTrustSummary}`,
    ...(input.githubChecksContext ? [`GitHub checks: ${input.githubChecksContext.passedChecks} passed, ${input.githubChecksContext.failedChecks} failed, ${input.githubChecksContext.pendingChecks} pending`] : []),
    ...(input.githubChecksContext ? [`GitHub trust: ${input.githubChecksContext.githubChecksTrustSummary}`] : []),
    `Branch comparison: ${input.branchComparison.commitsAheadOfBase} commits ahead, ${input.branchComparison.filesChangedAgainstBase} files changed against base`,
    ...input.integrityDecisionSummary.primaryRiskDrivers.map((driver) => `Primary risk driver: ${driver}`),
  ]);
}

function reviewFocus(input: PrContextInput): string[] {
  return unique([
    ...input.workflowRoutingSummary.activeWorkflows.map((workflow) => `Complete ${workflow}.`),
    ...input.integrityDecisionSummary.requiredHumanAttention.map((area) => `Review ${area}.`),
    ...(input.gitContext.workingTreeState === "dirty" ? ["Review uncommitted local changes before treating this as merge-ready."] : []),
  ]);
}

function reviewerTypes(input: PrContextInput): string[] {
  return unique([
    ...input.workflowRoutingSummary.workflowOwners,
    ...input.integrityDecisionSummary.requiredHumanAttention.map((area) => `${area} reviewer`),
  ]);
}

export function buildPrContext(input: PrContextInput): PrContext {
  const label = readinessLabel(input);

  return {
    prTitleSuggestion: titleSuggestion(input, label),
    prSummary: `Local PR-style summary for branch ${input.gitContext.currentBranch} against ${input.gitContext.baseBranch}. Branch comparison shows ${input.branchComparison.commitsAheadOfBase} commits ahead and ${input.branchComparison.filesChangedAgainstBase} files changed against base. ${input.integrityDecisionSummary.plainEnglishSummary}`,
    prChangeScope: changeScope(input),
    prRiskSummary: riskSummary(input),
    prReviewFocus: reviewFocus(input),
    prRequiredEvidence: unique(input.workflowRoutingSummary.workflowEvidenceNeeds),
    prRecommendedReviewerTypes: reviewerTypes(input),
    prReadinessLabel: label,
  };
}
