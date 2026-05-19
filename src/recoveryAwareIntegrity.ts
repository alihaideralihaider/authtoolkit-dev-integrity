import type { AgentAwareIntegrityResult } from "./agentAwareIntegrity.ts";
import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";

export type RecoveryPosture =
  | "easily-recoverable"
  | "recoverable-with-coordination"
  | "difficult-recovery"
  | "high-risk-recovery"
  | "unknown-recovery";

export type RollbackComplexity = "low" | "medium" | "high" | "critical";
export type RecoveryRisk = "low" | "medium" | "high" | "critical";
export type RollbackFeasibility = "straightforward" | "coordinated" | "difficult" | "dangerous";
export type OperatorRecoveryBurden = "low" | "medium" | "high" | "extreme";

export type RecoveryAwareIntegrityInput = {
  diffAwareIntegrity: DiffAwareIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  agentAwareIntegrity: AgentAwareIntegrityResult;
  buildAwareIntegrity: BuildAwareIntegrityResult;
};

export type RecoveryAwareIntegrityResult = {
  recoveryPosture: RecoveryPosture;
  rollbackComplexity: RollbackComplexity;
  recoveryRisk: RecoveryRisk;
  recoveryDependencies: string[];
  recoveryWarnings: string[];
  rollbackFeasibility: RollbackFeasibility;
  operatorRecoveryBurden: OperatorRecoveryBurden;
  recommendedRecoveryAction: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasBoundary(input: RecoveryAwareIntegrityInput, boundary: string): boolean {
  return input.architectureAwareIntegrity.affectedBoundaries.includes(boundary as never);
}

function hasFinding(input: RecoveryAwareIntegrityInput, pattern: RegExp): boolean {
  return input.diffAwareIntegrity.diffFindings.some((finding) =>
    pattern.test(finding.findingName) || pattern.test(finding.signalType) || pattern.test(finding.reason)
  );
}

function isHighRiskRecovery(input: RecoveryAwareIntegrityInput): boolean {
  const criticalBlastRadius = input.architectureAwareIntegrity.blastRadius === "critical";
  const paymentTrustBoundary = hasBoundary(input, "payment trust boundary");
  const serviceRoleSecurityFinding = hasFinding(input, /service-role|auth-security/i)
    && input.diffAwareIntegrity.diffFindings.some((finding) => finding.severity === "high" || finding.severity === "critical");
  const runtimeVaultReleaseCaution = hasBoundary(input, "runtime/deployment boundary")
    && hasBoundary(input, "secret/config boundary")
    && input.releaseReadiness.releaseDecision === "caution";

  return criticalBlastRadius
    || paymentTrustBoundary
    || serviceRoleSecurityFinding
    || runtimeVaultReleaseCaution
    || input.policyAwareIntegrity.policyPosture === "policy-blocked"
    || input.buildAwareIntegrity.buildRisk === "critical"
    || input.runtimeIntegrity.runtimePosture === "rollback-watch";
}

function isDifficultRecovery(input: RecoveryAwareIntegrityInput): boolean {
  return hasBoundary(input, "runtime/deployment boundary")
    || hasFinding(input, /payment-state|webhook|idempotency/i)
    || input.buildAwareIntegrity.buildPosture === "failed"
    || input.evidenceAwareIntegrity.evidencePosture === "missing"
    || input.evidenceAwareIntegrity.evidencePosture === "blocking-gap"
    || input.architectureAwareIntegrity.architectureWarnings.length > 0;
}

function isCoordinatedRecovery(input: RecoveryAwareIntegrityInput): boolean {
  const sensitiveSystems = input.architectureAwareIntegrity.affectedSystems.filter((system) =>
    ["api", "auth", "admin", "payment", "messaging", "runtime", "vault", "database", "ordering", "release"].includes(system)
  );

  return sensitiveSystems.length > 1
    || input.runtimeIntegrity.runtimePosture !== "stable"
    || input.releaseReadiness.releaseDecision === "caution"
    || input.policyAwareIntegrity.policyPosture === "escalation-required";
}

function recoveryPosture(input: RecoveryAwareIntegrityInput): RecoveryPosture {
  if (isHighRiskRecovery(input)) return "high-risk-recovery";
  if (isDifficultRecovery(input)) return "difficult-recovery";
  if (isCoordinatedRecovery(input)) return "recoverable-with-coordination";
  if (
    input.architectureAwareIntegrity.blastRadius === "limited"
    && !input.architectureAwareIntegrity.affectedBoundaries.length
    && input.releaseReadiness.releaseDecision === "ready"
    && input.runtimeIntegrity.runtimePosture === "stable"
  ) {
    return "easily-recoverable";
  }
  return "unknown-recovery";
}

function dependencies(input: RecoveryAwareIntegrityInput): string[] {
  const values: string[] = [];

  if (hasBoundary(input, "payment trust boundary") || hasFinding(input, /payment|checkout/i)) values.push("payment provider state");
  if (hasBoundary(input, "provider webhook boundary") || hasFinding(input, /webhook|idempotency/i)) values.push("webhook replay safety");
  if (hasBoundary(input, "runtime/deployment boundary")) values.push("runtime bindings");
  if (hasBoundary(input, "secret/config boundary")) values.push("env/config restoration");
  if (input.releaseReadiness.rollbackRequirements.length || input.releaseReadiness.releaseDecision !== "ready") values.push("deploy rollback path");
  if (input.buildAwareIntegrity.buildPosture !== "passed") values.push("build/test rerun path");
  if (hasBoundary(input, "tenant/data boundary")) values.push("tenant/data consistency");
  if (hasBoundary(input, "customer communication boundary")) values.push("customer messaging state");
  if (input.architectureAwareIntegrity.affectedSystems.includes("admin") || input.runtimeIntegrity.runtimeSignalsToWatch.some((signal) => /admin/i.test(signal))) {
    values.push("admin/runtime access");
  }

  return unique(values);
}

function warnings(input: RecoveryAwareIntegrityInput): string[] {
  const values: string[] = [];

  if (hasBoundary(input, "payment trust boundary") || hasFinding(input, /payment-state|payment/i)) values.push("Payment state reconciliation may be required.");
  if (hasBoundary(input, "runtime/deployment boundary") && hasBoundary(input, "secret/config boundary")) values.push("Runtime and Vault rollback coordination may be required.");
  if (hasFinding(input, /service-role/i)) values.push("Service-role rollback requires security review.");
  if (hasFinding(input, /webhook|idempotency/i)) values.push("Webhook replay/idempotency verification required.");
  if (hasBoundary(input, "customer communication boundary")) values.push("Customer communication state may drift during rollback.");
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") values.push("Rollback evidence is incomplete.");
  if (input.buildAwareIntegrity.buildPosture === "failed") values.push("Failed build must be rerun before recovery confidence improves.");
  if (input.agentAwareIntegrity.agentRiskPosture !== "human-likely" && input.agentAwareIntegrity.agentRiskPosture !== "unknown-authorship") {
    values.push("Agent or automation signal increases recovery review expectations.");
  }

  return unique(values);
}

function ratings(posture: RecoveryPosture): {
  rollbackComplexity: RollbackComplexity;
  recoveryRisk: RecoveryRisk;
  rollbackFeasibility: RollbackFeasibility;
  operatorRecoveryBurden: OperatorRecoveryBurden;
} {
  if (posture === "high-risk-recovery") {
    return {
      rollbackComplexity: "critical",
      recoveryRisk: "critical",
      rollbackFeasibility: "dangerous",
      operatorRecoveryBurden: "extreme",
    };
  }
  if (posture === "difficult-recovery") {
    return {
      rollbackComplexity: "high",
      recoveryRisk: "high",
      rollbackFeasibility: "difficult",
      operatorRecoveryBurden: "high",
    };
  }
  if (posture === "recoverable-with-coordination") {
    return {
      rollbackComplexity: "medium",
      recoveryRisk: "medium",
      rollbackFeasibility: "coordinated",
      operatorRecoveryBurden: "medium",
    };
  }
  if (posture === "easily-recoverable") {
    return {
      rollbackComplexity: "low",
      recoveryRisk: "low",
      rollbackFeasibility: "straightforward",
      operatorRecoveryBurden: "low",
    };
  }
  return {
    rollbackComplexity: "medium",
    recoveryRisk: "medium",
    rollbackFeasibility: "coordinated",
    operatorRecoveryBurden: "medium",
  };
}

function action(posture: RecoveryPosture, input: RecoveryAwareIntegrityInput): string {
  if (posture === "high-risk-recovery") {
    if (hasBoundary(input, "payment trust boundary")) return "Require payment reconciliation plan and independent recovery review before release.";
    if (hasBoundary(input, "runtime/deployment boundary") && hasBoundary(input, "secret/config boundary")) return "Require runtime binding restoration checklist and reduce blast radius before release.";
    return "Reduce blast radius before release and validate rollback path with independent recovery review.";
  }
  if (posture === "difficult-recovery") {
    return "Validate rollback path before release and require staged/canary rollout before broad deployment.";
  }
  if (posture === "recoverable-with-coordination") {
    return "Coordinate owner, runtime, and release checks before release and preserve recovery evidence.";
  }
  if (posture === "easily-recoverable") {
    return "Proceed with normal rollback notes and standard review evidence.";
  }
  return "Clarify rollback path, owner, and runtime dependencies before release.";
}

export function evaluateRecoveryAwareIntegrity(
  input: RecoveryAwareIntegrityInput
): RecoveryAwareIntegrityResult {
  const posture = recoveryPosture(input);
  const rating = ratings(posture);

  return {
    recoveryPosture: posture,
    rollbackComplexity: rating.rollbackComplexity,
    recoveryRisk: rating.recoveryRisk,
    recoveryDependencies: dependencies(input),
    recoveryWarnings: warnings(input),
    rollbackFeasibility: rating.rollbackFeasibility,
    operatorRecoveryBurden: rating.operatorRecoveryBurden,
    recommendedRecoveryAction: action(posture, input),
  };
}
