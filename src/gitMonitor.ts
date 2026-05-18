import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export type FileChangeStatus = "added" | "modified" | "deleted" | "renamed" | "unknown";

export type FileChange = {
  path: string;
  originalPath?: string;
  status: FileChangeStatus;
  rawStatus: string;
};

export type GitMonitorResult = {
  repoPath: string;
  gitStatus: string;
  diffNameOnly: string;
  changedFiles: FileChange[];
};

function assertGitRepo(repoPath: string): void {
  if (!existsSync(repoPath) || !statSync(repoPath).isDirectory()) {
    throw new Error(`Repo path does not exist or is not a directory: ${repoPath}`);
  }

  const gitPath = path.join(repoPath, ".git");
  if (!existsSync(gitPath)) {
    throw new Error(`Repo path is not a Git repository: ${repoPath}`);
  }
}

function git(repoPath: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoPath,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function statusFromCode(code: string): FileChangeStatus {
  if (code.includes("R")) return "renamed";
  if (code.includes("D")) return "deleted";
  if (code.includes("A") || code.includes("?")) return "added";
  if (code.includes("M")) return "modified";
  return "unknown";
}

function parseStatusLine(line: string): FileChange | null {
  if (!line.trim()) return null;

  const rawStatus = line.slice(0, 2);
  const rest = line.slice(3).trim();
  const status = statusFromCode(rawStatus);

  if (rest.includes(" -> ")) {
    const [originalPath, nextPath] = rest.split(" -> ");
    return {
      path: nextPath,
      originalPath,
      status: "renamed",
      rawStatus,
    };
  }

  return {
    path: rest,
    status,
    rawStatus,
  };
}

export function monitorGit(repoPath: string): GitMonitorResult {
  assertGitRepo(repoPath);

  const gitStatus = git(repoPath, ["status", "--short"]);
  const diffNameOnly = git(repoPath, ["diff", "--name-only"]);
  const statusChanges = gitStatus
    .split("\n")
    .map(parseStatusLine)
    .filter((change): change is FileChange => Boolean(change));

  const seen = new Set(statusChanges.map((change) => change.path));
  const diffOnlyChanges = diffNameOnly
    .split("\n")
    .filter(Boolean)
    .filter((filePath) => !seen.has(filePath))
    .map((filePath) => ({
      path: filePath,
      status: "modified" as const,
      rawStatus: "diff",
    }));

  return {
    repoPath,
    gitStatus,
    diffNameOnly,
    changedFiles: [...statusChanges, ...diffOnlyChanges],
  };
}

