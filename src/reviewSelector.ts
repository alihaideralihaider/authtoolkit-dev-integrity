import type { RiskCategory, Severity } from "./riskClassifier.ts";

export type ReviewPack =
  | "planning-pack"
  | "security-pack"
  | "payment-pack"
  | "sms-compliance-pack"
  | "vault-pack"
  | "runtime-pack"
  | "ux-pack"
  | "release-readiness-pack";

const reviewByRisk: Record<RiskCategory, string[]> = {
  security: ["saana-security-review"],
  payment: ["saana-payment-review"],
  "sms-compliance": ["saana-sms-compliance-review"],
  vault: ["vault-secret-readiness-review"],
  runtime: ["vault-runtime-binding-review"],
  ux: ["saana-restaurant-ux-review"],
  "low-risk": [],
  unknown: ["saana-plan"],
};

export function selectReviews(risks: RiskCategory[], selectedSkill: string): string[] {
  const reviews = new Set<string>();
  reviews.add(selectedSkill);

  for (const risk of risks) {
    for (const review of reviewByRisk[risk]) {
      reviews.add(review);
    }
  }

  return [...reviews];
}

const packByRisk: Record<RiskCategory, ReviewPack[]> = {
  security: ["security-pack"],
  payment: ["payment-pack"],
  "sms-compliance": ["sms-compliance-pack"],
  vault: ["vault-pack"],
  runtime: ["runtime-pack"],
  ux: ["ux-pack"],
  "low-risk": [],
  unknown: ["planning-pack"],
};

export function selectReviewPacks(risks: RiskCategory[], highestSeverity: Severity): ReviewPack[] {
  const packs = new Set<ReviewPack>();

  for (const risk of risks) {
    for (const pack of packByRisk[risk]) {
      packs.add(pack);
    }
  }

  if (highestSeverity === "high" || highestSeverity === "critical") {
    packs.add("release-readiness-pack");
  }
  if (!packs.size) {
    packs.add("planning-pack");
  }

  return [...packs];
}
