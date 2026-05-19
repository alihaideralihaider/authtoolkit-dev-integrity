import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { RiskCategory } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type PolicyPosture =
  | "compliant"
  | "review-required"
  | "escalation-required"
  | "policy-blocked";

export type TriggeredPolicy = {
  name: string;
  result: PolicyPosture;
  reason: string;
};

export type PolicyAwareIntegrityInput = {
  riskCategories: RiskCategory[];
  suggestedReviewPacks: ReviewPack[];
  riskCombinations: RiskCombination[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  postureAwareIntegrity: PostureAwareIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
};

export type PolicyAwareIntegrityResult = {
  triggeredPolicies: TriggeredPolicy[];
  policyViolations: string[];
  policyEscalations: string[];
  requiredApprovals: string[];
  governanceWarnings: string[];
  policyReviewNotes: string[];
  policyPosture: PolicyPosture;
  recommendedPolicyAction: string;
};

const postureRank: Record<PolicyPosture, number> = {
  compliant: 1,
  "review-required": 2,
  "escalation-required": 3,
  "policy-blocked": 4,
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasPack(packs: ReviewPack[], pack: ReviewPack): boolean {
  return packs.includes(pack);
}

function strongestPosture(policies: TriggeredPolicy[]): PolicyPosture {
  return policies.reduce<PolicyPosture>((strongest, policy) => (
    postureRank[policy.result] > postureRank[strongest] ? policy.result : strongest
  ), "compliant");
}

function addPolicy(
  policies: TriggeredPolicy[],
  policy: TriggeredPolicy
): void {
  if (policies.some((existing) => existing.name === policy.name)) return;
  policies.push(policy);
}

function approvalsFor(input: PolicyAwareIntegrityInput, policyPosture: PolicyPosture): string[] {
  const approvals: string[] = [];
  const packs = input.suggestedReviewPacks;

  if (hasPack(packs, "security-pack")) approvals.push("security review");
  if (hasPack(packs, "payment-pack")) approvals.push("payment review");
  if (hasPack(packs, "runtime-pack")) approvals.push("runtime review");
  if (hasPack(packs, "release-readiness-pack")) approvals.push("release review");
  if (input.architectureAwareIntegrity.blastRadius === "broad" || input.architectureAwareIntegrity.blastRadius === "critical") {
    approvals.push("architecture review");
  }
  if (input.architectureAwareIntegrity.blastRadius === "critical" || policyPosture === "escalation-required" || policyPosture === "policy-blocked") {
    approvals.push("owner approval");
  }
  if (input.releaseReadiness.releaseDecision === "caution" || input.releaseReadiness.releaseDecision === "blocked") {
    approvals.push("rollback approval");
  }

  return unique(approvals);
}

function policyAction(posture: PolicyPosture): string {
  if (posture === "policy-blocked") {
    return "Block release until policy violations are resolved and required evidence is attached.";
  }
  if (posture === "escalation-required") {
    return "Escalate for architecture and security review before merge or release.";
  }
  if (posture === "review-required") {
    return "Proceed only after standard review evidence and required approvals are attached.";
  }
  return "Proceed after normal review evidence is attached.";
}

function governanceWarnings(input: PolicyAwareIntegrityInput): string[] {
  const warnings: string[] = [];
  const systems = input.architectureAwareIntegrity.affectedSystems;

  if (systems.length > 2 || input.architectureAwareIntegrity.blastRadius === "critical") {
    warnings.push("Sensitive systems changed together.");
  }
  if (input.releaseReadiness.releaseDecision === "blocked" || input.postureAwareIntegrity.integrityTrend === "critical-degrading") {
    warnings.push("Critical release posture exists.");
  }
  if (input.releaseReadiness.missingReleaseEvidence.some((item) => /rollback/i.test(item))) {
    warnings.push("Rollback evidence missing.");
  }
  if (input.architectureAwareIntegrity.blastRadius === "critical" || input.diffAwareIntegrity.diffFindings.some((finding) => finding.severity === "critical")) {
    warnings.push("Policy escalation path required.");
  }
  if (input.prIntegrity.mergeReadiness !== "ready" && input.architectureAwareIntegrity.blastRadius !== "limited") {
    warnings.push("Unknown or unresolved risk intersects sensitive systems.");
  }

  return unique(warnings);
}

export function evaluatePolicyAwareIntegrity(
  input: PolicyAwareIntegrityInput
): PolicyAwareIntegrityResult {
  const policies: TriggeredPolicy[] = [];
  const packs = input.suggestedReviewPacks;
  const criticalDiffFinding = input.diffAwareIntegrity.diffFindings.some((finding) => finding.severity === "critical");
  const serviceRoleDiffFinding = input.diffAwareIntegrity.diffFindings.some((finding) => finding.findingName.includes("service-role"));
  const sensitiveSystems = input.architectureAwareIntegrity.affectedSystems.some((system) =>
    ["api", "auth", "admin", "payment", "messaging", "runtime", "vault", "database", "ordering", "release"].includes(system)
  );

  if (input.architectureAwareIntegrity.blastRadius === "critical") {
    addPolicy(policies, {
      name: "critical-blast-radius-review",
      result: "escalation-required",
      reason: "Architecture blast radius is critical.",
    });
  }
  if (hasPack(packs, "payment-pack") && hasPack(packs, "release-readiness-pack")) {
    addPolicy(policies, {
      name: "payment-release-review-required",
      result: "review-required",
      reason: "Payment changes also require release-readiness review.",
    });
  }
  if (serviceRoleDiffFinding) {
    addPolicy(policies, {
      name: "service-role-security-review",
      result: "escalation-required",
      reason: "Service-role diff-aware finding requires security escalation.",
    });
  }
  if (hasPack(packs, "runtime-pack") && hasPack(packs, "vault-pack")) {
    addPolicy(policies, {
      name: "runtime-config-change-review",
      result: "review-required",
      reason: "Runtime and Vault review packs are both selected.",
    });
  }
  if (criticalDiffFinding) {
    addPolicy(policies, {
      name: "critical-diff-finding-block",
      result: "policy-blocked",
      reason: "Critical diff-aware finding requires policy block.",
    });
  }
  if (input.releaseReadiness.releaseDecision === "caution" || input.releaseReadiness.releaseDecision === "blocked") {
    addPolicy(policies, {
      name: "rollback-evidence-required",
      result: "review-required",
      reason: "Release caution or block requires rollback evidence.",
    });
  }
  if (input.prIntegrity.mergeReadiness !== "ready" && sensitiveSystems) {
    addPolicy(policies, {
      name: "unknown-risk-escalation",
      result: "escalation-required",
      reason: "Unresolved review posture intersects sensitive systems.",
    });
  }
  if (input.architectureAwareIntegrity.blastRadius === "critical" || criticalDiffFinding) {
    addPolicy(policies, {
      name: "self-approval-not-recommended",
      result: "escalation-required",
      reason: "Critical blast radius or critical diff finding should not be self-approved.",
    });
  }

  const policyViolations: string[] = [];
  if (criticalDiffFinding) policyViolations.push("Critical diff-aware finding requires escalation.");
  if (input.architectureAwareIntegrity.blastRadius === "critical") policyViolations.push("Critical blast radius cannot proceed without review.");
  if (serviceRoleDiffFinding) policyViolations.push("Service-role usage requires security review.");
  if (input.releaseReadiness.releaseDecision === "caution" || input.releaseReadiness.releaseDecision === "blocked") {
    policyViolations.push("Release caution requires rollback evidence.");
  }
  if (hasPack(packs, "runtime-pack") && hasPack(packs, "vault-pack")) {
    policyViolations.push("Runtime + Vault changes require runtime verification.");
  }

  const policyEscalations = policies
    .filter((policy) => policy.result === "escalation-required" || policy.result === "policy-blocked")
    .map((policy) => `${policy.name}: ${policy.reason}`);
  const policyPosture = strongestPosture(policies);

  return {
    triggeredPolicies: policies.sort((a, b) => a.name.localeCompare(b.name)),
    policyViolations: unique(policyViolations),
    policyEscalations: unique(policyEscalations),
    requiredApprovals: approvalsFor(input, policyPosture),
    governanceWarnings: governanceWarnings(input),
    policyReviewNotes: [
      "Confirm separation-of-duties expectations.",
      "Confirm reviewer is independent when required.",
      "Confirm release evidence is attached.",
      "Confirm rollback owner is identified.",
      "Confirm sensitive boundaries were reviewed.",
    ],
    policyPosture,
    recommendedPolicyAction: policyAction(policyPosture),
  };
}
