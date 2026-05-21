import type { CicdContext } from "./cicdContext.ts";
import type { ControlRoomOverviewResult } from "./controlRoomOverview.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { GitHubActionsContext } from "./githubActionsContext.ts";
import type { GitHubChecksContext } from "./githubChecksContext.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseGateDecision } from "./releaseGateDecision.ts";
import type { ReleaseSignals } from "./releaseSignals.ts";
import type { ReleaseWorkflowPlan } from "./releaseWorkflowPlan.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { WorkflowRoutingSummaryResult } from "./workflowRoutingSummary.ts";

export type ReleaseGateConfidenceBand = "very-low" | "low" | "medium" | "high" | "very-high";

export type ReleaseGateScoringInput = {
  releaseGateDecision: Pick<ReleaseGateDecision, "releaseGateDecision" | "releaseGateBlockers" | "releaseGateWarnings" | "requiredGateEvidence">;
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
  runtimeIntegrity: RuntimeIntegrityResult;
  impactAwareIntegrity: ImpactAwareIntegrityResult;
};

export type ReleaseGateScoring = {
  releaseGateScore: number;
  releaseGateConfidenceBand: ReleaseGateConfidenceBand;
  positiveScoreContributors: string[];
  negativeScoreContributors: string[];
  scoringWarnings: string[];
  scoringSummary: string;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function bandFor(score: number): ReleaseGateConfidenceBand {
  if (score <= 20) return "very-low";
  if (score <= 40) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "very-high";
}

function addPositive(contributors: string[], label: string, amount: number): number {
  contributors.push(`${label}: +${amount}`);
  return amount;
}

function addNegative(contributors: string[], label: string, amount: number): number {
  contributors.push(`${label}: -${amount}`);
  return amount;
}

function scoringSummary(input: ReleaseGateScoringInput, score: number, band: ReleaseGateConfidenceBand): string {
  if (score <= 40) {
    return "Release confidence is low because blockers, recovery risk, and missing evidence outweigh successful workflow signals.";
  }
  if (score <= 60) {
    return "Release confidence is medium because release risks or missing evidence still require human review.";
  }
  if (score <= 80) {
    return "Release confidence is high, but warning signals or review requirements still need release owner attention.";
  }
  if (band === "very-high") {
    return "Release confidence is very high because runtime, release, evidence, and workflow signals are healthy.";
  }
  return `Release confidence band is ${band} based on deterministic release gate scoring.`;
}

export function evaluateReleaseGateScoring(input: ReleaseGateScoringInput): ReleaseGateScoring {
  const positiveScoreContributors: string[] = [];
  const negativeScoreContributors: string[] = [];
  const scoringWarnings: string[] = [];
  let score = 100;

  if (input.controlRoomOverview.controlRoomStatus === "red") score -= addNegative(negativeScoreContributors, "Control Room red", 30);
  if (input.integrityDecisionSummary.overallIntegrityDecision === "blocked") score -= addNegative(negativeScoreContributors, "Integrity decision blocked", 25);
  if (input.releaseWorkflowPlan.releaseWorkflowStatus === "blocked") score -= addNegative(negativeScoreContributors, "Release workflow blocked", 20);
  if (input.recoveryAwareIntegrity.recoveryRisk === "critical") score -= addNegative(negativeScoreContributors, "Recovery risk critical", 20);

  const failedCheckDeduction = Math.min(input.githubChecksContext.failedChecks * 10, 25);
  if (failedCheckDeduction) score -= addNegative(negativeScoreContributors, `Failed GitHub checks (${input.githubChecksContext.failedChecks})`, failedCheckDeduction);
  const pendingCheckDeduction = Math.min(input.githubChecksContext.pendingChecks * 4, 12);
  if (pendingCheckDeduction) score -= addNegative(negativeScoreContributors, `Pending GitHub checks (${input.githubChecksContext.pendingChecks})`, pendingCheckDeduction);

  const failedRunDeduction = Math.min(input.githubActionsContext.failedWorkflowRuns.length * 8, 20);
  if (failedRunDeduction) score -= addNegative(negativeScoreContributors, `Failed GitHub Actions workflow runs (${input.githubActionsContext.failedWorkflowRuns.length})`, failedRunDeduction);
  const failedJobDeduction = Math.min(input.githubActionsContext.failedJobs.length * 4, 20);
  if (failedJobDeduction) score -= addNegative(negativeScoreContributors, `Failed GitHub Actions jobs (${input.githubActionsContext.failedJobs.length})`, failedJobDeduction);
  const pendingRunDeduction = Math.min(input.githubActionsContext.pendingWorkflowRuns.length * 3, 12);
  if (pendingRunDeduction) score -= addNegative(negativeScoreContributors, `Pending GitHub Actions workflows (${input.githubActionsContext.pendingWorkflowRuns.length})`, pendingRunDeduction);
  const cancelledRunDeduction = Math.min(input.githubActionsContext.cancelledWorkflowRuns.length * 5, 10);
  if (cancelledRunDeduction) score -= addNegative(negativeScoreContributors, `Cancelled GitHub Actions workflows (${input.githubActionsContext.cancelledWorkflowRuns.length})`, cancelledRunDeduction);

  if (input.releaseSignals.signalConclusion === "failure") score -= addNegative(negativeScoreContributors, "Release signal failure", 15);
  if (["cancelled", "skipped"].includes(input.releaseSignals.signalConclusion)) score -= addNegative(negativeScoreContributors, "Cancelled/skipped release signal", 8);

  if (input.cicdContext.pipelineStatus === "failed") score -= addNegative(negativeScoreContributors, "Failed CI/CD", 12);
  if (input.cicdContext.pipelineStatus === "warning") score -= addNegative(negativeScoreContributors, "Warning CI/CD", 6);
  if (["cancelled", "skipped"].includes(input.cicdContext.pipelineStatus)) score -= addNegative(negativeScoreContributors, "Cancelled/skipped CI/CD", 8);

  if (["missing", "blocking-gap"].includes(input.evidenceAwareIntegrity.evidencePosture)) score -= addNegative(negativeScoreContributors, `Evidence posture ${input.evidenceAwareIntegrity.evidencePosture}`, 15);
  const evidenceGapDeduction = Math.min(input.evidenceAwareIntegrity.evidenceGaps.length * 3, 15);
  if (evidenceGapDeduction) score -= addNegative(negativeScoreContributors, `Evidence gaps (${input.evidenceAwareIntegrity.evidenceGaps.length})`, evidenceGapDeduction);

  if (input.runtimeIntegrity.runtimePosture !== "stable") score -= addNegative(negativeScoreContributors, `Runtime posture ${input.runtimeIntegrity.runtimePosture}`, 10);
  if (input.runtimeIntegrity.runtimePosture === "degraded-risk") score -= addNegative(negativeScoreContributors, "Runtime degraded", 5);

  if (input.impactAwareIntegrity.overallImpact === "critical") score -= addNegative(negativeScoreContributors, "Impact critical", 12);
  if (input.impactAwareIntegrity.overallImpact === "high") score -= addNegative(negativeScoreContributors, "Impact high", 6);

  if (input.releaseSignals.signalConclusion === "success") score += addPositive(positiveScoreContributors, "Release signal success", 5);
  if (input.runtimeIntegrity.runtimePosture === "stable") score += addPositive(positiveScoreContributors, "Runtime stable", 5);
  if (input.evidenceAwareIntegrity.evidencePosture === "sufficient") score += addPositive(positiveScoreContributors, "Evidence sufficient", 5);
  if (input.releaseWorkflowPlan.releaseWorkflowStatus === "ready") score += addPositive(positiveScoreContributors, "Release workflow ready", 5);
  if (input.integrityDecisionSummary.overallIntegrityDecision === "trusted") score += addPositive(positiveScoreContributors, "Trusted integrity decision", 5);
  if (input.githubChecksContext.failedChecks === 0) score += addPositive(positiveScoreContributors, "No failed GitHub checks", 3);
  if (input.githubActionsContext.failedWorkflowRuns.length === 0 && input.githubActionsContext.failedJobs.length === 0) {
    score += addPositive(positiveScoreContributors, "No failed GitHub Actions runs/jobs", 3);
  }

  const releaseGateScore = clamp(score);
  const releaseGateConfidenceBand = bandFor(releaseGateScore);

  if (input.releaseGateDecision.releaseGateDecision === "pass" && releaseGateScore < 81) {
    scoringWarnings.push("Pass decision has less than very-high scoring confidence; review scoring contributors before release.");
  }
  if (input.releaseGateDecision.releaseGateDecision === "block" && positiveScoreContributors.length) {
    scoringWarnings.push("Positive workflow signals exist but do not override release blockers.");
  }

  return {
    releaseGateScore,
    releaseGateConfidenceBand,
    positiveScoreContributors,
    negativeScoreContributors,
    scoringWarnings,
    scoringSummary: scoringSummary(input, releaseGateScore, releaseGateConfidenceBand),
  };
}
