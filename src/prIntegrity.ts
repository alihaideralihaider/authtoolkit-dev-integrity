import type { ReviewPack } from "./reviewSelector.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { Severity } from "./riskClassifier.ts";
import type { DiffFinding } from "./diffAwareIntegrity.ts";

export type MergeReadiness = "ready" | "needs-review" | "blocked";
export type ApprovalRisk = "low" | "medium" | "high" | "critical";

export type PrIntegrityInput = {
  highestSeverity: Severity;
  riskCombinations: RiskCombination[];
  suggestedReviewPacks: ReviewPack[];
  unknownRiskWarnings: string[];
  criticalWarnings: string[];
  detectedEnvVarNames: string[];
  diffFindings: DiffFinding[];
};

export type PrIntegrityResult = {
  mergeReadiness: MergeReadiness;
  approvalRisk: ApprovalRisk;
  requiredReviewPacks: ReviewPack[];
  blockingReasons: string[];
  missingEvidence: string[];
  reviewerChecklist: string[];
  recommendedDecision: string;
};

const checklistByPack: Record<ReviewPack, string[]> = {
  "planning-pack": [
    "Confirm the change scope is understood.",
    "Confirm unknown files are manually classified.",
  ],
  "security-pack": [
    "Confirm auth/authorization boundaries.",
    "Confirm APIs are not exposed unintentionally.",
    "Confirm service-role usage is server-only.",
  ],
  "payment-pack": [
    "Confirm provider trust and webhook validation.",
    "Confirm idempotency.",
    "Confirm order/payment state cannot drift.",
  ],
  "sms-compliance-pack": [
    "Confirm consent path.",
    "Confirm STOP/HELP behavior.",
    "Confirm transactional vs marketing distinction.",
  ],
  "vault-pack": [
    "Confirm secret names only, no values.",
    "Confirm source of truth.",
    "Confirm runtime/CI availability.",
  ],
  "runtime-pack": [
    "Confirm bindings and deploy target.",
    "Confirm local/preview/prod are not confused.",
  ],
  "ux-pack": [
    "Confirm critical flows still work.",
    "Confirm mobile/customer/admin usability.",
  ],
  "release-readiness-pack": [
    "Confirm release notes.",
    "Confirm canary plan.",
    "Confirm rollback decision path.",
  ],
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function missingEvidenceForPacks(packs: ReviewPack[]): string[] {
  const missing = new Set<string>();
  missing.add("No test result attached.");
  missing.add("No reviewer confirmation.");

  for (const pack of packs) {
    missing.add(`No ${pack} evidence attached.`);
  }

  if (packs.includes("release-readiness-pack")) {
    missing.add("No deploy/readiness notes for release-readiness-pack.");
  }
  if (packs.includes("vault-pack")) {
    missing.add("No Vault confirmation when vault-pack is selected.");
  }
  if (packs.includes("security-pack")) {
    missing.add("No security review notes when security-pack is selected.");
  }
  if (packs.includes("payment-pack")) {
    missing.add("No payment review notes when payment-pack is selected.");
  }

  return [...missing];
}

function checklistForPacks(packs: ReviewPack[]): string[] {
  return unique(packs.flatMap((pack) => checklistByPack[pack] || []));
}

export function evaluatePrIntegrity(input: PrIntegrityInput): PrIntegrityResult {
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
  const requiredReviewPacks = [...new Set(input.suggestedReviewPacks)].sort() as ReviewPack[];
  const blockingReasons: string[] = [];

  if (input.highestSeverity === "critical") {
    blockingReasons.push("Highest changed-file severity is critical.");
  }
  for (const combination of criticalCombinations) {
    blockingReasons.push(`Critical risk combination detected: ${combination.name}.`);
  }
  for (const warning of input.criticalWarnings) {
    blockingReasons.push(`Critical warning exists: ${warning}`);
  }
  for (const finding of criticalDiffFindings) {
    blockingReasons.push(`Critical diff-aware finding exists: ${finding.findingName} in ${finding.filePath}.`);
  }

  let mergeReadiness: MergeReadiness = "ready";
  let approvalRisk: ApprovalRisk = "low";
  let recommendedDecision = "Ready for review and possible merge after evidence is attached.";

  if (blockingReasons.length) {
    mergeReadiness = "blocked";
    approvalRisk = "critical";
    recommendedDecision = "Do not approve or merge until blockers are resolved and reviewed.";
  } else if (
    input.highestSeverity === "high" ||
    highCombinations.length > 0 ||
    highDiffFindings.length > 0 ||
    input.unknownRiskWarnings.length > 0 ||
    requiredReviewPacks.includes("release-readiness-pack") ||
    input.detectedEnvVarNames.length > 0
  ) {
    mergeReadiness = "needs-review";
    approvalRisk = highCombinations.length || highDiffFindings.length || input.highestSeverity === "high" ? "high" : "medium";
    recommendedDecision = "Hold for targeted review and evidence before approval or merge.";
  }

  const missingEvidence = missingEvidenceForPacks(requiredReviewPacks);
  if (input.diffFindings.length) {
    missingEvidence.push("No diff-aware review evidence attached.");
  }
  const reviewerChecklist = checklistForPacks(requiredReviewPacks);
  if (input.diffFindings.length) {
    reviewerChecklist.push("Review diff-aware findings and confirm changed logic is intentional.");
  }

  return {
    mergeReadiness,
    approvalRisk,
    requiredReviewPacks,
    blockingReasons,
    missingEvidence,
    reviewerChecklist,
    recommendedDecision,
  };
}
