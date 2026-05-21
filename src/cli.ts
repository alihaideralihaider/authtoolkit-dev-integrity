import { runReview } from "./reviewRunner.ts";
import { writeReport } from "./reportWriter.ts";
import { writeGitHubPrCommentDraft } from "./githubPrCommentDraft.ts";

type CliArgs = {
  repo?: string;
  skill?: string;
  buildSummary?: string;
  baseBranch?: string;
  cicdSummary?: string;
  releaseSignals?: string;
  githubRepo?: string;
  githubPr?: string;
  githubTokenEnv?: string;
  githubActionsContext?: boolean;
  githubCommentDraft?: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--repo" && next) {
      args.repo = next;
      index += 1;
    } else if (arg === "--skill" && next) {
      args.skill = next;
      index += 1;
    } else if (arg === "--build-summary" && next) {
      args.buildSummary = next;
      index += 1;
    } else if (arg === "--base-branch" && next) {
      args.baseBranch = next;
      index += 1;
    } else if (arg === "--cicd-summary" && next) {
      args.cicdSummary = next;
      index += 1;
    } else if (arg === "--release-signals" && next) {
      args.releaseSignals = next;
      index += 1;
    } else if (arg === "--github-repo" && next) {
      args.githubRepo = next;
      index += 1;
    } else if (arg === "--github-pr" && next) {
      args.githubPr = next;
      index += 1;
    } else if (arg === "--github-token-env" && next) {
      args.githubTokenEnv = next;
      index += 1;
    } else if (arg === "--github-actions-context") {
      args.githubActionsContext = true;
    } else if (arg === "--github-comment-draft") {
      args.githubCommentDraft = true;
    }
  }

  return args;
}

function printUsage(): void {
  console.error("Usage: npm run review -- --repo /path/to/repo --skill vault-secret-readiness-review [--build-summary /path/to/build-summary.json] [--base-branch main] [--cicd-summary /path/to/cicd-summary.json] [--release-signals /path/to/release-signals.json] [--github-repo owner/repo --github-pr 123 --github-token-env GITHUB_TOKEN] [--github-actions-context] [--github-comment-draft]");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.repo || !args.skill) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = await runReview({
    repoPath: args.repo,
    selectedSkill: args.skill,
    buildSummaryPath: args.buildSummary,
    baseBranch: args.baseBranch,
    cicdSummaryPath: args.cicdSummary,
    releaseSignalsPath: args.releaseSignals,
    githubRepo: args.githubRepo,
    githubPr: args.githubPr,
    githubTokenEnv: args.githubTokenEnv,
    githubActionsContext: args.githubActionsContext,
  });
  const reportPath = writeReport(result);
  const commentDraftPath = args.githubCommentDraft
    ? writeGitHubPrCommentDraft({ result, reportPath })
    : undefined;

  console.log("AuthToolkit Dev Integrity review complete");
  console.log(`Report: ${reportPath}`);
  if (commentDraftPath) {
    console.log(`GitHub PR comment draft: ${commentDraftPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
