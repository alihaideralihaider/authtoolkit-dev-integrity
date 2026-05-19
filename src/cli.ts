import { runReview } from "./reviewRunner.ts";
import { writeReport } from "./reportWriter.ts";

type CliArgs = {
  repo?: string;
  skill?: string;
  buildSummary?: string;
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
    }
  }

  return args;
}

function printUsage(): void {
  console.error("Usage: npm run review -- --repo /path/to/repo --skill vault-secret-readiness-review [--build-summary /path/to/build-summary.json]");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.repo || !args.skill) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = runReview({
    repoPath: args.repo,
    selectedSkill: args.skill,
    buildSummaryPath: args.buildSummary,
  });
  const reportPath = writeReport(result);

  console.log("AuthToolkit Dev Integrity review complete");
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
