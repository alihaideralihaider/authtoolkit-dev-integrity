import type { ClassifiedFile, RiskCategory, Severity } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type RiskCombination = {
  name: string;
  severity: Severity;
  reason: string;
  matchedFiles: string[];
  suggestedReviewPacks: ReviewPack[];
  suggestedNextAction: string;
};

function filesWithRisk(files: ClassifiedFile[], risk: RiskCategory): ClassifiedFile[] {
  return files.filter((file) => file.riskCategories.includes(risk));
}

function filesMatching(files: ClassifiedFile[], pattern: RegExp): ClassifiedFile[] {
  return files.filter((file) => pattern.test(file.path));
}

function uniquePaths(files: ClassifiedFile[]): string[] {
  return [...new Set(files.map((file) => file.path))].sort();
}

function hasRisk(files: ClassifiedFile[], risk: RiskCategory): boolean {
  return files.some((file) => file.riskCategories.includes(risk));
}

function hasHighOrCritical(files: ClassifiedFile[]): boolean {
  return files.some((file) => file.severity === "high" || file.severity === "critical");
}

export function detectRiskCombinations(files: ClassifiedFile[]): RiskCombination[] {
  const combinations: RiskCombination[] = [];
  const paymentFiles = filesWithRisk(files, "payment");
  const securityFiles = filesWithRisk(files, "security");
  const runtimeFiles = filesWithRisk(files, "runtime");
  const vaultFiles = filesWithRisk(files, "vault");
  const uxFiles = filesWithRisk(files, "ux");
  const smsFiles = filesWithRisk(files, "sms-compliance");
  const unknownFiles = filesWithRisk(files, "unknown");
  const webhookFiles = filesMatching(files, /webhook/i);
  const adminApiFiles = filesMatching(files, /(^|\/)(admin|api)(\/|\.|-|$)/i);
  const telecomRuntimeFiles = filesMatching(files, /(runtime|webhook|voice)/i);

  if (paymentFiles.length && webhookFiles.length && securityFiles.length) {
    combinations.push({
      name: "payment-webhook-trust-boundary",
      severity: "critical",
      reason: "Payment, webhook, and security-sensitive files changed together.",
      matchedFiles: uniquePaths([...paymentFiles, ...webhookFiles, ...securityFiles]),
      suggestedReviewPacks: ["payment-pack", "security-pack", "release-readiness-pack"],
      suggestedNextAction:
        "Run payment and security review before release; verify webhook signature handling, idempotency, and trust boundaries.",
    });
  }

  if (runtimeFiles.length && vaultFiles.length) {
    combinations.push({
      name: "deployment-secret-runtime-drift",
      severity: "high",
      reason: "Runtime or deployment-related files changed with Vault, env, secret, or config-related files.",
      matchedFiles: uniquePaths([...runtimeFiles, ...vaultFiles]),
      suggestedReviewPacks: ["runtime-pack", "vault-pack", "release-readiness-pack"],
      suggestedNextAction:
        "Verify runtime bindings, required env names, secret availability, and deploy target alignment before release.",
    });
  }

  if (securityFiles.length && uxFiles.length && adminApiFiles.length) {
    combinations.push({
      name: "admin-authorization-boundary",
      severity: "high",
      reason: "Security, UX, and admin/API files changed together.",
      matchedFiles: uniquePaths([...securityFiles, ...uxFiles, ...adminApiFiles]),
      suggestedReviewPacks: ["security-pack", "ux-pack", "release-readiness-pack"],
      suggestedNextAction:
        "Verify admin/API authorization boundaries, session handling, and user-flow access before release.",
    });
  }

  if (smsFiles.length && (runtimeFiles.length || webhookFiles.length || telecomRuntimeFiles.length)) {
    combinations.push({
      name: "telecom-runtime-compliance",
      severity: "high",
      reason: "Messaging/SMS compliance files changed near runtime, webhook, or voice-related files.",
      matchedFiles: uniquePaths([...smsFiles, ...runtimeFiles, ...webhookFiles, ...telecomRuntimeFiles]),
      suggestedReviewPacks: ["sms-compliance-pack", "runtime-pack", "release-readiness-pack"],
      suggestedNextAction:
        "Run SMS compliance and runtime review; verify consent, STOP/HELP expectations, webhook behavior, and provider configuration.",
    });
  }

  if (unknownFiles.length && hasHighOrCritical(files)) {
    combinations.push({
      name: "unknown-risk-near-sensitive-change",
      severity: "high",
      reason: "At least one unknown file changed alongside high or critical severity work.",
      matchedFiles: uniquePaths([
        ...unknownFiles,
        ...files.filter((file) => file.severity === "high" || file.severity === "critical"),
      ]),
      suggestedReviewPacks: ["planning-pack", "release-readiness-pack"],
      suggestedNextAction:
        "Manually classify unknown files and confirm they do not expand the sensitive change scope.",
    });
  }

  return combinations;
}

export function confidenceWithRiskCombinations(
  baseConfidence: number,
  combinations: RiskCombination[]
): number {
  if (combinations.some((combination) => combination.severity === "critical")) {
    return Math.min(baseConfidence, 35);
  }

  if (combinations.some((combination) => combination.severity === "high")) {
    return Math.min(baseConfidence, 50);
  }

  return baseConfidence;
}
