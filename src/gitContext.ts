import { execFileSync } from "node:child_process";

export type GitContext = {
  currentBranch: string;
  baseBranch: string;
  currentCommit: string;
  mergeBase: string;
  commitRange: string;
  commitsInRange: string[];
  aheadBehindSummary: string;
  workingTreeState: string;
  gitContextWarnings: string[];
};

type GitContextInput = {
  repoPath: string;
  gitStatus: string;
  baseBranch?: string;
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

function branchExists(repoPath: string, branch: string): boolean {
  return Boolean(git(repoPath, ["rev-parse", "--verify", branch]));
}

function resolveBaseBranch(repoPath: string, requestedBaseBranch: string | undefined, warnings: string[]): string {
  if (requestedBaseBranch?.trim()) {
    const branch = requestedBaseBranch.trim();
    if (!branchExists(repoPath, branch)) {
      warnings.push(`Requested base branch could not be resolved locally: ${branch}`);
    }
    return branch;
  }

  for (const branch of ["origin/main", "main", "origin/master", "master"]) {
    if (branchExists(repoPath, branch)) return branch;
  }

  warnings.push("No local base branch could be resolved from origin/main, main, origin/master, or master.");
  return "unknown";
}

function commitRange(mergeBase: string, currentCommit: string): string {
  if (mergeBase === "unknown" || currentCommit === "unknown") return "unknown";
  return `${mergeBase}..${currentCommit}`;
}

function commitsInRange(repoPath: string, mergeBase: string): string[] {
  if (mergeBase === "unknown") return [];
  const output = git(repoPath, ["log", "--oneline", `${mergeBase}..HEAD`]);
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

function aheadBehindSummary(repoPath: string, baseBranch: string, warnings: string[]): string {
  if (baseBranch === "unknown") return "unknown";
  const output = git(repoPath, ["rev-list", "--left-right", "--count", `${baseBranch}...HEAD`]);
  if (!output) {
    warnings.push(`Could not calculate ahead/behind summary against base branch: ${baseBranch}`);
    return "unknown";
  }

  const [behind, ahead] = output.split(/\s+/);
  if (!behind || !ahead) return "unknown";
  return `ahead ${ahead}, behind ${behind}`;
}

export function collectGitContext(input: GitContextInput): GitContext {
  const warnings: string[] = [];
  const currentBranch = git(input.repoPath, ["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown";
  if (currentBranch === "unknown") warnings.push("Could not resolve current branch.");

  const currentCommit = git(input.repoPath, ["rev-parse", "HEAD"]) || "unknown";
  if (currentCommit === "unknown") warnings.push("Could not resolve current commit.");

  const baseBranch = resolveBaseBranch(input.repoPath, input.baseBranch, warnings);
  const mergeBase = baseBranch === "unknown"
    ? "unknown"
    : git(input.repoPath, ["merge-base", "HEAD", baseBranch]) || "unknown";
  if (baseBranch !== "unknown" && mergeBase === "unknown") {
    warnings.push(`Could not resolve merge base against base branch: ${baseBranch}`);
  }

  const workingTreeState = input.gitStatus.trim() ? "dirty" : "clean";

  return {
    currentBranch,
    baseBranch,
    currentCommit,
    mergeBase,
    commitRange: commitRange(mergeBase, currentCommit),
    commitsInRange: commitsInRange(input.repoPath, mergeBase),
    aheadBehindSummary: aheadBehindSummary(input.repoPath, baseBranch, warnings),
    workingTreeState,
    gitContextWarnings: warnings,
  };
}
