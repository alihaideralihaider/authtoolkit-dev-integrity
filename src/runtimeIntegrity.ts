import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { ReviewPack } from "./reviewSelector.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { Severity } from "./riskClassifier.ts";
import type { DiffFinding } from "./diffAwareIntegrity.ts";

export type RuntimePosture = "stable" | "watch" | "degraded-risk" | "rollback-watch";
export type RuntimeRisk = "low" | "medium" | "high" | "critical";

export type RuntimeIntegrityInput = {
  releaseReadiness: ReleaseReadinessResult;
  prIntegrity: PrIntegrityResult;
  highestSeverity: Severity;
  riskCombinations: RiskCombination[];
  suggestedReviewPacks: ReviewPack[];
  detectedEnvVarNames: string[];
  criticalWarnings: string[];
  diffFindings: DiffFinding[];
};

export type RuntimeIntegrityResult = {
  runtimePosture: RuntimePosture;
  runtimeRisk: RuntimeRisk;
  runtimeSignalsToWatch: string[];
  driftIndicators: string[];
  rollbackTriggers: string[];
  ownerAttentionItems: string[];
  recommendedRuntimeAction: string;
};

const signalsByPack: Partial<Record<ReviewPack, string[]>> = {
  "security-pack": [
    "login failures",
    "admin access errors",
    "unexpected 401/403/200 behavior",
    "session errors",
  ],
  "payment-pack": [
    "checkout failures",
    "webhook delivery failures",
    "payment/order state mismatch",
    "duplicate payment/order events",
  ],
  "sms-compliance-pack": [
    "SMS delivery failures",
    "opt-out/STOP failures",
    "consent path failures",
    "provider webhook failures",
  ],
  "vault-pack": [
    "missing env/runtime config errors",
    "provider authentication failures",
    "secret/binding mismatch errors",
  ],
  "runtime-pack": [
    "5xx errors",
    "route failures",
    "worker/runtime exceptions",
    "deploy target mismatch",
    "binding errors",
  ],
  "ux-pack": [
    "broken customer flow",
    "broken admin flow",
    "mobile layout failure",
    "checkout abandonment spike",
  ],
};

const driftByPack: Partial<Record<ReviewPack, string[]>> = {
  "runtime-pack": ["route/runtime/binding drift"],
  "vault-pack": ["env/config/secret drift"],
  "payment-pack": ["payment state drift"],
  "security-pack": ["auth boundary drift"],
  "sms-compliance-pack": ["consent/messaging behavior drift"],
  "ux-pack": ["user-flow drift"],
};

const rollbackByPack: Partial<Record<ReviewPack, string[]>> = {
  "security-pack": ["auth bypass or admin exposure"],
  "payment-pack": ["payment state mismatch or broken checkout"],
  "runtime-pack": ["repeated 5xx or route outage"],
  "vault-pack": ["missing required secret/config in runtime"],
  "sms-compliance-pack": ["non-compliant outbound messaging behavior"],
  "ux-pack": ["critical customer/admin flow unusable"],
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasPack(packs: ReviewPack[], pack: ReviewPack): boolean {
  return packs.includes(pack);
}

function hasSensitivePack(packs: ReviewPack[]): boolean {
  return packs.some((pack) =>
    ["security-pack", "payment-pack", "sms-compliance-pack", "vault-pack", "runtime-pack", "ux-pack", "release-readiness-pack"].includes(pack)
  );
}

export function evaluateRuntimeIntegrity(
  input: RuntimeIntegrityInput
): RuntimeIntegrityResult {
  const packs = [...new Set(input.suggestedReviewPacks)].sort() as ReviewPack[];
  const criticalCombinations = input.riskCombinations.filter(
    (combination) => combination.severity === "critical"
  );
  const highCombinations = input.riskCombinations.filter(
    (combination) => combination.severity === "high"
  );
  const criticalDiffFindings = input.diffFindings.filter(
    (finding) => finding.severity === "critical"
  );
  const highDiffFindings = input.diffFindings.filter(
    (finding) => finding.severity === "high"
  );
  const ownerAttentionItems = [
    "Review runtime errors before next release.",
    "Confirm rollback path is documented.",
    "Confirm owner understands release caution reason.",
    "Attach evidence after canary validation.",
    "Investigate any drift indicators within first post-release window.",
  ];

  let runtimePosture: RuntimePosture = "stable";
  let runtimeRisk: RuntimeRisk = "low";
  let recommendedRuntimeAction = "No special runtime watch required beyond normal post-release observation.";

  if (
    input.releaseReadiness.releaseDecision === "blocked" ||
    input.releaseReadiness.releaseRisk === "critical" ||
    input.criticalWarnings.length > 0 ||
    criticalCombinations.length > 0 ||
    criticalDiffFindings.length > 0
  ) {
    runtimePosture = "rollback-watch";
    runtimeRisk = "critical";
    recommendedRuntimeAction = "Do not release; if already released, watch rollback triggers immediately.";
  } else if (
    input.releaseReadiness.releaseDecision === "caution" ||
    highCombinations.length > 0 ||
    highDiffFindings.length > 0 ||
    hasPack(packs, "release-readiness-pack") ||
    hasPack(packs, "payment-pack") ||
    hasPack(packs, "security-pack")
  ) {
    runtimePosture = "degraded-risk";
    runtimeRisk = highCombinations.length || highDiffFindings.length || input.highestSeverity === "high" ? "high" : "medium";
    recommendedRuntimeAction = "Run targeted post-release watch and confirm owner attention items before considering the release healthy.";
  } else if (
    hasPack(packs, "runtime-pack") ||
    hasPack(packs, "vault-pack") ||
    hasPack(packs, "ux-pack") ||
    input.detectedEnvVarNames.length > 0 ||
    input.diffFindings.length > 0 ||
    input.prIntegrity.mergeReadiness === "needs-review"
  ) {
    runtimePosture = "watch";
    runtimeRisk = "medium";
    recommendedRuntimeAction = "Monitor listed runtime signals during the first post-release window.";
  }

  return {
    runtimePosture,
    runtimeRisk,
    runtimeSignalsToWatch: unique([
      ...packs.flatMap((pack) => signalsByPack[pack] || []),
      ...input.diffFindings.map((finding) => `diff-aware signal: ${finding.signalType}`),
    ]),
    driftIndicators: unique(packs.flatMap((pack) => driftByPack[pack] || [])),
    rollbackTriggers: unique(packs.flatMap((pack) => rollbackByPack[pack] || [])),
    ownerAttentionItems: hasSensitivePack(packs) || runtimePosture !== "stable" ? ownerAttentionItems : [],
    recommendedRuntimeAction,
  };
}
