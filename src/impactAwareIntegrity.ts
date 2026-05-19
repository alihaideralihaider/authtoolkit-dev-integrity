import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";

export type ImpactLevel = "none" | "low" | "medium" | "high" | "critical";

export type ImpactAwareIntegrityInput = {
  buildAwareIntegrity: BuildAwareIntegrityResult;
  diffAwareIntegrity: DiffAwareIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
};

export type ImpactAwareIntegrityResult = {
  customerImpact: ImpactLevel;
  adminImpact: ImpactLevel;
  paymentImpact: ImpactLevel;
  runtimeImpact: ImpactLevel;
  dataImpact: ImpactLevel;
  complianceImpact: ImpactLevel;
  ownerOperatorImpact: ImpactLevel;
  overallImpact: ImpactLevel;
  impactWarnings: string[];
  recommendedImpactAction: string;
};

const impactRank: Record<ImpactLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function maxImpact(...levels: ImpactLevel[]): ImpactLevel {
  return levels.reduce<ImpactLevel>((highest, level) => (
    impactRank[level] > impactRank[highest] ? level : highest
  ), "none");
}

function hasPack(input: ImpactAwareIntegrityInput, pack: string): boolean {
  return input.releaseReadiness.requiredReleaseChecks.some((check) => check.toLowerCase().includes(pack))
    || input.runtimeIntegrity.runtimeSignalsToWatch.some((signal) => signal.toLowerCase().includes(pack))
    || input.policyAwareIntegrity.requiredApprovals.some((approval) => approval.toLowerCase().includes(pack));
}

function hasBoundary(input: ImpactAwareIntegrityInput, boundary: string): boolean {
  return input.architectureAwareIntegrity.affectedBoundaries.includes(boundary as never);
}

function hasSystem(input: ImpactAwareIntegrityInput, system: string): boolean {
  return input.architectureAwareIntegrity.affectedSystems.includes(system as never);
}

function hasDiffSignal(input: ImpactAwareIntegrityInput, pattern: RegExp): boolean {
  return input.diffAwareIntegrity.diffFindings.some((finding) =>
    pattern.test(finding.findingName) || pattern.test(finding.signalType) || pattern.test(finding.reason)
  ) || input.diffAwareIntegrity.diffRiskSignals.some((signal) => pattern.test(signal));
}

function paymentImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (input.architectureAwareIntegrity.blastRadius === "critical" && hasBoundary(input, "payment trust boundary")) return "critical";
  if (hasBoundary(input, "payment trust boundary") || hasSystem(input, "payment") || hasPack(input, "payment")) return "high";
  if (hasDiffSignal(input, /checkout|payment|stripe|billing/i)) return "medium";
  return "none";
}

function complianceImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (hasBoundary(input, "customer communication boundary") || hasSystem(input, "messaging") || hasPack(input, "sms")) return "high";
  if (hasDiffSignal(input, /twilio|sms|whatsapp|consent|stop|help|voice/i)) return "medium";
  return "none";
}

function runtimeImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (input.runtimeIntegrity.runtimeRisk === "critical" || input.buildAwareIntegrity.buildRisk === "critical") return "critical";
  if (input.buildAwareIntegrity.buildPosture === "failed") return "high";
  if (hasBoundary(input, "runtime/deployment boundary") || hasSystem(input, "runtime") || input.runtimeIntegrity.runtimePosture === "degraded-risk") return "high";
  if (input.buildAwareIntegrity.buildPosture === "warning" || input.runtimeIntegrity.runtimePosture === "watch") return "medium";
  return "none";
}

function dataImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (input.architectureAwareIntegrity.blastRadius === "critical" && hasBoundary(input, "tenant/data boundary")) return "critical";
  if (hasBoundary(input, "tenant/data boundary") || hasSystem(input, "database")) return "high";
  if (hasDiffSignal(input, /supabase|database|migration|service-role|service_role|rls|tenant/i)) return "medium";
  return "none";
}

function adminImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (hasBoundary(input, "admin boundary") || hasSystem(input, "admin")) return "high";
  if (hasDiffSignal(input, /admin|authorization|auth|session/i)) return "medium";
  return "none";
}

function customerImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  const directCustomer = hasSystem(input, "ux") || hasSystem(input, "ordering") || hasBoundary(input, "public-to-private boundary");
  if (input.architectureAwareIntegrity.blastRadius === "critical" && directCustomer) return "critical";
  if (paymentImpact(input) === "critical" || runtimeImpact(input) === "critical") return "high";
  if (directCustomer || paymentImpact(input) === "high" || complianceImpact(input) === "high") return "high";
  if (hasDiffSignal(input, /checkout|storefront|menu|page|component|customer/i)) return "medium";
  return "none";
}

function ownerOperatorImpact(input: ImpactAwareIntegrityInput): ImpactLevel {
  if (input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery") return "critical";
  if (input.policyAwareIntegrity.policyPosture === "policy-blocked") return "critical";
  if (input.evidenceAwareIntegrity.evidencePosture === "blocking-gap") return "high";
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient" && input.releaseReadiness.releaseDecision === "caution") return "high";
  if (input.recoveryAwareIntegrity.operatorRecoveryBurden === "high") return "high";
  if (input.recoveryAwareIntegrity.operatorRecoveryBurden === "medium" || input.releaseReadiness.releaseDecision !== "ready") return "medium";
  return "low";
}

function warnings(input: ImpactAwareIntegrityInput, impacts: Omit<ImpactAwareIntegrityResult, "impactWarnings" | "recommendedImpactAction">): string[] {
  const values: string[] = [];

  if (impacts.overallImpact === "critical") values.push("A failed change could create critical operational impact.");
  if (impacts.customerImpact === "high" || impacts.customerImpact === "critical") values.push("Customer-facing flows may be affected if this change fails.");
  if (impacts.adminImpact === "high" || impacts.adminImpact === "critical") values.push("Admin workflows or privileged access may be affected.");
  if (impacts.paymentImpact === "high" || impacts.paymentImpact === "critical") values.push("Payment or checkout state may be affected.");
  if (impacts.runtimeImpact === "high" || impacts.runtimeImpact === "critical") values.push("Runtime availability or deployment behavior may be affected.");
  if (impacts.dataImpact === "high" || impacts.dataImpact === "critical") values.push("Tenant, customer, or database access impact may exist.");
  if (impacts.complianceImpact === "high" || impacts.complianceImpact === "critical") values.push("Customer communication or compliance behavior may be affected.");
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") values.push("Impact confidence is limited until missing evidence is attached.");
  if (input.recoveryAwareIntegrity.recoveryRisk === "high" || input.recoveryAwareIntegrity.recoveryRisk === "critical") values.push("Recovery burden may be significant if this change fails.");

  return unique(values);
}

function recommendedAction(overallImpact: ImpactLevel): string {
  if (overallImpact === "critical") {
    return "Treat this as critical operational impact; require owner review, rollback readiness, and targeted validation before merge or release.";
  }
  if (overallImpact === "high") {
    return "Run targeted review for the impacted audience and attach validation evidence before release.";
  }
  if (overallImpact === "medium") {
    return "Confirm affected flows and preserve build/review evidence before release.";
  }
  if (overallImpact === "low") {
    return "Proceed with normal review while preserving baseline evidence.";
  }
  return "No direct operational impact was detected by v1 deterministic rules.";
}

export function evaluateImpactAwareIntegrity(
  input: ImpactAwareIntegrityInput
): ImpactAwareIntegrityResult {
  const impacts = {
    customerImpact: customerImpact(input),
    adminImpact: adminImpact(input),
    paymentImpact: paymentImpact(input),
    runtimeImpact: runtimeImpact(input),
    dataImpact: dataImpact(input),
    complianceImpact: complianceImpact(input),
    ownerOperatorImpact: ownerOperatorImpact(input),
  };
  const overallImpact = input.architectureAwareIntegrity.blastRadius === "critical"
    ? "critical"
    : maxImpact(
      impacts.customerImpact,
      impacts.adminImpact,
      impacts.paymentImpact,
      impacts.runtimeImpact,
      impacts.dataImpact,
      impacts.complianceImpact,
      impacts.ownerOperatorImpact
    );

  return {
    ...impacts,
    overallImpact,
    impactWarnings: warnings(input, { ...impacts, overallImpact }),
    recommendedImpactAction: recommendedAction(overallImpact),
  };
}
