import type { AgentAwareIntegrityResult } from "./agentAwareIntegrity.ts";
import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";

export type OverallIntegrityDecision = "trusted" | "trusted-with-review" | "caution" | "high-risk" | "blocked";
export type OperationalTrustLevel = "low" | "guarded" | "moderate" | "strong" | "critical-review-required";

export type IntegrityDecisionSummaryInput = {
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

export type IntegrityDecisionSummaryResult = {
  overallIntegrityDecision: OverallIntegrityDecision;
  operationalTrustLevel: OperationalTrustLevel;
  primaryRiskDrivers: string[];
  blockingFactors: string[];
  requiredNextActions: string[];
  requiredHumanAttention: string[];
  releaseTrustSummary: string;
  recoveryTrustSummary: string;
  recommendedOperationalDecision: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasCriticalDiff(input: IntegrityDecisionSummaryInput): boolean {
  return input.policyAwareIntegrity.policyViolations.some((violation) => /critical diff-aware/i.test(violation));
}

function blockingFactors(input: IntegrityDecisionSummaryInput): string[] {
  const factors: string[] = [];

  if (input.policyAwareIntegrity.policyPosture === "policy-blocked") factors.push("policy posture is blocked");
  if (input.releaseReadiness.releaseDecision === "blocked") factors.push("release readiness is blocked");
  if (input.prIntegrity.mergeReadiness === "blocked") factors.push("PR integrity is blocked");
  if (input.buildAwareIntegrity.buildRisk === "critical") factors.push("critical build issue");
  if (input.architectureAwareIntegrity.blastRadius === "critical" && input.evidenceAwareIntegrity.evidencePosture !== "sufficient") {
    factors.push("critical blast radius lacks sufficient evidence");
  }
  if (input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery") factors.push("critical recovery posture");

  return unique(factors);
}

function primaryRiskDrivers(input: IntegrityDecisionSummaryInput): string[] {
  const drivers: string[] = [];

  if (input.architectureAwareIntegrity.blastRadius === "critical") drivers.push("critical blast radius");
  if (input.architectureAwareIntegrity.blastRadius === "broad") drivers.push("broad architecture blast radius");
  if (input.buildAwareIntegrity.buildPosture === "failed") drivers.push(`failed build/${input.buildAwareIntegrity.failedStage}`);
  if (input.buildAwareIntegrity.buildRisk === "critical") drivers.push("critical build issue");
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("payment trust boundary")) drivers.push("payment trust boundary");
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("runtime/deployment boundary") && input.architectureAwareIntegrity.affectedBoundaries.includes("secret/config boundary")) {
    drivers.push("runtime/Vault coupling");
  }
  if (input.releaseReadiness.missingReleaseEvidence.some((item) => /rollback/i.test(item))) drivers.push("missing rollback evidence");
  if (input.policyAwareIntegrity.policyViolations.some((violation) => /service-role/i.test(violation))) drivers.push("service-role diff finding");
  if (input.runtimeIntegrity.runtimePosture === "degraded-risk") drivers.push("runtime degraded-risk");
  if (input.runtimeIntegrity.runtimePosture === "rollback-watch") drivers.push("runtime rollback-watch");
  if (input.policyAwareIntegrity.policyPosture === "escalation-required") drivers.push("policy escalation");
  if (input.agentAwareIntegrity.agentRiskPosture !== "human-likely" && input.agentAwareIntegrity.agentReviewRequirements.length) {
    drivers.push("agent/automation-sensitive change");
  }
  if (input.impactAwareIntegrity.overallImpact === "critical") drivers.push("critical operational impact");
  if (input.recoveryAwareIntegrity.recoveryRisk === "critical") drivers.push("critical recovery risk");
  if (hasCriticalDiff(input)) drivers.push("critical diff-aware finding");

  return unique(drivers);
}

function decisionFor(input: IntegrityDecisionSummaryInput, blockers: string[]): OverallIntegrityDecision {
  if (blockers.length) return "blocked";
  if (
    input.impactAwareIntegrity.overallImpact === "critical" ||
    input.recoveryAwareIntegrity.recoveryRisk === "critical" ||
    input.policyAwareIntegrity.policyPosture === "escalation-required" ||
    input.runtimeIntegrity.runtimePosture === "rollback-watch" ||
    hasCriticalDiff(input)
  ) {
    return "high-risk";
  }
  if (
    input.releaseReadiness.releaseDecision === "caution" ||
    input.buildAwareIntegrity.buildPosture === "failed" ||
    input.buildAwareIntegrity.buildPosture === "warning" ||
    input.evidenceAwareIntegrity.evidencePosture === "missing" ||
    input.evidenceAwareIntegrity.evidencePosture === "weak" ||
    input.architectureAwareIntegrity.blastRadius === "broad" ||
    input.architectureAwareIntegrity.blastRadius === "critical" ||
    input.runtimeIntegrity.runtimePosture === "degraded-risk"
  ) {
    return "caution";
  }
  if (
    input.policyAwareIntegrity.policyPosture === "review-required" ||
    input.impactAwareIntegrity.overallImpact === "medium" ||
    input.impactAwareIntegrity.overallImpact === "high" ||
    input.recoveryAwareIntegrity.recoveryRisk === "medium" ||
    input.recoveryAwareIntegrity.recoveryRisk === "high" ||
    (input.agentAwareIntegrity.agentRiskPosture !== "human-likely" && input.agentAwareIntegrity.agentRiskPosture !== "unknown-authorship")
  ) {
    return "trusted-with-review";
  }
  if (
    input.releaseReadiness.releaseDecision === "ready" &&
    input.evidenceAwareIntegrity.evidencePosture === "sufficient" &&
    input.runtimeIntegrity.runtimePosture === "stable" &&
    input.policyAwareIntegrity.policyPosture === "compliant"
  ) {
    return "trusted";
  }
  return "trusted-with-review";
}

function trustLevel(decision: OverallIntegrityDecision): OperationalTrustLevel {
  if (decision === "blocked") return "critical-review-required";
  if (decision === "high-risk") return "low";
  if (decision === "caution") return "guarded";
  if (decision === "trusted-with-review") return "moderate";
  return "strong";
}

function requiredNextActions(input: IntegrityDecisionSummaryInput): string[] {
  const actions: string[] = [];

  if (input.buildAwareIntegrity.buildPosture !== "passed") actions.push("attach passing build evidence");
  if (input.releaseReadiness.missingReleaseEvidence.some((item) => /rollback/i.test(item)) || input.recoveryAwareIntegrity.recoveryWarnings.length) {
    actions.push("attach rollback evidence");
  }
  if (input.architectureAwareIntegrity.blastRadius === "broad" || input.architectureAwareIntegrity.blastRadius === "critical") actions.push("require architecture review");
  if (input.policyAwareIntegrity.requiredApprovals.includes("security review")) actions.push("require security review");
  if (input.policyAwareIntegrity.requiredApprovals.includes("payment review")) actions.push("require payment review");
  if (input.architectureAwareIntegrity.blastRadius === "critical") actions.push("reduce blast radius");
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("runtime/deployment boundary")) actions.push("validate runtime bindings");
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("provider webhook boundary") || input.architectureAwareIntegrity.affectedBoundaries.includes("payment trust boundary")) {
    actions.push("verify idempotency/webhook replay safety");
  }
  if (input.policyAwareIntegrity.requiredApprovals.includes("owner approval") || input.impactAwareIntegrity.ownerOperatorImpact === "critical") actions.push("confirm owner approval");
  if (input.evidenceAwareIntegrity.evidenceRequiredBeforeMerge.length) actions.push("attach merge review evidence");
  if (input.evidenceAwareIntegrity.evidenceRequiredBeforeRelease.length) actions.push("attach release evidence");

  return unique(actions);
}

function requiredHumanAttention(input: IntegrityDecisionSummaryInput): string[] {
  const areas: string[] = [];

  if (input.impactAwareIntegrity.paymentImpact === "high" || input.impactAwareIntegrity.paymentImpact === "critical") areas.push("payment systems");
  if (input.impactAwareIntegrity.customerImpact === "high" || input.impactAwareIntegrity.customerImpact === "critical") areas.push("customer-facing flows");
  if (input.impactAwareIntegrity.runtimeImpact === "high" || input.impactAwareIntegrity.runtimeImpact === "critical") areas.push("runtime/deployment");
  if (input.impactAwareIntegrity.adminImpact === "high" || input.impactAwareIntegrity.adminImpact === "critical") areas.push("admin/security boundaries");
  if (input.impactAwareIntegrity.dataImpact === "high" || input.impactAwareIntegrity.dataImpact === "critical") areas.push("tenant/data boundaries");
  if (input.recoveryAwareIntegrity.recoveryRisk === "high" || input.recoveryAwareIntegrity.recoveryRisk === "critical") areas.push("recovery coordination");
  if (input.policyAwareIntegrity.policyPosture === "escalation-required" || input.policyAwareIntegrity.policyPosture === "policy-blocked") areas.push("policy escalation review");
  if (input.agentAwareIntegrity.agentReviewRequirements.length) areas.push("independent human review");

  return unique(areas);
}

function releaseTrustSummary(input: IntegrityDecisionSummaryInput): string {
  if (input.releaseReadiness.releaseDecision === "blocked") return "Release trust is blocked pending required review and release evidence.";
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("payment trust boundary") && input.releaseReadiness.missingReleaseEvidence.length) {
    return "Release trust is blocked pending rollback and payment review evidence.";
  }
  if (input.architectureAwareIntegrity.affectedBoundaries.includes("runtime/deployment boundary") && input.architectureAwareIntegrity.affectedBoundaries.includes("secret/config boundary")) {
    return "Release trust is guarded due to runtime and Vault coupling.";
  }
  if (input.releaseReadiness.releaseDecision === "caution") return "Release trust is guarded until caution items and evidence gaps are cleared.";
  if (input.releaseReadiness.releaseDecision === "ready") return "Release trust is moderate with standard review requirements.";
  return "Release trust requires review because release posture is unclear.";
}

function recoveryTrustSummary(input: IntegrityDecisionSummaryInput): string {
  if (input.recoveryAwareIntegrity.rollbackFeasibility === "dangerous") return "Recovery trust is low due to dangerous rollback feasibility.";
  if (input.recoveryAwareIntegrity.recoveryDependencies.some((item) => /runtime|payment/i.test(item))) {
    return "Recovery trust requires coordinated runtime and payment recovery.";
  }
  if (input.recoveryAwareIntegrity.rollbackFeasibility === "straightforward") return "Recovery trust is straightforward with limited blast radius.";
  if (input.recoveryAwareIntegrity.rollbackFeasibility === "difficult") return "Recovery trust is guarded because rollback may be difficult.";
  return "Recovery trust requires coordinated owner and runtime evidence.";
}

function operationalDecision(decision: OverallIntegrityDecision): string {
  if (decision === "blocked") return "Do not merge or release until blockers are resolved and evidence is attached.";
  if (decision === "high-risk") return "Escalate to the required human reviewers before merge or release.";
  if (decision === "caution") return "Proceed only after the listed review, build, release, and recovery evidence is attached.";
  if (decision === "trusted-with-review") return "Proceed after targeted review evidence is attached and impacted areas are checked.";
  return "Proceed through normal review and preserve the generated evidence timeline.";
}

export function evaluateIntegrityDecisionSummary(
  input: IntegrityDecisionSummaryInput
): IntegrityDecisionSummaryResult {
  const blockers = blockingFactors(input);
  const overallIntegrityDecision = decisionFor(input, blockers);

  return {
    overallIntegrityDecision,
    operationalTrustLevel: trustLevel(overallIntegrityDecision),
    primaryRiskDrivers: primaryRiskDrivers(input),
    blockingFactors: blockers,
    requiredNextActions: requiredNextActions(input),
    requiredHumanAttention: requiredHumanAttention(input),
    releaseTrustSummary: releaseTrustSummary(input),
    recoveryTrustSummary: recoveryTrustSummary(input),
    recommendedOperationalDecision: operationalDecision(overallIntegrityDecision),
  };
}
