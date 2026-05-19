import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { monitorGit } from "./gitMonitor.ts";
import { classifyChangedFiles, collectRiskCategories, confidenceForRisks, confidenceNotes, criticalWarnings, highestSeverity } from "./riskClassifier.ts";
import { confidenceWithRiskCombinations, detectRiskCombinations } from "./riskCombinationDetector.ts";
import { evaluatePrIntegrity } from "./prIntegrity.ts";
import { evaluateReleaseReadiness } from "./releaseReadiness.ts";
import { selectReviewPacks, selectReviews } from "./reviewSelector.ts";
import type { ClassifiedFile, RiskCategory, Severity } from "./riskClassifier.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type ReviewResult = {
  repoPath: string;
  selectedSkill: string;
  skillPath: string;
  timestamp: string;
  gitStatus: string;
  diffNameOnly: string;
  changedFiles: ClassifiedFile[];
  riskCategories: RiskCategory[];
  highestSeverity: Severity;
  riskCombinations: RiskCombination[];
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  suggestedReviews: string[];
  suggestedReviewPacks: ReviewPack[];
  confidenceScore: number;
  confidenceNotes: string[];
  unknownRiskWarnings: string[];
  criticalWarnings: string[];
  detectedEnvVarNames: string[];
  safetyNotes: string[];
  nextActions: string[];
};

type RunReviewInput = {
  repoPath: string;
  selectedSkill: string;
};

const envNamePattern = /\b[A-Z][A-Z0-9_]{2,}\b/g;
const envNameHints = [
  "ENV",
  "SECRET",
  "TOKEN",
  "KEY",
  "PASSWORD",
  "SUPABASE",
  "STRIPE",
  "TWILIO",
  "RESEND",
  "CLOUDFLARE",
  "OPENAI",
  "GOOGLE",
  "META",
  "WHATSAPP",
];

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function normalizeRepoPath(repoPath: string): string {
  return path.resolve(process.cwd(), repoPath);
}

function assertDirectory(directoryPath: string, label: string): void {
  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
    throw new Error(`${label} does not exist or is not a directory: ${directoryPath}`);
  }
}

function skillPathFor(selectedSkill: string): string {
  return path.join(repoRoot(), "docs", "skills", `${selectedSkill}.md`);
}

function isLikelyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return true;
  return [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".mjs",
    ".cjs",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".example",
  ].includes(ext);
}

function detectEnvVarNames(repoPath: string, changedFiles: ClassifiedFile[]): string[] {
  const names = new Set<string>();

  for (const file of changedFiles) {
    const absolutePath = path.join(repoPath, file.path);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) continue;
    if (!isLikelyTextFile(absolutePath)) continue;

    const content = readFileSync(absolutePath, "utf8");
    const matches = content.match(envNamePattern) || [];

    for (const match of matches) {
      if (envNameHints.some((hint) => match.includes(hint))) {
        names.add(match);
      }
    }
  }

  return [...names].sort();
}

function buildUnknownRiskWarnings(changedFiles: ClassifiedFile[]): string[] {
  return changedFiles
    .filter((file) => file.riskCategories.includes("unknown"))
    .map((file) => `${file.path} could not be classified by v1 Git Monitoring heuristics.`);
}

export function runReview(input: RunReviewInput): ReviewResult {
  const repoPath = normalizeRepoPath(input.repoPath);
  assertDirectory(repoPath, "Repo path");

  const selectedSkill = input.selectedSkill.trim();
  const skillPath = skillPathFor(selectedSkill);
  if (!existsSync(skillPath) || !statSync(skillPath).isFile()) {
    throw new Error(`Selected skill markdown does not exist: ${skillPath}`);
  }

  const gitMonitor = monitorGit(repoPath);
  const changedFiles = classifyChangedFiles(gitMonitor.changedFiles);
  const riskCategories = collectRiskCategories(changedFiles);
  const maxSeverity = highestSeverity(changedFiles);
  const riskCombinations = detectRiskCombinations(changedFiles);
  const suggestedReviews = selectReviews(riskCategories, selectedSkill);
  const suggestedReviewPacks = [
    ...new Set([
      ...selectReviewPacks(riskCategories, maxSeverity),
      ...riskCombinations.flatMap((combination) => combination.suggestedReviewPacks),
    ]),
  ];
  const baseConfidenceScore = confidenceForRisks(riskCategories);
  const confidenceScore = confidenceWithRiskCombinations(baseConfidenceScore, riskCombinations);
  const detectedEnvVarNames = detectEnvVarNames(repoPath, changedFiles);
  const unknownRiskWarnings = buildUnknownRiskWarnings(changedFiles);
  const criticalWarningList = criticalWarnings(changedFiles);
  const prIntegrity = evaluatePrIntegrity({
    highestSeverity: maxSeverity,
    riskCombinations,
    suggestedReviewPacks,
    unknownRiskWarnings,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
  });
  const releaseReadiness = evaluateReleaseReadiness({
    prIntegrity,
    highestSeverity: maxSeverity,
    riskCombinations,
    suggestedReviewPacks,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
  });

  return {
    repoPath,
    selectedSkill,
    skillPath,
    timestamp: new Date().toISOString(),
    gitStatus: gitMonitor.gitStatus,
    diffNameOnly: gitMonitor.diffNameOnly,
    changedFiles,
    riskCategories,
    highestSeverity: maxSeverity,
    riskCombinations,
    prIntegrity,
    releaseReadiness,
    suggestedReviews,
    suggestedReviewPacks,
    confidenceScore,
    confidenceNotes: confidenceNotes(riskCategories, confidenceScore),
    unknownRiskWarnings,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
    safetyNotes: [
      "Local-only review runner.",
      "No external AI APIs were called.",
      "Target repository was not modified.",
      "Env var-like names were detected by name only; values were not read from environment variables or printed.",
      "Git Monitoring does not auto-fix, auto-commit, auto-push, or deploy.",
    ],
    nextActions: [
      "Review the selected skill checklist.",
      "Review suggested reviews selected by Git Monitoring.",
      "Investigate changed files with relevant risk tags.",
      "Update documentation or code only after human review confirms the issue.",
      "Rerun this command after fixes or documentation updates.",
    ],
  };
}
