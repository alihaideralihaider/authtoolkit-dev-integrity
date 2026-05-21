import { execFileSync } from "node:child_process";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { GitContext } from "./gitContext.ts";
import type { ClassifiedFile, RiskCategory } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type BranchComparison = {
  comparisonBase: string;
  comparisonHead: string;
  filesChangedAgainstBase: number;
  commitsAheadOfBase: number;
  branchChangeSummary: string[];
  branchRiskSummary: string[];
  branchReviewFocus: string[];
  branchComparisonWarnings: string[];
};

type BranchComparisonInput = {
  repoPath: string;
  gitContext: GitContext;
  changedFiles: ClassifiedFile[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
  riskCategories: RiskCategory[];
  suggestedReviewPacks: ReviewPack[];
};

type NameStatus = {
  status: string;
  path: string;
};

function git(repoPath: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", args, {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return undefined;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

function parseNameStatus(output: string | undefined): NameStatus[] {
  if (!output) return [];

  return output.split("\n").filter(Boolean).map((line) => {
    const [status, ...parts] = line.split(/\s+/);
    return {
      status: status || "unknown",
      path: parts.join(" -> ") || "unknown",
    };
  });
}

function statusSummary(files: NameStatus[]): string[] {
  const counts = new Map<string, number>();
  for (const file of files) {
    counts.set(file.status, (counts.get(file.status) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([status, count]) => `${count} file${count === 1 ? "" : "s"} with git status ${status}`);
}

function branchRiskSummary(input: BranchComparisonInput): string[] {
  return unique([
    ...(input.riskCategories.length ? [`Risk categories: ${input.riskCategories.join(", ")}`] : ["Risk categories: none"]),
    ...(input.suggestedReviewPacks.length ? [`Suggested review packs: ${input.suggestedReviewPacks.join(", ")}`] : ["Suggested review packs: none"]),
    ...(input.diffAwareIntegrity.diffFindings.length ? [`Diff-aware findings: ${input.diffAwareIntegrity.diffFindings.length}`] : ["Diff-aware findings: none"]),
  ]);
}

function branchReviewFocus(input: BranchComparisonInput): string[] {
  return unique([
    ...input.suggestedReviewPacks.map((pack) => `Run or attach evidence for ${pack}.`),
    ...input.riskCategories.map((risk) => `Review ${risk} risk across branch changes.`),
    ...(input.diffAwareIntegrity.diffFindings.length ? ["Review diff-aware findings before merge."] : []),
    ...(input.gitContext.workingTreeState === "dirty" ? ["Review working tree changes separately from committed branch comparison."] : []),
  ]);
}

export function buildBranchComparison(input: BranchComparisonInput): BranchComparison {
  const warnings: string[] = [];

  if (input.gitContext.mergeBase === "unknown") {
    return {
      comparisonBase: "unknown",
      comparisonHead: input.gitContext.currentCommit,
      filesChangedAgainstBase: 0,
      commitsAheadOfBase: 0,
      branchChangeSummary: ["Branch comparison unavailable because merge base is unknown."],
      branchRiskSummary: branchRiskSummary(input),
      branchReviewFocus: branchReviewFocus(input),
      branchComparisonWarnings: ["Merge base is unknown; branch comparison could not be calculated."],
    };
  }

  const range = `${input.gitContext.mergeBase}..HEAD`;
  const files = parseNameStatus(git(input.repoPath, ["diff", "--name-status", range]));
  const commitLines = (git(input.repoPath, ["log", "--oneline", range]) || "").split("\n").filter(Boolean);
  const stat = git(input.repoPath, ["diff", "--stat", range]);
  const commitsAheadOfBase = commitLines.length;

  if (commitsAheadOfBase === 0 && input.gitContext.workingTreeState === "dirty") {
    warnings.push("No commits are ahead of base; review is based on working tree changes.");
  }
  if (commitsAheadOfBase > 0 && input.gitContext.workingTreeState === "dirty") {
    warnings.push("Branch comparison includes commits ahead of base while working tree changes are also present.");
  }

  return {
    comparisonBase: input.gitContext.mergeBase,
    comparisonHead: input.gitContext.currentCommit,
    filesChangedAgainstBase: files.length,
    commitsAheadOfBase,
    branchChangeSummary: unique([
      `${files.length} file${files.length === 1 ? "" : "s"} changed against base.`,
      `${commitsAheadOfBase} commit${commitsAheadOfBase === 1 ? "" : "s"} ahead of base.`,
      ...statusSummary(files),
      ...(stat ? ["Git diff stat is available locally but full raw diffs are not included in this report."] : []),
    ]),
    branchRiskSummary: branchRiskSummary(input),
    branchReviewFocus: branchReviewFocus(input),
    branchComparisonWarnings: unique(warnings),
  };
}
