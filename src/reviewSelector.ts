import type { RiskCategory } from "./riskClassifier.ts";

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

