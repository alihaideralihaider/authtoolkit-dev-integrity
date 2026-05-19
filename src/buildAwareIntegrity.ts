import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { ReviewPack } from "./reviewSelector.ts";

export type BuildPosture = "passed" | "warning" | "failed" | "unknown";
export type BuildRisk = "low" | "medium" | "high" | "critical";

export type BuildSummary = {
  status?: string;
  stage?: string;
  failedJobs?: string[];
  failureCategory?: string;
  summary?: string;
  logsRedacted?: boolean;
};

export type BuildAwareIntegrityResult = {
  buildPosture: BuildPosture;
  buildRisk: BuildRisk;
  failedStage: string;
  likelyFailureArea: string;
  affectedReviewPacks: ReviewPack[];
  releaseImpact: string;
  buildEvidenceRequirements: string[];
  recommendedBuildAction: string;
  buildSummaryPath?: string;
};

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function packsForCategory(category: string, stage: string): ReviewPack[] {
  const text = `${category} ${stage}`.toLowerCase();
  const packs: ReviewPack[] = [];

  if (/typescript|typecheck/.test(text)) packs.push("runtime-pack");
  if (/lint/.test(text)) packs.push("planning-pack");
  if (/test/.test(text)) packs.push("planning-pack");
  if (/auth|security/.test(text)) packs.push("security-pack");
  if (/payment|webhook/.test(text)) packs.push("payment-pack");
  if (/sms|twilio|whatsapp/.test(text)) packs.push("sms-compliance-pack");
  if (/env|config|secret|binding|cloudflare|wrangler/.test(text)) packs.push("vault-pack", "runtime-pack");
  if (/deploy|preview|worker/.test(text)) packs.push("runtime-pack", "release-readiness-pack");
  if (/migration|database|supabase/.test(text)) packs.push("security-pack", "runtime-pack");

  return unique(packs.length ? packs : ["planning-pack"]);
}

function criticalBuildIssue(category: string, stage: string): boolean {
  const text = `${category} ${stage}`.toLowerCase();
  return /deploy|production|prod|secret|migration|payment|auth|runtime binding|cloudflare|wrangler/.test(text);
}

function postureFromStatus(status: string, category: string, stage: string): {
  buildPosture: BuildPosture;
  buildRisk: BuildRisk;
} {
  if (!status) return { buildPosture: "unknown", buildRisk: "low" };
  if (/pass|success|succeeded/.test(status)) return { buildPosture: "passed", buildRisk: "low" };
  if (/warn|flaky|skipped|partial/.test(status)) return { buildPosture: "warning", buildRisk: "medium" };
  if (/fail|failed|error|blocked/.test(status)) {
    return {
      buildPosture: "failed",
      buildRisk: criticalBuildIssue(category, stage) ? "critical" : "high",
    };
  }
  return { buildPosture: "unknown", buildRisk: "low" };
}

function releaseImpact(posture: BuildPosture, risk: BuildRisk): string {
  if (risk === "critical") return "critical build blocker detected";
  if (posture === "failed") return "build failure blocks or delays release trust";
  if (posture === "warning") return "build warning requires review before release trust";
  if (posture === "passed") return "no build blocker detected";
  return "build evidence missing; release trust is incomplete";
}

function evidenceRequirements(result: {
  posture: BuildPosture;
  risk: BuildRisk;
  stage: string;
  category: string;
}): string[] {
  if (result.posture === "passed") {
    return ["Attach passing build/test summary evidence."];
  }
  if (result.posture === "unknown") {
    return ["Attach build, test, lint, or typecheck result evidence."];
  }
  const requirements = [
    `Attach redacted build evidence for failed stage: ${result.stage || "unknown"}.`,
    "Attach rerun evidence after the build issue is fixed.",
  ];
  if (result.risk === "critical") {
    requirements.push("Attach release-owner review evidence for critical build issue.");
  }
  if (result.category) {
    requirements.push(`Attach targeted review evidence for failure category: ${result.category}.`);
  }
  return requirements;
}

function action(posture: BuildPosture, risk: BuildRisk): string {
  if (risk === "critical") return "Block release until critical build issue is resolved and rerun evidence is attached.";
  if (posture === "failed") return "Fix the failing build stage and attach a passing rerun before release.";
  if (posture === "warning") return "Review build warnings and attach acceptance or rerun evidence before release.";
  if (posture === "passed") return "Preserve passing build evidence with the integrity report.";
  return "Run local build/test/lint/typecheck and attach a redacted build summary.";
}

export function loadBuildSummary(buildSummaryPath: string | undefined): {
  summary: BuildSummary | null;
  resolvedPath?: string;
} {
  if (!buildSummaryPath) return { summary: null };

  const resolvedPath = path.resolve(process.cwd(), buildSummaryPath);
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`Build summary file does not exist: ${resolvedPath}`);
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as BuildSummary;
  return { summary: parsed, resolvedPath };
}

export function confidenceWithBuildAwareness(
  confidence: number,
  buildAwareIntegrity: BuildAwareIntegrityResult
): number {
  if (buildAwareIntegrity.buildRisk === "critical") return Math.min(confidence, 25);
  if (buildAwareIntegrity.buildPosture === "failed") return Math.min(confidence, 40);
  if (buildAwareIntegrity.buildPosture === "warning") return Math.min(confidence, 55);
  return confidence;
}

export function evaluateBuildAwareIntegrity(
  summary: BuildSummary | null,
  buildSummaryPath?: string
): BuildAwareIntegrityResult {
  if (!summary) {
    return {
      buildPosture: "unknown",
      buildRisk: "low",
      failedStage: "unknown",
      likelyFailureArea: "unknown",
      affectedReviewPacks: [],
      releaseImpact: releaseImpact("unknown", "low"),
      buildEvidenceRequirements: evidenceRequirements({
        posture: "unknown",
        risk: "low",
        stage: "unknown",
        category: "unknown",
      }),
      recommendedBuildAction: action("unknown", "low"),
    };
  }

  const status = normalizeText(summary.status);
  const stage = normalizeText(summary.stage) || "unknown";
  const category = normalizeText(summary.failureCategory) || "unknown";
  const posture = postureFromStatus(status, category, stage);

  return {
    buildPosture: posture.buildPosture,
    buildRisk: posture.buildRisk,
    failedStage: stage,
    likelyFailureArea: category,
    affectedReviewPacks: packsForCategory(category, stage),
    releaseImpact: releaseImpact(posture.buildPosture, posture.buildRisk),
    buildEvidenceRequirements: evidenceRequirements({
      posture: posture.buildPosture,
      risk: posture.buildRisk,
      stage,
      category,
    }),
    recommendedBuildAction: action(posture.buildPosture, posture.buildRisk),
    buildSummaryPath,
  };
}
