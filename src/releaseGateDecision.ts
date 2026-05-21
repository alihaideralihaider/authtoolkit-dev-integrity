import type { CicdContext } from "./cicdContext.ts";
import type { ControlRoomOverviewResult } from "./controlRoomOverview.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { GitHubActionsContext } from "./githubActionsContext.ts";
import type { GitHubChecksContext } from "./githubChecksContext.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseSignals } from "./releaseSignals.ts";
import type { ReleaseWorkflowPlan } from "./releaseWorkflowPlan.ts";
import type { WorkflowRoutingSummaryResult } from "./workflowRoutingSummary.ts";

export type ReleaseGateDecisionValue = "pass" | "warn" | "block" | "needs-human-review";

export type ReleaseGateDecisionInput = {
  integrityDecisionSummary: IntegrityDecisionSummaryResult;
  controlRoomOverview: ControlRoomOverviewResult;
  workflowRoutingSummary: WorkflowRoutingSummaryResult;
  releaseWorkflowPlan: ReleaseWorkflowPlan;
  releaseSignals: ReleaseSignals;
  cicdContext: CicdContext;
  githubChecksContext: GitHubChecksContext;
  githubActionsContext: GitHubActionsContext;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
};

export type ReleaseGateDecision = {
  releaseGateDecision: ReleaseGateDecisionValue;
  releaseGateConfidence: number;
  releaseGateReasons: string[];
  releaseGateBlockers: string[];
  releaseGateWarnings: string[];
  requiredGateEvidence: string[];
  recommendedGateAction: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

function blockersFor(input: ReleaseGateDecisionInput): string[] {
  const blockers: string[] = [];

  if (input.controlRoomOverview.controlRoomStatus === "red") blockers.push("Control Room status is red.");
  if (input.integrityDecisionSummary.overallIntegrityDecision === "blocked") blockers.push("Overall integrity decision is blocked.");
  if (input.releaseWorkflowPlan.releaseWorkflowStatus === "blocked") blockers.push("Release workflow plan is blocked.");
  if (input.recoveryAwareIntegrity.recoveryRisk === "critical") blockers.push("Recovery risk is critical.");
  if (input.githubChecksContext.failedChecks > 0) blockers.push("GitHub checks failed.");
  if (input.githubActionsContext.failedWorkflowRuns.length > 0 || input.githubActionsContext.failedJobs.length > 0) blockers.push("GitHub Actions workflows or jobs failed.");
  if (input.releaseSignals.signalConclusion === "failure") blockers.push("Release signal failed.");

  return unique(blockers);
}

function warningsFor(input: ReleaseGateDecisionInput): string[] {
  const warnings: string[] = [];

  if (input.integrityDecisionSummary.overallIntegrityDecision === "caution") warnings.push("Overall integrity decision is caution.");
  if (input.releaseWorkflowPlan.releaseWorkflowStatus === "caution") warnings.push("Release workflow plan is caution.");
  if (input.githubChecksContext.pendingChecks > 0) warnings.push("GitHub checks are pending.");
  if (input.githubActionsContext.pendingWorkflowRuns.length > 0) warnings.push("GitHub Actions workflows are pending.");
  if (["cancelled", "skipped"].includes(input.releaseSignals.signalConclusion)) warnings.push("Release signal did not complete.");
  if (input.cicdContext.pipelineStatus === "warning") warnings.push("CI/CD context has warning status.");
  if (input.cicdContext.pipelineStatus === "cancelled" || input.cicdContext.pipelineStatus === "skipped") warnings.push("CI/CD context is incomplete.");
  warnings.push(...input.releaseSignals.releaseSignalWarnings);

  return unique(warnings);
}

function evidenceFor(input: ReleaseGateDecisionInput): string[] {
  return unique([
    ...input.workflowRoutingSummary.workflowEvidenceNeeds,
    ...input.releaseWorkflowPlan.requiredReleaseEvidence,
    ...input.evidenceAwareIntegrity.evidenceRequiredBeforeRelease,
    ...(input.evidenceAwareIntegrity.evidencePosture !== "sufficient" ? input.evidenceAwareIntegrity.evidenceGaps : []),
  ]);
}

function reasonsFor(input: ReleaseGateDecisionInput): string[] {
  return unique([
    `Control Room status: ${input.controlRoomOverview.controlRoomStatus}.`,
    `Integrity decision: ${input.integrityDecisionSummary.overallIntegrityDecision}.`,
    `Release workflow status: ${input.releaseWorkflowPlan.releaseWorkflowStatus}.`,
    `Release signal conclusion: ${input.releaseSignals.signalConclusion}.`,
    `CI/CD status: ${input.cicdContext.pipelineStatus}.`,
    `GitHub checks: ${input.githubChecksContext.failedChecks} failed, ${input.githubChecksContext.pendingChecks} pending.`,
    `GitHub Actions: ${input.githubActionsContext.failedWorkflowRuns.length} failed runs, ${input.githubActionsContext.pendingWorkflowRuns.length} pending runs.`,
    `Evidence posture: ${input.evidenceAwareIntegrity.evidencePosture}.`,
    `Recovery risk: ${input.recoveryAwareIntegrity.recoveryRisk}.`,
  ]);
}

function decisionFor(input: ReleaseGateDecisionInput, blockers: string[], warnings: string[], requiredEvidence: string[]): ReleaseGateDecisionValue {
  if (blockers.length) return "block";
  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "high-risk" ||
    input.workflowRoutingSummary.activeWorkflows.includes("escalation-review") ||
    input.evidenceAwareIntegrity.evidencePosture !== "sufficient" ||
    requiredEvidence.length > 0
  ) {
    return "needs-human-review";
  }
  if (warnings.length) return "warn";
  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "trusted" &&
    input.releaseWorkflowPlan.releaseWorkflowStatus === "ready" &&
    input.releaseSignals.signalConclusion === "success" &&
    input.evidenceAwareIntegrity.evidencePosture === "sufficient"
  ) {
    return "pass";
  }
  return "needs-human-review";
}

function confidenceFor(decision: ReleaseGateDecisionValue, blockers: string[], warnings: string[], requiredEvidence: string[]): number {
  if (decision === "block") return Math.max(0, 35 - blockers.length * 5);
  if (decision === "needs-human-review") return Math.max(36, 65 - requiredEvidence.length * 2 - warnings.length * 2);
  if (decision === "warn") return Math.max(66, 82 - warnings.length * 3);
  return 95;
}

function actionFor(decision: ReleaseGateDecisionValue): string {
  if (decision === "block") return "Do not release. Resolve blockers, attach evidence, and rerun the Integrity review.";
  if (decision === "needs-human-review") return "Require human release review and attach gate evidence before release.";
  if (decision === "warn") return "Proceed only with release owner acknowledgement and post-release watch.";
  return "Release gate can pass through the normal release path with evidence preserved.";
}

export function evaluateReleaseGateDecision(input: ReleaseGateDecisionInput): ReleaseGateDecision {
  const blockers = blockersFor(input);
  const warnings = warningsFor(input);
  const requiredEvidence = evidenceFor(input);
  const releaseGateDecision = decisionFor(input, blockers, warnings, requiredEvidence);

  return {
    releaseGateDecision,
    releaseGateConfidence: confidenceFor(releaseGateDecision, blockers, warnings, requiredEvidence),
    releaseGateReasons: reasonsFor(input),
    releaseGateBlockers: blockers,
    releaseGateWarnings: warnings,
    requiredGateEvidence: requiredEvidence,
    recommendedGateAction: actionFor(releaseGateDecision),
  };
}
