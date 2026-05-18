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

export type Severity = "low" | "medium" | "high" | "critical";

export type ClassifiedFile = FileChange & {
  riskCategories: RiskCategory[];
  severity: Severity;
  severityReason: string;
};

const rules: Array<{ category: RiskCategory; patterns: RegExp[] }> = [
  {
    category: "payment",
    patterns: [/stripe/i, /payment/i, /billing/i, /checkout/i],
  },
  {
    category: "sms-compliance",
    patterns: [/twilio/i, /sms/i, /whatsapp/i, /message/i, /voice/i],
  },
  {
    category: "vault",
    patterns: [/\.env/i, /env/i, /wrangler/i, /config/i, /secret/i, /token/i, /credential/i, /vault/i],
  },
  {
    category: "runtime",
    patterns: [
      /^src\//i,
      /^package\.json$/i,
      /^scripts\/dev-integrity-/i,
      /^tools\/dev-integrity-dashboard\//i,
      /worker/i,
      /cloudflare/i,
      /supabase/i,
      /open-next/i,
      /opennext/i,
      /runtime/i,
      /binding/i,
    ],
  },
  {
    category: "security",
    patterns: [/auth/i, /admin/i, /api/i, /session/i, /webhook/i, /supabase/i, /service-role/i, /service_role/i, /rls/i],
  },
  {
    category: "ux",
    patterns: [/dashboard/i, /ui/i, /page/i, /component/i, /menu/i, /hub/i, /storefront/i, /\.html$/i, /\.css$/i, /styles/i],
  },
];

function lowRiskPath(filePath: string): boolean {
  return /^docs\//.test(filePath)
    || /^examples\//.test(filePath)
    || filePath === "README.md"
    || filePath.endsWith(".md");
}

function criticalReason(filePath: string, categories: RiskCategory[]): string | null {
  const text = filePath.toLowerCase();

  if (/\.env($|\.|\/)/.test(text) || /secret.*(key|token)|token.*secret|private.*key/.test(text)) {
    return "Secret leakage indicator in changed file path.";
  }
  if (/service-role|service_role|supabase_service_role_key/.test(text)) {
    return "Service role exposure indicator in changed file path.";
  }
  if (/(production|prod|deploy|wrangler|cloudflare).*(config|toml|json|ya?ml)?$/.test(text)) {
    return "Production deploy configuration change indicator.";
  }
  if (categories.includes("payment") && categories.includes("security") && /webhook/.test(text)) {
    return "Payment webhook trust change indicator.";
  }

  return null;
}

function severityFor(filePath: string, categories: RiskCategory[]): { severity: Severity; reason: string } {
  const critical = criticalReason(filePath, categories);
  if (critical) return { severity: "critical", reason: critical };

  if (categories.some((category) => ["security", "payment", "sms-compliance"].includes(category))) {
    return { severity: "high", reason: "Security, payment, SMS compliance, auth, admin, API, or webhook risk." };
  }

  if (categories.some((category) => ["ux", "runtime", "vault"].includes(category))) {
    return { severity: "medium", reason: "UX, runtime, config, script, package, or Vault-related change." };
  }

  if (categories.length && categories.every((category) => category === "low-risk")) {
    return { severity: "low", reason: "Docs, examples, README, or markdown-only change." };
  }

  return { severity: "medium", reason: "Unknown file type requires review." };
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

    const uniqueCategories = [...new Set(categories)];
    const severity = severityFor(file.path, uniqueCategories);

    return {
      ...file,
      riskCategories: uniqueCategories,
      severity: severity.severity,
      severityReason: severity.reason,
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

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function highestSeverity(files: ClassifiedFile[]): Severity {
  return files.reduce<Severity>((highest, file) => (
    severityRank[file.severity] > severityRank[highest] ? file.severity : highest
  ), "low");
}

export function criticalWarnings(files: ClassifiedFile[]): string[] {
  return files
    .filter((file) => file.severity === "critical")
    .map((file) => `${file.path}: ${file.severityReason}`);
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
