import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { CicdContext } from "./cicdContext.ts";
import type { ControlRoomOverviewResult } from "./controlRoomOverview.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { GitHubActionsContext } from "./githubActionsContext.ts";
import type { GitHubChecksContext } from "./githubChecksContext.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { WorkflowRoutingSummaryResult } from "./workflowRoutingSummary.ts";

export type ReleaseWorkflowStatus = "ready" | "caution" | "blocked" | "not-applicable";

export type ReleaseWorkflowPlanInput = {
  releaseReadiness: ReleaseReadinessResult;
  buildAwareIntegrity: BuildAwareIntegrityResult;
  cicdContext: CicdContext;
  runtimeIntegrity: RuntimeIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
  impactAwareIntegrity: ImpactAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  workflowRoutingSummary: WorkflowRoutingSummaryResult;
  controlRoomOverview: ControlRoomOverviewResult;
  githubChecksContext?: GitHubChecksContext;
  githubActionsContext?: GitHubActionsContext;
};

export type ReleaseWorkflowPlan = {
  releaseWorkflowStatus: ReleaseWorkflowStatus;
  preReleaseChecklist: string[];
  releaseExecutionChecklist: string[];
  postReleaseWatchChecklist: string[];
  rollbackReadinessChecklist: string[];
  requiredReleaseEvidence: string[];
  releaseOwnerAttention: string[];
  recommendedReleasePath: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

function statusFor(input: ReleaseWorkflowPlanInput): ReleaseWorkflowStatus {
  if (
    input.releaseReadiness.releaseDecision === "blocked" ||
    input.controlRoomOverview.controlRoomStatus === "red" ||
    input.recoveryAwareIntegrity.recoveryRisk === "critical"
  ) {
    return "blocked";
  }

  if (
    input.releaseReadiness.releaseDecision === "caution" ||
    input.cicdContext.pipelineStatus === "failed" ||
    input.cicdContext.pipelineStatus === "warning" ||
    (input.githubChecksContext?.failedChecks || 0) > 0 ||
    (input.githubChecksContext?.pendingChecks || 0) > 0 ||
    (input.githubActionsContext?.failedWorkflowRuns.length || 0) > 0 ||
    (input.githubActionsContext?.failedJobs.length || 0) > 0 ||
    (input.githubActionsContext?.pendingWorkflowRuns.length || 0) > 0 ||
    (input.githubActionsContext?.cancelledWorkflowRuns.length || 0) > 0 ||
    input.evidenceAwareIntegrity.evidencePosture === "missing" ||
    input.evidenceAwareIntegrity.evidencePosture === "blocking-gap" ||
    input.runtimeIntegrity.runtimePosture !== "stable"
  ) {
    return "caution";
  }

  if (
    input.releaseReadiness.releaseDecision === "ready" &&
    input.buildAwareIntegrity.buildPosture === "passed" &&
    input.evidenceAwareIntegrity.evidencePosture === "sufficient" &&
    input.runtimeIntegrity.runtimePosture === "stable"
  ) {
    return "ready";
  }

  if (!input.workflowRoutingSummary.activeWorkflows.includes("release-review")) {
    return "not-applicable";
  }

  return "caution";
}

function preReleaseChecklist(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    ...input.releaseReadiness.requiredReleaseChecks,
    ...input.evidenceAwareIntegrity.evidenceRequiredBeforeRelease,
    ...(input.buildAwareIntegrity.buildPosture !== "passed" ? ["Attach passing build evidence before release."] : []),
    ...(input.cicdContext.pipelineStatus === "failed" || input.cicdContext.pipelineStatus === "warning" ? ["Attach CI/CD rerun evidence before release."] : []),
    ...((input.githubChecksContext?.failedChecks || 0) > 0 ? ["Attach GitHub check rerun evidence before release."] : []),
    ...((input.githubChecksContext?.pendingChecks || 0) > 0 ? ["Wait for pending GitHub checks before release."] : []),
    ...((input.githubActionsContext?.failedWorkflowRuns.length || 0) > 0 || (input.githubActionsContext?.failedJobs.length || 0) > 0 ? ["Attach GitHub Actions rerun evidence before release."] : []),
    ...((input.githubActionsContext?.pendingWorkflowRuns.length || 0) > 0 ? ["Wait for pending GitHub Actions workflows before release."] : []),
    ...((input.githubActionsContext?.cancelledWorkflowRuns.length || 0) > 0 ? ["Explain cancelled GitHub Actions workflows before release."] : []),
    ...(input.controlRoomOverview.controlRoomStatus === "red" ? ["Resolve red Control Room status before release."] : []),
  ]);
}

function releaseExecutionChecklist(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    "Confirm release owner is identified.",
    "Confirm deploy target and environment are intentional.",
    ...input.releaseReadiness.canaryRecommendations.map((item) => `Prepare canary: ${item}`),
    ...(input.cicdContext.deploymentTarget !== "unknown" ? [`Confirm CI/CD deployment target: ${input.cicdContext.deploymentTarget}.`] : []),
    ...(input.impactAwareIntegrity.overallImpact === "high" || input.impactAwareIntegrity.overallImpact === "critical" ? ["Confirm high-impact release communication path."] : []),
  ]);
}

function postReleaseWatchChecklist(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    ...input.runtimeIntegrity.runtimeSignalsToWatch.map((signal) => `Watch runtime signal: ${signal}`),
    ...input.runtimeIntegrity.driftIndicators.map((indicator) => `Watch drift indicator: ${indicator}`),
    ...input.evidenceAwareIntegrity.evidenceRequiredAfterRelease,
  ]);
}

function rollbackReadinessChecklist(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    ...input.releaseReadiness.rollbackRequirements,
    ...input.recoveryAwareIntegrity.recoveryDependencies.map((dependency) => `Confirm recovery dependency: ${dependency}`),
    ...input.recoveryAwareIntegrity.recoveryWarnings,
    ...(input.recoveryAwareIntegrity.rollbackFeasibility === "dangerous" || input.recoveryAwareIntegrity.rollbackFeasibility === "difficult" ? ["Review rollback feasibility with release owner before release."] : []),
  ]);
}

function requiredEvidence(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    ...input.releaseReadiness.missingReleaseEvidence,
    ...input.evidenceAwareIntegrity.evidenceRequiredBeforeRelease,
    ...input.workflowRoutingSummary.workflowEvidenceNeeds,
    ...(input.cicdContext.pipelineStatus === "failed" || input.cicdContext.pipelineStatus === "warning" ? ["CI/CD rerun evidence"] : []),
    ...((input.githubChecksContext?.failedChecks || 0) > 0 ? ["GitHub check rerun evidence"] : []),
    ...((input.githubChecksContext?.pendingChecks || 0) > 0 ? ["GitHub pending check completion evidence"] : []),
    ...((input.githubActionsContext?.failedWorkflowRuns.length || 0) > 0 || (input.githubActionsContext?.failedJobs.length || 0) > 0 ? ["GitHub Actions rerun evidence"] : []),
    ...((input.githubActionsContext?.pendingWorkflowRuns.length || 0) > 0 ? ["GitHub Actions completion evidence"] : []),
    ...((input.githubActionsContext?.cancelledWorkflowRuns.length || 0) > 0 ? ["GitHub Actions cancellation evidence"] : []),
  ]);
}

function ownerAttention(input: ReleaseWorkflowPlanInput): string[] {
  return unique([
    ...input.controlRoomOverview.humanAttentionAreas,
    ...input.runtimeIntegrity.ownerAttentionItems,
    ...(input.releaseReadiness.releaseDecision !== "ready" ? ["Release owner must acknowledge release caution or blocker state."] : []),
    ...(input.recoveryAwareIntegrity.operatorRecoveryBurden === "high" || input.recoveryAwareIntegrity.operatorRecoveryBurden === "extreme" ? ["Recovery coordinator should review operator recovery burden."] : []),
  ]);
}

function recommendedPath(status: ReleaseWorkflowStatus): string {
  if (status === "blocked") return "Do not release. Resolve blockers, attach evidence, and rerun the review.";
  if (status === "caution") return "Hold release until checklist evidence, runtime watch, and rollback readiness are confirmed.";
  if (status === "ready") return "Release can proceed through the documented checklist with evidence preserved.";
  return "No release workflow is currently active; preserve the plan as context.";
}

export function buildReleaseWorkflowPlan(input: ReleaseWorkflowPlanInput): ReleaseWorkflowPlan {
  const releaseWorkflowStatus = statusFor(input);

  return {
    releaseWorkflowStatus,
    preReleaseChecklist: preReleaseChecklist(input),
    releaseExecutionChecklist: releaseExecutionChecklist(input),
    postReleaseWatchChecklist: postReleaseWatchChecklist(input),
    rollbackReadinessChecklist: rollbackReadinessChecklist(input),
    requiredReleaseEvidence: requiredEvidence(input),
    releaseOwnerAttention: ownerAttention(input),
    recommendedReleasePath: recommendedPath(releaseWorkflowStatus),
  };
}
