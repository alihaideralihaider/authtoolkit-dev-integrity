import type { AgentAwareIntegrityResult } from "./agentAwareIntegrity.ts";
import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";

export type ControlRoomStatus = "green" | "yellow" | "orange" | "red";

export type ControlRoomOverviewInput = {
  integrityDecisionSummary: IntegrityDecisionSummaryResult;
  buildAwareIntegrity: BuildAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  agentAwareIntegrity: AgentAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
  impactAwareIntegrity: ImpactAwareIntegrityResult;
  postureAwareIntegrity: PostureAwareIntegrityResult;
};

export type ControlRoomOverviewResult = {
  controlRoomStatus: ControlRoomStatus;
  executiveSummary: string;
  decisionSnapshot: string[];
  awarenessSnapshot: string[];
  riskSnapshot: string[];
  requiredActions: string[];
  humanAttentionAreas: string[];
  driftSnapshot: string[];
  controlRoomWarnings: string[];
  recommendedControlRoomAction: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function driftValues(input: ControlRoomOverviewInput): string[] {
  return [
    input.postureAwareIntegrity.buildDrift,
    input.postureAwareIntegrity.runtimeDrift,
    input.postureAwareIntegrity.architectureDrift,
    input.postureAwareIntegrity.policyDrift,
    input.postureAwareIntegrity.evidenceDrift,
    input.postureAwareIntegrity.agentDrift,
    input.postureAwareIntegrity.recoveryDrift,
  ];
}

function statusFor(input: ControlRoomOverviewInput): ControlRoomStatus {
  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "blocked" ||
    input.integrityDecisionSummary.operationalTrustLevel === "critical-review-required" ||
    input.architectureAwareIntegrity.blastRadius === "critical" ||
    input.impactAwareIntegrity.overallImpact === "critical" ||
    input.recoveryAwareIntegrity.recoveryRisk === "critical"
  ) {
    return "red";
  }

  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "high-risk" ||
    input.policyAwareIntegrity.policyPosture === "escalation-required" ||
    input.evidenceAwareIntegrity.evidencePosture === "missing" ||
    input.runtimeIntegrity.runtimePosture === "degraded-risk" ||
    input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery"
  ) {
    return "orange";
  }

  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "caution" ||
    input.integrityDecisionSummary.overallIntegrityDecision === "trusted-with-review" ||
    input.releaseReadiness.releaseDecision === "caution" ||
    input.buildAwareIntegrity.buildPosture === "warning" ||
    input.buildAwareIntegrity.buildPosture === "failed" ||
    driftValues(input).includes("worsened")
  ) {
    return "yellow";
  }

  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "trusted" &&
    input.releaseReadiness.releaseDecision === "ready" &&
    input.runtimeIntegrity.runtimePosture === "stable" &&
    input.evidenceAwareIntegrity.evidencePosture === "sufficient"
  ) {
    return "green";
  }

  return "yellow";
}

function executiveSummary(input: ControlRoomOverviewInput, status: ControlRoomStatus): string {
  if (status === "red") {
    return `Control Room is red: ${input.integrityDecisionSummary.recommendedOperationalDecision}`;
  }
  if (status === "orange") {
    return `Control Room is orange: ${input.integrityDecisionSummary.releaseTrustSummary}`;
  }
  if (status === "yellow") {
    return `Control Room is yellow: ${input.integrityDecisionSummary.recommendedOperationalDecision}`;
  }
  return "Control Room is green: integrity posture is trusted with stable runtime and sufficient evidence.";
}

function decisionSnapshot(input: ControlRoomOverviewInput): string[] {
  return [
    `overall decision: ${input.integrityDecisionSummary.overallIntegrityDecision}`,
    `operational trust: ${input.integrityDecisionSummary.operationalTrustLevel}`,
    `PR readiness: ${input.prIntegrity.mergeReadiness}`,
    `release decision: ${input.releaseReadiness.releaseDecision}`,
    `runtime posture: ${input.runtimeIntegrity.runtimePosture}`,
  ];
}

function awarenessSnapshot(input: ControlRoomOverviewInput): string[] {
  return [
    `build: ${input.buildAwareIntegrity.buildPosture}/${input.buildAwareIntegrity.buildRisk}`,
    `architecture blast radius: ${input.architectureAwareIntegrity.blastRadius}`,
    `policy posture: ${input.policyAwareIntegrity.policyPosture}`,
    `evidence posture: ${input.evidenceAwareIntegrity.evidencePosture}`,
    `agent posture: ${input.agentAwareIntegrity.agentRiskPosture}`,
    `recovery posture: ${input.recoveryAwareIntegrity.recoveryPosture}`,
    `overall impact: ${input.impactAwareIntegrity.overallImpact}`,
  ];
}

function riskSnapshot(input: ControlRoomOverviewInput): string[] {
  return unique([
    ...input.integrityDecisionSummary.primaryRiskDrivers,
    ...input.integrityDecisionSummary.blockingFactors.map((factor) => `blocker: ${factor}`),
    ...input.impactAwareIntegrity.impactWarnings,
  ]);
}

function driftSnapshot(input: ControlRoomOverviewInput): string[] {
  return [
    `build drift: ${input.postureAwareIntegrity.buildDrift}`,
    `runtime drift: ${input.postureAwareIntegrity.runtimeDrift}`,
    `architecture drift: ${input.postureAwareIntegrity.architectureDrift}`,
    `policy drift: ${input.postureAwareIntegrity.policyDrift}`,
    `evidence drift: ${input.postureAwareIntegrity.evidenceDrift}`,
    `agent drift: ${input.postureAwareIntegrity.agentDrift}`,
    `recovery drift: ${input.postureAwareIntegrity.recoveryDrift}`,
  ];
}

function warnings(input: ControlRoomOverviewInput, status: ControlRoomStatus): string[] {
  const values: string[] = [];

  if (status === "red") values.push("Control Room status is red; do not merge or release without resolving blockers.");
  if (status === "orange") values.push("Control Room status is orange; escalation or targeted review is required.");
  if (status === "yellow") values.push("Control Room status is yellow; review evidence is required before treating this as trusted.");
  if (input.postureAwareIntegrity.escalationWarnings.length) values.push("Posture-aware escalation warnings are present.");
  if (driftValues(input).includes("worsened")) values.push("At least one awareness layer drifted worse than the previous snapshot.");
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") values.push("Evidence is not sufficient for full operational trust.");
  if (input.releaseReadiness.releaseDecision !== "ready") values.push("Release readiness is not ready.");

  return unique(values);
}

function recommendedAction(input: ControlRoomOverviewInput, status: ControlRoomStatus): string {
  if (status === "red") return "Stop and resolve blockers, attach required evidence, and rerun the review before merge or release.";
  if (status === "orange") return "Escalate to required reviewers and complete targeted validation before proceeding.";
  if (status === "yellow") return "Complete required actions and human-attention checks before treating the change as trusted.";
  return "Proceed through normal review and preserve the generated evidence timeline.";
}

export function buildControlRoomOverview(
  input: ControlRoomOverviewInput
): ControlRoomOverviewResult {
  const controlRoomStatus = statusFor(input);

  return {
    controlRoomStatus,
    executiveSummary: executiveSummary(input, controlRoomStatus),
    decisionSnapshot: decisionSnapshot(input),
    awarenessSnapshot: awarenessSnapshot(input),
    riskSnapshot: riskSnapshot(input),
    requiredActions: input.integrityDecisionSummary.requiredNextActions,
    humanAttentionAreas: input.integrityDecisionSummary.requiredHumanAttention,
    driftSnapshot: driftSnapshot(input),
    controlRoomWarnings: warnings(input, controlRoomStatus),
    recommendedControlRoomAction: recommendedAction(input, controlRoomStatus),
  };
}
