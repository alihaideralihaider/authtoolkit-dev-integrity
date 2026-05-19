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
  diffLines: GitDiffLine[];
  changedFiles: FileChange[];
};

export type GitDiffLine = {
  filePath: string;
  changeType: "added" | "removed";
  lineNumber?: number;
  hunkHeader?: string;
  text: string;
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

function parseDiffLines(diffOutput: string): GitDiffLine[] {
  const lines: GitDiffLine[] = [];
  let currentFile = "";
  let hunkHeader = "";
  let nextAddedLine: number | undefined;
  let nextRemovedLine: number | undefined;

  for (const line of diffOutput.split("\n")) {
    if (line.startsWith("diff --git ")) {
      currentFile = "";
      hunkHeader = "";
      nextAddedLine = undefined;
      nextRemovedLine = undefined;
      continue;
    }

    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      continue;
    }

    if (line.startsWith("@@")) {
      hunkHeader = line;
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      nextRemovedLine = match ? Number(match[1]) : undefined;
      nextAddedLine = match ? Number(match[2]) : undefined;
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push({
        filePath: currentFile,
        changeType: "added",
        lineNumber: nextAddedLine,
        hunkHeader,
        text: line.slice(1),
      });
      if (nextAddedLine !== undefined) nextAddedLine += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      lines.push({
        filePath: currentFile,
        changeType: "removed",
        lineNumber: nextRemovedLine,
        hunkHeader,
        text: line.slice(1),
      });
      if (nextRemovedLine !== undefined) nextRemovedLine += 1;
      continue;
    }
  }

  return lines;
}

export function monitorGit(repoPath: string): GitMonitorResult {
  assertGitRepo(repoPath);

  const gitStatus = git(repoPath, ["status", "--short"]);
  const diffNameOnly = git(repoPath, ["diff", "--name-only"]);
  const diffUnifiedZero = git(repoPath, ["diff", "--unified=0"]);
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
    diffLines: parseDiffLines(diffUnifiedZero),
    changedFiles: [...statusChanges, ...diffOnlyChanges],
  };
}
