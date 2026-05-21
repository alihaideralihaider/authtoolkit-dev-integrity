const paths = {
  catalog: "../../reports/catalog.json",
  timeline: "../../reports/timeline-summary.md",
};

const state = {
  catalog: [],
  timeline: "",
};

function text(value, fallback = "unknown") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function shortRepo(repoPath) {
  return text(repoPath).split(/[\\/]/).filter(Boolean).pop() || text(repoPath);
}

function statusClass(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function status(value) {
  return `<span class="status ${statusClass(value)}">${text(value)}</span>`;
}

function metricCard(title, metric, rows = []) {
  return `
    <h2>${title}</h2>
    <div class="metric">${metric}</div>
    <div class="kv">
      ${rows.map(([label, value]) => `<div><span>${label}</span><span>${value}</span></div>`).join("")}
    </div>
  `;
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

async function fetchJson(path) {
  return JSON.parse(await fetchText(path));
}

function renderMissing(message) {
  const missing = document.getElementById("missing");
  missing.classList.remove("hidden");
  missing.querySelector("p").textContent = message;
}

function renderLatest(entry) {
  document.getElementById("latest-review").innerHTML = metricCard("Latest Review Summary", shortRepo(entry.repoPath), [
    ["Generated", text(entry.generatedAt)],
    ["Skill", text(entry.selectedSkill)],
    ["Report", entry.reportPath ? `<a href="../../${entry.reportPath}">${entry.reportPath}</a>` : "none"],
  ]);

  document.getElementById("control-room").innerHTML = metricCard("Control Room", status(entry.controlRoomStatus), [
    ["Decision", status(entry.overallIntegrityDecision)],
    ["Trust", status(entry.operationalTrustLevel)],
    ["Workflow", status(entry.workflowPriority)],
  ]);

  document.getElementById("release-gate").innerHTML = metricCard("Release Gate", `${text(entry.releaseGateScore, "0")}`, [
    ["Band", status(entry.releaseGateConfidenceBand)],
    ["Release Signal", `${text(entry.releaseSignalProvider)}/${text(entry.releaseSignalConclusion)}`],
    ["PR Readiness", status(entry.prReadinessLabel)],
  ]);

  document.getElementById("git-branch").innerHTML = metricCard("Git / Branch / GitHub", text(entry.currentBranch), [
    ["Base", text(entry.baseBranch)],
    ["Branch Diff", `${text(entry.commitsAheadOfBase, "0")} commits / ${text(entry.filesChangedAgainstBase, "0")} files`],
    ["GitHub Checks", `${text(entry.githubFailedChecks, "0")} failed / ${text(entry.githubPendingChecks, "0")} pending`],
    ["Actions", `${text(entry.githubActionsFailedRuns, "0")} failed / ${text(entry.githubActionsPendingRuns, "0")} pending`],
  ]);

  const workflows = Array.isArray(entry.activeWorkflows) ? entry.activeWorkflows : [];
  document.getElementById("active-workflows").innerHTML = workflows.length
    ? workflows.map((workflow) => `<span class="pill">${workflow}</span>`).join("")
    : `<span class="muted">none</span>`;
}

function renderTimeline() {
  document.getElementById("timeline-summary").textContent = state.timeline || "reports/timeline-summary.md is missing. Run a review first.";
}

function renderReports() {
  document.getElementById("report-count").textContent = `${state.catalog.length} reports`;
  document.getElementById("recent-reports").innerHTML = state.catalog.map((entry) => `
    <tr>
      <td>${text(entry.generatedAt)}</td>
      <td>${shortRepo(entry.repoPath)}</td>
      <td>${status(entry.overallIntegrityDecision)}</td>
      <td>${status(entry.operationalTrustLevel)}</td>
      <td>${status(entry.workflowPriority)}</td>
      <td>${text(entry.releaseGateScore, "0")} / ${status(entry.releaseGateConfidenceBand)}</td>
      <td><a href="../../${entry.reportPath}">${text(entry.reportPath)}</a></td>
    </tr>
  `).join("");
}

async function init() {
  try {
    state.catalog = await fetchJson(paths.catalog);
  } catch (error) {
    renderMissing("reports/catalog.json is missing or unreadable. Run a review first.");
    state.catalog = [];
  }

  try {
    state.timeline = await fetchText(paths.timeline);
  } catch {
    state.timeline = "reports/timeline-summary.md is missing. Run a review first.";
  }

  const latest = state.catalog[0];
  if (!latest) {
    renderMissing("No report catalog entries were found. Run a review first.");
    return;
  }

  renderLatest(latest);
  renderTimeline();
  renderReports();
}

init();
