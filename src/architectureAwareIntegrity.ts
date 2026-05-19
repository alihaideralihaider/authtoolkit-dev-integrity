import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { ClassifiedFile, RiskCategory } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type AffectedSystem =
  | "api"
  | "auth"
  | "admin"
  | "payment"
  | "messaging"
  | "runtime"
  | "vault"
  | "database"
  | "ux"
  | "ordering"
  | "release"
  | "unknown";

export type AffectedBoundary =
  | "public-to-private boundary"
  | "admin boundary"
  | "tenant/data boundary"
  | "provider webhook boundary"
  | "payment trust boundary"
  | "runtime/deployment boundary"
  | "secret/config boundary"
  | "customer communication boundary";

export type BlastRadius = "limited" | "moderate" | "broad" | "critical";

export type ArchitectureAwareIntegrityInput = {
  changedFiles: ClassifiedFile[];
  riskCategories: RiskCategory[];
  suggestedReviewPacks: ReviewPack[];
  riskCombinations: RiskCombination[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
};

export type ArchitectureAwareIntegrityResult = {
  affectedSystems: AffectedSystem[];
  affectedBoundaries: AffectedBoundary[];
  dependencySignals: string[];
  blastRadius: BlastRadius;
  architectureWarnings: string[];
  architectureReviewNotes: string[];
  recommendedArchitectureAction: string;
};

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function addSystem(systems: Set<AffectedSystem>, system: AffectedSystem): void {
  systems.add(system);
}

function addBoundary(boundaries: Set<AffectedBoundary>, boundary: AffectedBoundary): void {
  boundaries.add(boundary);
}

function fileText(file: ClassifiedFile): string {
  return file.path.toLowerCase();
}

function systemsFromFile(file: ClassifiedFile, systems: Set<AffectedSystem>): void {
  const text = fileText(file);

  if (/app\/api|\/api\/|route\.(ts|js)|webhook|callback/.test(text)) addSystem(systems, "api");
  if (/auth|session|login|rls/.test(text)) addSystem(systems, "auth");
  if (/admin/.test(text)) addSystem(systems, "admin");
  if (/stripe|payment|billing|checkout/.test(text)) addSystem(systems, "payment");
  if (/twilio|sms|whatsapp|message|voice/.test(text)) addSystem(systems, "messaging");
  if (/wrangler|cloudflare|worker|runtime|binding|deploy|package\.json|src\//.test(text)) addSystem(systems, "runtime");
  if (/env|secret|token|credential|vault|config/.test(text)) addSystem(systems, "vault");
  if (/supabase|database|db|migration|sql/.test(text)) addSystem(systems, "database");
  if (/page|component|ui|dashboard|html|css|styles|menu|hub|storefront/.test(text)) addSystem(systems, "ux");
  if (/order|checkout|cart|menu/.test(text)) addSystem(systems, "ordering");
  if (/release|deploy|canary|rollback/.test(text)) addSystem(systems, "release");
}

function systemsFromRisk(risks: RiskCategory[], systems: Set<AffectedSystem>): void {
  if (risks.includes("security")) {
    addSystem(systems, "auth");
    addSystem(systems, "api");
  }
  if (risks.includes("payment")) addSystem(systems, "payment");
  if (risks.includes("sms-compliance")) addSystem(systems, "messaging");
  if (risks.includes("vault")) addSystem(systems, "vault");
  if (risks.includes("runtime")) addSystem(systems, "runtime");
  if (risks.includes("ux")) addSystem(systems, "ux");
  if (risks.includes("unknown")) addSystem(systems, "unknown");
}

function boundariesFromSignals(
  input: ArchitectureAwareIntegrityInput,
  boundaries: Set<AffectedBoundary>
): void {
  const allText = [
    ...input.changedFiles.map((file) => file.path),
    ...input.diffAwareIntegrity.diffRiskSignals,
    ...input.diffAwareIntegrity.diffFindings.map((finding) => finding.findingName),
    ...input.riskCombinations.map((combination) => combination.name),
  ].join(" ").toLowerCase();

  if (/public|auth|security|api/.test(allText)) addBoundary(boundaries, "public-to-private boundary");
  if (/admin/.test(allText)) addBoundary(boundaries, "admin boundary");
  if (/tenant|service-role|service_role|database|supabase|rls|customer/.test(allText)) addBoundary(boundaries, "tenant/data boundary");
  if (/webhook|callback|provider|twilio|stripe/.test(allText)) addBoundary(boundaries, "provider webhook boundary");
  if (/payment|stripe|checkout|billing/.test(allText)) addBoundary(boundaries, "payment trust boundary");
  if (/runtime|deploy|worker|wrangler|cloudflare|binding|route/.test(allText)) addBoundary(boundaries, "runtime/deployment boundary");
  if (/env|secret|token|key|vault|config|service-role|service_role/.test(allText)) addBoundary(boundaries, "secret/config boundary");
  if (/sms|twilio|whatsapp|message|voice|consent|stop|help/.test(allText)) addBoundary(boundaries, "customer communication boundary");
}

function dependencySignals(
  systems: Set<AffectedSystem>,
  boundaries: Set<AffectedBoundary>
): string[] {
  const signals: string[] = [];

  if (systems.has("api")) signals.push("API route may affect frontend/admin/customer flows.");
  if (boundaries.has("tenant/data boundary")) signals.push("Service-role usage may affect tenant/data boundary.");
  if (systems.has("payment") || boundaries.has("payment trust boundary")) signals.push("Payment webhook may affect order/payment state.");
  if (systems.has("runtime") || boundaries.has("runtime/deployment boundary")) signals.push("Runtime binding may affect deployment target.");
  if (systems.has("messaging") || boundaries.has("customer communication boundary")) signals.push("SMS/voice webhook may affect consent and messaging behavior.");
  if (systems.has("vault") || boundaries.has("secret/config boundary")) signals.push("Env var change may affect runtime availability.");
  if (systems.has("admin")) signals.push("Admin UI change may affect privileged workflows.");
  if (systems.has("database")) signals.push("Database or Supabase change may affect data access behavior.");
  if (systems.has("ordering")) signals.push("Ordering or checkout change may affect customer purchase flow.");

  return unique(signals);
}

function architectureWarnings(
  systems: Set<AffectedSystem>,
  boundaries: Set<AffectedBoundary>,
  input: ArchitectureAwareIntegrityInput
): string[] {
  const warnings: string[] = [];

  if (boundaries.has("payment trust boundary")) warnings.push("Payment trust boundary may be affected.");
  if (boundaries.has("runtime/deployment boundary") && boundaries.has("secret/config boundary")) warnings.push("Runtime and secret/config boundary changed together.");
  if (boundaries.has("admin boundary") || (systems.has("admin") && systems.has("api"))) warnings.push("Admin/API boundary requires authorization review.");
  if (boundaries.has("customer communication boundary")) warnings.push("Customer communication boundary requires compliance review.");
  if (boundaries.has("tenant/data boundary")) warnings.push("Service-role usage requires tenant/data boundary review.");
  if (input.prIntegrity.mergeReadiness !== "ready") warnings.push("Merge readiness indicates architecture-sensitive review evidence is still needed.");
  if (input.releaseReadiness.releaseDecision !== "ready") warnings.push("Release readiness indicates blast radius should be reviewed before release.");
  if (input.runtimeIntegrity.runtimePosture !== "stable") warnings.push("Runtime posture indicates post-release watch may be needed.");

  return unique(warnings);
}

function blastRadius(
  systems: Set<AffectedSystem>,
  boundaries: Set<AffectedBoundary>,
  input: ArchitectureAwareIntegrityInput
): BlastRadius {
  const paymentTrust = boundaries.has("payment trust boundary");
  const securityBoundary = boundaries.has("public-to-private boundary")
    || boundaries.has("admin boundary")
    || boundaries.has("tenant/data boundary");
  const serviceRole = input.diffAwareIntegrity.diffFindings.some((finding) => finding.findingName.includes("service-role"))
    || boundaries.has("tenant/data boundary");
  const publicAdminApi = systems.has("api") || systems.has("admin") || boundaries.has("public-to-private boundary");
  const sensitiveSystems = [...systems].filter((system) =>
    ["api", "auth", "admin", "payment", "messaging", "runtime", "vault", "database", "ordering", "release"].includes(system)
  );

  if ((paymentTrust && securityBoundary) || (serviceRole && publicAdminApi)) return "critical";
  if ((systems.has("runtime") && systems.has("vault")) || sensitiveSystems.length >= 3) return "broad";
  if (sensitiveSystems.length === 1 || sensitiveSystems.length === 2) return "moderate";
  return "limited";
}

function recommendedAction(radius: BlastRadius): string {
  if (radius === "critical") {
    return "Stop and run targeted architecture, security, and release review before merge or release.";
  }
  if (radius === "broad") {
    return "Confirm affected systems, boundaries, and runtime checks before merge or release.";
  }
  if (radius === "moderate") {
    return "Review the affected boundary and confirm the change scope is intentional.";
  }
  return "Continue normal review flow while preserving architecture evidence.";
}

export function evaluateArchitectureAwareIntegrity(
  input: ArchitectureAwareIntegrityInput
): ArchitectureAwareIntegrityResult {
  const systems = new Set<AffectedSystem>();
  const boundaries = new Set<AffectedBoundary>();

  for (const file of input.changedFiles) {
    systemsFromFile(file, systems);
  }
  systemsFromRisk(input.riskCategories, systems);
  boundariesFromSignals(input, boundaries);

  if (!systems.size) systems.add("unknown");

  const radius = blastRadius(systems, boundaries, input);

  return {
    affectedSystems: unique([...systems]),
    affectedBoundaries: unique([...boundaries]),
    dependencySignals: dependencySignals(systems, boundaries),
    blastRadius: radius,
    architectureWarnings: architectureWarnings(systems, boundaries, input),
    architectureReviewNotes: [
      "Confirm affected systems are intentionally coupled.",
      "Confirm no new trust boundary was opened.",
      "Confirm blast radius is understood before merge.",
      "Confirm release and runtime checks match affected systems.",
    ],
    recommendedArchitectureAction: recommendedAction(radius),
  };
}
