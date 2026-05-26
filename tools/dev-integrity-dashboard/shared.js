const artifactPaths = {
  catalog: "../../reports/catalog.json",
  runState: "../../reports/state/index.json",
  timeline: "../../reports/timeline-summary.md",
};

const navItems = [
  ["Overview", "./", "overview"],
  ["Reviews", "reviews", "reviews"],
  ["Release Gates", "release-gates", "release-gates"],
  ["Workflows", "workflows", "workflows"],
  ["Timeline", "timeline", "timeline"],
  ["GitHub", "github", "github"],
];

function text(value, fallback = "unknown") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function formatPercent(value) {
  if (value === undefined || value === null || value === "") return "unknown";
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  return `${Math.min(100, Math.max(0, Math.round(number)))}%`;
}

function missingField(label = "Data unavailable") {
  return `<span class="muted">${escapeHtml(label)}</span>`;
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function emptyList(message) {
  return emptyState(message);
}

function noWorkflows() {
  return emptyState("No active workflows in current artifacts.");
}

function noBlockers() {
  return emptyState("No blockers detected in current artifacts.");
}

function noGithubFailures() {
  return emptyState("No GitHub failures detected.");
}

function escapeHtml(value) {
  return text(value, "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[char]);
}

function shortRepo(repoPath) {
  return text(repoPath).split(/[\\/]/).filter(Boolean).pop() || text(repoPath);
}

function statusClass(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function status(value) {
  return `<span class="status ${statusClass(value)}">${escapeHtml(text(value))}</span>`;
}

function reportHref(reportPath) {
  return reportPath ? `../../${reportPath}` : "";
}

function normalizeHeading(value) {
  return text(value, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function sectionItems(markdown, heading) {
  const target = normalizeHeading(heading);
  const lines = text(markdown, "").split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    return match && normalizeHeading(match[1]) === target;
  });
  if (start === -1) return [];

  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,3}#{1,6}\s+/.test(line)) break;
    section.push(line);
  }

  return section
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2));
}

function summaryValue(markdown, label, fallback = "Timeline data unavailable.") {
  const item = sectionItems(markdown, "Summary").find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  const value = item ? item.slice(label.length + 1).trim() : "";
  return value || fallback;
}

function unique(values) {
  return [...new Set(values.map((value) => text(value, "").trim()).filter(Boolean))];
}

function repoParam(value) {
  return encodeURIComponent(shortRepo(value));
}

function withRepoParam(href, selectedRepo) {
  if (!selectedRepo) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}repo=${repoParam(selectedRepo)}`;
}

function catalogRepos(catalog) {
  return catalog.reduce((repos, entry) => {
    if (!entry.repoPath || repos.some((repo) => repo.path === entry.repoPath)) return repos;
    repos.push({
      path: entry.repoPath,
      name: shortRepo(entry.repoPath),
      count: catalog.filter((candidate) => candidate.repoPath === entry.repoPath).length,
      latestAt: entry.generatedAt,
    });
    return repos;
  }, []);
}

function getSelectedRepo(catalog) {
  const requested = new URLSearchParams(window.location.search).get("repo");
  const repos = catalogRepos(catalog);
  if (requested) {
    const match = repos.find((repo) => repo.path === requested || repo.name === requested);
    return match ? match.path : requested;
  }
  return repos[0]?.path || "";
}

function filterCatalogByRepo(catalog, selectedRepo) {
  if (!selectedRepo) return catalog;
  return catalog.filter((entry) => entry.repoPath === selectedRepo || shortRepo(entry.repoPath) === selectedRepo);
}

function renderNav(currentPage, selectedRepo = "") {
  const nav = document.getElementById("primary-nav");
  if (!nav) return;

  if (!nav.children.length) {
    nav.innerHTML = navItems.map(([label, href, page]) => `
      <a href="${withRepoParam(href, selectedRepo)}" data-page="${page}">${label}</a>
    `).join("");
  }

  nav.querySelectorAll("a").forEach((link) => {
    const baseHref = navItems.find(([, , page]) => page === link.dataset.page)?.[1];
    if (baseHref) link.setAttribute("href", withRepoParam(baseHref, selectedRepo));
    link.classList.toggle("active", link.dataset.page === currentPage);
  });
}

function renderRepoContext(catalog, selectedRepo, scopedCatalog) {
  const context = document.getElementById("repo-context");
  if (!context) return;

  const repos = catalogRepos(catalog);
  const selectedName = shortRepo(selectedRepo);
  const latest = scopedCatalog[0] || {};
  const hasSelectedOption = repos.some((repo) => repo.path === selectedRepo || repo.name === selectedRepo);
  const options = repos.map((repo) => `
    <option value="${escapeHtml(repo.name)}" ${repo.path === selectedRepo || repo.name === selectedRepo ? "selected" : ""}>
      ${escapeHtml(repo.name)}
    </option>
  `).join("");

  context.innerHTML = `
    <div class="repo-banner">
      <div>
        <span class="repo-label">Current Repo</span>
        <strong>${escapeHtml(selectedName)}</strong>
      </div>
      <div class="repo-meta">
        <span>${escapeHtml(text(scopedCatalog.length, "0"))} reports</span>
        <span>Latest: ${escapeHtml(text(latest.generatedAt, "No reports found"))}</span>
      </div>
    </div>
    <label class="repo-selector">
      <span>Repo</span>
      <select id="repo-select">
        ${hasSelectedOption ? "" : `<option selected value="${escapeHtml(selectedName)}">${escapeHtml(selectedName)}</option>`}
        ${options}
      </select>
    </label>
  `;

  const select = document.getElementById("repo-select");
  if (!select) return;
  select.addEventListener("change", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("repo", select.value);
    window.location.href = url.href;
  });
}

function showMissing(message) {
  const missing = document.getElementById("missing");
  if (!missing) return;
  missing.classList.remove("hidden");
  const body = missing.querySelector("p");
  if (body) body.textContent = message;
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

async function fetchJson(path) {
  return JSON.parse(await fetchText(path));
}

async function loadArtifacts() {
  const artifacts = {
    catalog: [],
    runState: { runs: [] },
    timeline: "",
    catalogError: null,
    runStateError: null,
    timelineError: null,
  };

  try {
    artifacts.catalog = await fetchJson(artifactPaths.catalog);
  } catch (error) {
    artifacts.catalogError = error;
  }

  try {
    artifacts.timeline = await fetchText(artifactPaths.timeline);
  } catch (error) {
    artifacts.timelineError = error;
    artifacts.timeline = "reports/timeline-summary.md is missing. Run a review first.";
  }

  try {
    artifacts.runState = await fetchJson(artifactPaths.runState);
  } catch (error) {
    artifacts.runStateError = error;
    artifacts.runState = { runs: [] };
  }

  return artifacts;
}

window.IntegrityDashboard = {
  artifactPaths,
  emptyList,
  emptyState,
  escapeHtml,
  formatPercent,
  filterCatalogByRepo,
  getSelectedRepo,
  loadArtifacts,
  missingField,
  noBlockers,
  noGithubFailures,
  noWorkflows,
  reportHref,
  renderNav,
  renderRepoContext,
  sectionItems,
  shortRepo,
  showMissing,
  status,
  summaryValue,
  text,
  unique,
};
