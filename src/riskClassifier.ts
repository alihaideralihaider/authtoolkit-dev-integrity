import type { FileChange } from "./gitMonitor.ts";

export type RiskCategory =
  | "security"
  | "payment"
  | "sms-compliance"
  | "vault"
  | "runtime"
  | "ux"
  | "low-risk"
  | "unknown";

export type ClassifiedFile = FileChange & {
  riskCategories: RiskCategory[];
};

const rules: Array<{ category: RiskCategory; patterns: RegExp[] }> = [
  {
    category: "payment",
    patterns: [/stripe/i, /payment/i, /billing/i, /webhook/i],
  },
  {
    category: "sms-compliance",
    patterns: [/twilio/i, /sms/i, /whatsapp/i, /message/i],
  },
  {
    category: "vault",
    patterns: [/\.env/i, /env/i, /wrangler/i, /config/i, /secret/i, /token/i, /credential/i],
  },
  {
    category: "runtime",
    patterns: [/^src\//i, /^package\.json$/i, /worker/i, /open-next/i, /opennext/i, /runtime/i, /binding/i],
  },
  {
    category: "security",
    patterns: [/auth/i, /admin/i, /api/i, /session/i],
  },
  {
    category: "ux",
    patterns: [/ui/i, /page/i, /component/i, /menu/i, /hub/i, /storefront/i],
  },
];

function lowRiskPath(filePath: string): boolean {
  return /^docs\//.test(filePath)
    || /^examples\//.test(filePath)
    || filePath === "README.md"
    || filePath.endsWith(".md");
}

export function classifyChangedFiles(changedFiles: FileChange[]): ClassifiedFile[] {
  return changedFiles.map((file) => {
    const categories = rules
      .filter((rule) => rule.patterns.some((pattern) => pattern.test(file.path)))
      .map((rule) => rule.category);

    if (!categories.length && lowRiskPath(file.path)) {
      categories.push("low-risk");
    }

    if (!categories.length) {
      categories.push("unknown");
    }

    return {
      ...file,
      riskCategories: [...new Set(categories)],
    };
  });
}

export function collectRiskCategories(files: ClassifiedFile[]): RiskCategory[] {
  return [...new Set(files.flatMap((file) => file.riskCategories))].sort();
}

export function confidenceForRisks(risks: RiskCategory[]): number {
  if (risks.includes("unknown")) return 40;
  if (risks.some((risk) => ["runtime", "security", "payment"].includes(risk))) return 60;
  if (risks.length === 1 && risks[0] === "ux") return 80;
  if (risks.length && risks.every((risk) => risk === "low-risk")) return 90;
  if (risks.includes("ux")) return 80;
  return 90;
}

export function confidenceNotes(risks: RiskCategory[], confidence: number): string[] {
  const notes = [`Confidence score: ${confidence}`];

  if (risks.includes("unknown")) {
    notes.push("Unknown risk is present; manual review is required before relying on this report.");
  }
  if (risks.some((risk) => ["runtime", "security", "payment"].includes(risk))) {
    notes.push("Runtime, security, or payment risk lowers confidence until targeted review is complete.");
  }
  if (risks.length && risks.every((risk) => risk === "low-risk")) {
    notes.push("Only low-risk file categories were detected by v1 heuristics.");
  }

  return notes;
}
