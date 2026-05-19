import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReviewPack } from "./reviewSelector.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { Severity } from "./riskClassifier.ts";
import type { DiffFinding } from "./diffAwareIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";

export type ReleaseDecision = "ready" | "caution" | "blocked";
export type ReleaseRisk = "low" | "medium" | "high" | "critical";

export type ReleaseReadinessInput = {
  prIntegrity: PrIntegrityResult;
  highestSeverity: Severity;
  riskCombinations: RiskCombination[];
  suggestedReviewPacks: ReviewPack[];
  criticalWarnings: string[];
  detectedEnvVarNames: string[];
  diffFindings: DiffFinding[];
  buildAwareIntegrity: BuildAwareIntegrityResult;
};

export type ReleaseReadinessResult = {
  releaseDecision: ReleaseDecision;
  releaseRisk: ReleaseRisk;
  requiredReleaseChecks: string[];
  missingReleaseEvidence: string[];
  rollbackRequirements: string[];
  canaryRecommendations: string[];
  releaseWarnings: string[];
  recommendedReleaseAction: string;
};

const requiredChecksByPack: Record<ReviewPack, string[]> = {
  "planning-pack": ["Verify change scope is documented."],
  "security-pack": [
    "Verify auth/session behavior.",
    "Verify production/preview separation.",
  ],
  "payment-pack": [
    "Verify payment webhook trust.",
    "Verify canary validation path.",
  ],
  "sms-compliance-pack": ["Verify SMS/telecom compliance expectations before release."],
  "vault-pack": [
    "Verify required env names exist.",
    "Verify runtime bindings.",
  ],
  "runtime-pack": [
    "Verify rollback path.",
    "Verify deploy target.",
    "Verify runtime bindings.",
  ],
  "ux-pack": ["Verify critical user flows before release."],
  "release-readiness-pack": [
    "Verify rollback path.",
    "Verify canary validation path.",
    "Verify deploy target.",
  ],
};

const rollbackByPack: Partial<Record<ReviewPack, string[]>> = {
  "payment-pack": [
    "Rollback payment webhook or checkout changes immediately if provider state mismatch appears.",
  ],
  "runtime-pack": [
    "Rollback deploy if runtime bindings or routes drift.",
  ],
  "vault-pack": [
    "Rollback if required runtime secret/config mismatch appears.",
  ],
  "security-pack": [
    "Rollback immediately if auth boundary regression is detected.",
  ],
};

const canaryByPack: Partial<Record<ReviewPack, string[]>> = {
  "security-pack": [
    "Monitor login.",
    "Monitor admin access.",
  ],
  "payment-pack": [
    "Monitor checkout.",
    "Monitor webhook health.",
  ],
  "sms-compliance-pack": [
    "Monitor SMS delivery.",
  ],
  "runtime-pack": [
    "Monitor runtime errors.",
  ],
  "vault-pack": [
    "Monitor runtime errors.",
  ],
  "ux-pack": [
    "Monitor checkout.",
  ],
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasPack(packs: ReviewPack[], pack: ReviewPack): boolean {
  return packs.includes(pack);
}

function missingEvidenceForRelease(packs: ReviewPack[]): string[] {
  const missing = new Set<string>();
  missing.add("No release reviewer confirmation.");
  missing.add("No test result attached.");

  for (const pack of packs) {
    missing.add(`No ${pack} release evidence attached.`);
  }

  if (hasPack(packs, "release-readiness-pack")) {
    missing.add("No release-readiness notes attached.");
  }
  if (hasPack(packs, "runtime-pack")) {
    missing.add("No runtime binding verification attached.");
  }
  if (hasPack(packs, "vault-pack")) {
    missing.add("No env/secret availability confirmation attached.");
  }
  if (hasPack(packs, "payment-pack")) {
    missing.add("No payment/webhook verification attached.");
  }

  return [...missing];
}

export function evaluateReleaseReadiness(
  input: ReleaseReadinessInput
): ReleaseReadinessResult {
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
  const highOrMediumDiffFindings = input.diffFindings.filter(
    (finding) => finding.severity === "high" || finding.severity === "medium"
  );
  const releaseWarnings: string[] = [];

  if (input.detectedEnvVarNames.length) {
    releaseWarnings.push("Env var-like names were detected; confirm no values are exposed and runtime config is ready.");
  }
  for (const combination of highCombinations) {
    releaseWarnings.push(`High risk combination requires release caution: ${combination.name}.`);
  }
  for (const finding of highOrMediumDiffFindings) {
    releaseWarnings.push(`Diff-aware finding requires release review: ${finding.findingName} in ${finding.filePath}.`);
  }
  if (input.buildAwareIntegrity.buildPosture !== "passed") {
    releaseWarnings.push(`Build-aware release impact: ${input.buildAwareIntegrity.releaseImpact}.`);
  }

  let releaseDecision: ReleaseDecision = "ready";
  let releaseRisk: ReleaseRisk = "low";
  let recommendedReleaseAction = "Release can proceed after normal approval and evidence attachment.";

  if (
    input.prIntegrity.mergeReadiness === "blocked" ||
    input.highestSeverity === "critical" ||
    criticalCombinations.length > 0 ||
    criticalDiffFindings.length > 0 ||
    input.buildAwareIntegrity.buildRisk === "critical" ||
    input.criticalWarnings.length > 0
  ) {
    releaseDecision = "blocked";
    releaseRisk = "critical";
    recommendedReleaseAction = "Do not release until blockers are resolved and release evidence is attached.";
  } else if (
    input.prIntegrity.mergeReadiness === "needs-review" ||
    hasPack(packs, "release-readiness-pack") ||
    hasPack(packs, "runtime-pack") ||
    hasPack(packs, "vault-pack") ||
    hasPack(packs, "payment-pack") ||
    highCombinations.length > 0 ||
    highOrMediumDiffFindings.length > 0 ||
    input.buildAwareIntegrity.buildPosture === "failed" ||
    input.buildAwareIntegrity.buildPosture === "warning" ||
    input.detectedEnvVarNames.length > 0
  ) {
    releaseDecision = "caution";
    releaseRisk = highCombinations.length || highOrMediumDiffFindings.some((finding) => finding.severity === "high") || input.highestSeverity === "high" ? "high" : "medium";
    recommendedReleaseAction = "Hold release until required checks, canary plan, and rollback path are confirmed.";
  }

  const requiredReleaseChecks = unique(packs.flatMap((pack) => requiredChecksByPack[pack] || []));
  const missingReleaseEvidence = missingEvidenceForRelease(packs);
  if (input.diffFindings.length) {
    requiredReleaseChecks.push("Verify diff-aware findings were reviewed.");
    missingReleaseEvidence.push("No diff-aware release evidence attached.");
  }
  if (input.buildAwareIntegrity.buildPosture !== "passed") {
    requiredReleaseChecks.push("Verify build-aware findings were reviewed.");
    missingReleaseEvidence.push("No passing build evidence attached.");
  }

  return {
    releaseDecision,
    releaseRisk,
    requiredReleaseChecks: unique(requiredReleaseChecks),
    missingReleaseEvidence: unique(missingReleaseEvidence),
    rollbackRequirements: unique(packs.flatMap((pack) => rollbackByPack[pack] || [])),
    canaryRecommendations: unique(packs.flatMap((pack) => canaryByPack[pack] || [])),
    releaseWarnings,
    recommendedReleaseAction,
  };
}
