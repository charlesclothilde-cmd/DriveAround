const STORAGE_KEY = "drivearound-data-v2";

const starterData = {
  home: "Versailles",
  sources: [
    {
      id: "movex",
      name: "MoveX",
      note: "Job portal",
      url: "https://www.movex.co.uk/",
    },
    {
      id: "shiply",
      name: "Shiply",
      note: "Transport marketplace",
      url: "https://www.shiply.com/",
    },
  ],
  jobs: [
    {
      id: "sample-1",
      source: "movex",
      vehicle: "Peugeot 308 · exemple",
      from: "Versailles",
      to: "Paris",
      date: todayValue(),
      time: "08:20",
      pay: 74,
      miles: 44,
      gap: 5,
      notes: "Trajet exemple - modifier ou supprimer",
    },
    {
      id: "sample-2",
      source: "movex",
      vehicle: "Renault Clio · exemple",
      from: "Paris",
      to: "Orly",
      date: todayValue(),
      time: "10:35",
      pay: 92,
      miles: 13,
      gap: 3,
      notes: "Trajet exemple - modifier ou supprimer",
    },
    {
      id: "sample-3",
      source: "shiply",
      vehicle: "Citroën C3 · exemple",
      from: "Orly",
      to: "Fontainebleau",
      date: todayValue(),
      time: "12:20",
      pay: 68,
      miles: 35,
      gap: 7,
      notes: "Trajet exemple - modifier ou supprimer",
    },
    {
      id: "sample-4",
      source: "movex",
      vehicle: "Ford Puma · exemple",
      from: "Fontainebleau",
      to: "Chartres",
      date: todayValue(),
      time: "14:10",
      pay: 122,
      miles: 64,
      gap: 11,
      notes: "Trajet exemple - modifier ou supprimer",
    },
    {
      id: "sample-5",
      source: "shiply",
      vehicle: "Nissan Juke · exemple",
      from: "Chartres",
      to: "Versailles",
      date: todayValue(),
      time: "16:25",
      pay: 56,
      miles: 55,
      gap: 2,
      notes: "Trajet exemple - modifier ou supprimer",
    },
  ],
  planIds: [],
};

const state = {
  data: loadData(),
  selectedSource: "all",
  filter: "all",
  query: "",
};

const elements = {
  homeBase: document.querySelector("#homeBase"),
  sourceList: document.querySelector("#sourceList"),
  jobList: document.querySelector("#jobList"),
  planList: document.querySelector("#planList"),
  routeOverview: document.querySelector("#routeOverview"),
  savedJobsCount: document.querySelector("#savedJobsCount"),
  nextSuggestion: document.querySelector("#nextSuggestion"),
  addSuggestion: document.querySelector("#addSuggestion"),
  sourceDialog: document.querySelector("#sourceDialog"),
  sourceForm: document.querySelector("#sourceForm"),
  jobDialog: document.querySelector("#jobDialog"),
  jobForm: document.querySelector("#jobForm"),
  homeDialog: document.querySelector("#homeDialog"),
  homeForm: document.querySelector("#homeForm"),
  toast: document.querySelector("#toast"),
  metrics: {
    earnings: document.querySelector("#metricEarnings"),
    paidMiles: document.querySelector("#metricPaidMiles"),
    gaps: document.querySelector("#metricGapMiles"),
    finish: document.querySelector("#metricFinish"),
  },
};

function todayValue() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.sources && stored?.jobs) {
      const legacySampleIds = new Set(["sample-1", "sample-2", "sample-3", "sample-4", "sample-5"]);
      const hasLegacySamples = stored.jobs.some((job) => legacySampleIds.has(job.id));
      const migratedJobs = hasLegacySamples
        ? [
            ...clone(starterData.jobs),
            ...stored.jobs.filter((job) => !legacySampleIds.has(job.id)),
          ]
        : stored.jobs;

      const migrated = {
        home: stored.home === "Bristol" && hasLegacySamples ? "Versailles" : stored.home || "",
        sources: stored.sources,
        jobs: migratedJobs,
        planIds: hasLegacySamples
          ? (stored.planIds || []).filter((id) => !legacySampleIds.has(id))
          : stored.planIds || [],
      };
      if (hasLegacySamples) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // Invalid saved data falls back to a clean starter set.
  }
  return clone(starterData);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePlace(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function samePlace(a, b) {
  const left = normalizePlace(a);
  const right = normalizePlace(b);
  return left === right || left.startsWith(`${right} `) || right.startsWith(`${left} `);
}

function normalizeUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function getSource(id) {
  return state.data.sources.find((source) => source.id === id);
}

function getPlan() {
  return state.data.planIds
    .map((id) => state.data.jobs.find((job) => job.id === id))
    .filter(Boolean);
}

function getLastStop() {
  const plan = getPlan();
  return plan.length ? plan[plan.length - 1].to : state.data.home;
}

function isCompatible(job) {
  const plan = getPlan();
  return plan.length === 0 || samePlace(job.from, getLastStop());
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number(value) % 1 ? 2 : 0,
  }).format(value);
}

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2400);
}

function renderSources() {
  elements.sourceList.innerHTML = "";

  const allItem = document.createElement("div");
  allItem.className = `source ${state.selectedSource === "all" ? "active" : ""}`;
  allItem.innerHTML = `
    <button class="source-main" type="button" data-source="all">
      <span class="source-icon">A</span>
      <span><strong>All jobs</strong><small>${state.data.jobs.length} available</small></span>
    </button>
  `;
  elements.sourceList.append(allItem);

  state.data.sources.forEach((source, index) => {
    const count = state.data.jobs.filter((job) => job.source === source.id).length;
    const item = document.createElement("div");
    item.className = `source ${state.selectedSource === source.id ? "active" : ""}`;
    item.innerHTML = `
      <button class="source-main" type="button" data-source="${escapeHtml(source.id)}">
        <span class="source-icon tone-${index % 4}">${escapeHtml(source.name.charAt(0).toUpperCase())}</span>
        <span>
          <strong>${escapeHtml(source.name)}</strong>
          <small>${count} jobs · ${escapeHtml(source.note || "Website shortcut")}</small>
        </span>
      </button>
      <span class="source-actions">
        <a class="source-open" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open</a>
        <button class="source-menu" type="button" data-edit-source="${escapeHtml(source.id)}" aria-label="Edit ${escapeHtml(source.name)}">Edit</button>
      </span>
    `;
    elements.sourceList.append(item);
  });
}

function getVisibleJobs() {
  const planIds = new Set(state.data.planIds);
  return state.data.jobs
    .filter((job) => {
      const sourceMatch = state.selectedSource === "all" || job.source === state.selectedSource;
      const text = `${job.vehicle} ${job.from} ${job.to} ${getSource(job.source)?.name || ""} ${job.notes}`.toLowerCase();
      const queryMatch = text.includes(state.query.toLowerCase());
      const filterMatch =
        state.filter === "all" ||
        (state.filter === "near" && isCompatible(job)) ||
        (state.filter === "return" && samePlace(job.to, state.data.home));
      return sourceMatch && queryMatch && filterMatch && !planIds.has(job.id);
    })
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

function renderJobs() {
  const jobs = getVisibleJobs();
  elements.jobList.innerHTML = "";

  if (!jobs.length) {
    elements.jobList.innerHTML = `
      <div class="empty-state">
        <strong>No jobs match this view.</strong>
        <span>Add a job or change the current filter.</span>
        <button class="primary-button slim" type="button" data-empty-add>Add job</button>
      </div>
    `;
    return;
  }

  jobs.forEach((job) => {
    const source = getSource(job.source);
    const homebound = samePlace(job.to, state.data.home);
    const card = document.createElement("article");
    card.className = `job-card ${isCompatible(job) ? "compatible" : ""}`;
    card.innerHTML = `
      <div>
        <div class="job-title-row">
          <h4>${escapeHtml(job.from)} to ${escapeHtml(job.to)}</h4>
          ${isCompatible(job) ? '<span class="match-badge">Matches next</span>' : ""}
        </div>
        <p class="vehicle-line">${escapeHtml(job.vehicle)}</p>
        <div class="job-meta">
          <span>${escapeHtml(source?.name || "Other")}</span>
          <span>${formatDate(job.date)} · ${escapeHtml(job.time)}</span>
          <span>${Number(job.miles)} paid km</span>
          <span>${Number(job.gap)} km gap</span>
        </div>
        ${job.notes ? `<p class="job-note">${escapeHtml(job.notes)}</p>` : ""}
        ${homebound ? '<div class="job-tags"><span class="good">Gets home</span></div>' : ""}
      </div>
      <div class="job-pay">
        <strong>${formatMoney(Number(job.pay))}</strong>
        <div class="card-actions">
          <button class="icon-button" type="button" data-edit-job="${escapeHtml(job.id)}" aria-label="Edit job" title="Edit job">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="primary-button slim" type="button" data-add="${escapeHtml(job.id)}">Add leg</button>
        </div>
      </div>
    `;
    elements.jobList.append(card);
  });
}

function renderPlan() {
  const plan = getPlan();
  elements.planList.innerHTML = "";

  if (!plan.length) {
    elements.planList.innerHTML = `
      <li class="empty-state">
        <strong>No route planned yet.</strong>
        <span>Add a leg manually or build the best chain.</span>
      </li>
    `;
  } else {
    plan.forEach((job, index) => {
      const previousStop = index === 0 ? state.data.home : plan[index - 1].to;
      const connected = samePlace(job.from, previousStop);
      const item = document.createElement("li");
      item.className = `plan-item ${connected ? "" : "disconnected"}`;
      item.innerHTML = `
        <span class="plan-number">${index + 1}</span>
        <div>
          <h4>${escapeHtml(job.from)} to ${escapeHtml(job.to)}</h4>
          <p>${escapeHtml(job.vehicle)} · ${escapeHtml(job.time)} · ${formatMoney(Number(job.pay))}</p>
          ${connected ? "" : `<small class="warning">Reposition needed from ${escapeHtml(previousStop)}</small>`}
        </div>
        <button class="remove-button" type="button" aria-label="Remove ${escapeHtml(job.vehicle)}" data-remove="${escapeHtml(job.id)}">x</button>
      `;
      elements.planList.append(item);
    });
  }

  renderRouteOverview(plan);
  updateMetrics(plan);
  updateSuggestion();
  renderJobs();
  renderSources();
}

function renderRouteOverview(plan) {
  const stops = [state.data.home, ...plan.map((job) => job.to)].filter(Boolean);
  elements.routeOverview.innerHTML = stops
    .map(
      (stop, index) => `
        <div class="route-stop ${index === 0 ? "home-stop" : ""}">
          <span>${index === 0 ? "H" : index}</span>
          <strong>${escapeHtml(stop)}</strong>
        </div>
        ${index < stops.length - 1 ? '<span class="route-arrow">→</span>' : ""}
      `,
    )
    .join("");
}

function updateMetrics(plan) {
  const earnings = plan.reduce((sum, job) => sum + Number(job.pay), 0);
  const paidMiles = plan.reduce((sum, job) => sum + Number(job.miles), 0);
  const gaps = plan.reduce((sum, job) => sum + Number(job.gap), 0);
  const lastStop = plan.length ? plan[plan.length - 1].to : state.data.home;

  elements.metrics.earnings.textContent = formatMoney(earnings);
  elements.metrics.paidMiles.textContent = String(paidMiles);
  elements.metrics.gaps.textContent = `${gaps} km`;
  elements.metrics.finish.textContent = samePlace(lastStop, state.data.home) ? "Home" : lastStop || "Not set";
}

function rankJob(job) {
  const homeBonus = samePlace(job.to, state.data.home) ? 30 : 0;
  return Number(job.pay) - Number(job.gap) * 1.25 + homeBonus;
}

function getBestNextJob() {
  const planIds = new Set(state.data.planIds);
  const available = state.data.jobs.filter((job) => !planIds.has(job.id));
  const compatible = available.filter((job) => isCompatible(job));
  return compatible.sort((a, b) => rankJob(b) - rankJob(a))[0];
}

function updateSuggestion() {
  const suggestion = getBestNextJob();
  if (!suggestion) {
    elements.nextSuggestion.textContent = "No direct next leg. Add a job from the current finish.";
    elements.addSuggestion.disabled = true;
    delete elements.addSuggestion.dataset.id;
    return;
  }

  elements.nextSuggestion.textContent = `${suggestion.from} to ${suggestion.to} for ${formatMoney(Number(suggestion.pay))}.`;
  elements.addSuggestion.disabled = false;
  elements.addSuggestion.dataset.id = suggestion.id;
}

function buildBestChain() {
  const unused = [...state.data.jobs];
  const chain = [];
  let current = state.data.home;

  while (unused.length) {
    const candidates = unused.filter((job) => samePlace(job.from, current));
    if (!candidates.length) break;
    candidates.sort((a, b) => rankJob(b) - rankJob(a));
    const next = candidates[0];
    chain.push(next);
    current = next.to;
    unused.splice(unused.findIndex((job) => job.id === next.id), 1);
  }

  state.data.planIds = chain.map((job) => job.id);
  saveData();
  renderPlan();
  showToast(chain.length ? `Built a ${chain.length}-leg chain` : "Add jobs before building a chain");
}

function addJobToPlan(id) {
  if (!state.data.planIds.includes(id)) {
    state.data.planIds.push(id);
    saveData();
    renderPlan();
  }
}

function populateSourceSelect(selectedId = "") {
  const select = document.querySelector("#jobSource");
  select.innerHTML = state.data.sources
    .map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.name)}</option>`)
    .join("");
  if (selectedId) select.value = selectedId;
}

function openJobDialog(job = null) {
  elements.jobForm.reset();
  document.querySelector("#jobDialogTitle").textContent = job ? "Edit job" : "Add job";
  document.querySelector("#jobId").value = job?.id || "";
  document.querySelector("#jobFrom").value = job?.from || "";
  document.querySelector("#jobTo").value = job?.to || "";
  document.querySelector("#jobDate").value = job?.date || todayValue();
  document.querySelector("#jobTime").value = job?.time || "09:00";
  document.querySelector("#jobPay").value = job?.pay ?? "";
  document.querySelector("#jobMiles").value = job?.miles ?? "";
  document.querySelector("#jobGap").value = job?.gap ?? 0;
  document.querySelector("#jobVehicle").value = job?.vehicle || "";
  document.querySelector("#jobNotes").value = job?.notes || "";
  document.querySelector("#deleteJob").hidden = !job;
  populateSourceSelect(job?.source);
  elements.jobDialog.showModal();
}

function openSourceDialog(source = null) {
  elements.sourceForm.reset();
  document.querySelector("#sourceDialogTitle").textContent = source ? "Edit website" : "Add website";
  document.querySelector("#sourceId").value = source?.id || "";
  document.querySelector("#siteName").value = source?.name || "";
  document.querySelector("#siteUrl").value = source?.url || "";
  document.querySelector("#siteNotes").value = source?.note || "";
  document.querySelector("#deleteSource").hidden = !source;
  elements.sourceDialog.showModal();
}

function deleteJob(id) {
  state.data.jobs = state.data.jobs.filter((job) => job.id !== id);
  state.data.planIds = state.data.planIds.filter((jobId) => jobId !== id);
  saveData();
  renderAll();
  showToast("Job removed");
}

function deleteSource(id) {
  const used = state.data.jobs.some((job) => job.source === id);
  if (used) {
    showToast("Remove or reassign this website's jobs first");
    return;
  }
  state.data.sources = state.data.sources.filter((source) => source.id !== id);
  if (state.selectedSource === id) state.selectedSource = "all";
  saveData();
  renderAll();
  showToast("Website removed");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `drivearound-backup-${todayValue()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Backup downloaded");
}

async function importData(file) {
  try {
    const incoming = JSON.parse(await file.text());
    if (!Array.isArray(incoming.sources) || !Array.isArray(incoming.jobs)) throw new Error();
    state.data = {
      home: incoming.home || "",
      sources: incoming.sources,
      jobs: incoming.jobs,
      planIds: incoming.planIds || [],
    };
    saveData();
    renderAll();
    showToast("Backup imported");
  } catch {
    showToast("That backup file could not be read");
  }
}

function renderAll() {
  elements.homeBase.textContent = state.data.home || "Set home";
  elements.savedJobsCount.textContent = String(state.data.jobs.length);
  document.querySelector("#dateLabel").textContent = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  renderSources();
  renderPlan();
}

elements.sourceList.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-source]");
  const editButton = event.target.closest("[data-edit-source]");
  if (filterButton) {
    state.selectedSource = filterButton.dataset.source;
    renderSources();
    renderJobs();
  }
  if (editButton) openSourceDialog(getSource(editButton.dataset.editSource));
});

elements.jobList.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const editButton = event.target.closest("[data-edit-job]");
  if (addButton) addJobToPlan(addButton.dataset.add);
  if (editButton) openJobDialog(state.data.jobs.find((job) => job.id === editButton.dataset.editJob));
  if (event.target.closest("[data-empty-add]")) openJobDialog();
});

elements.planList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (!removeButton) return;
  state.data.planIds = state.data.planIds.filter((id) => id !== removeButton.dataset.remove);
  saveData();
  renderPlan();
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".segmented button.active").classList.remove("active");
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderJobs();
  });
});

document.querySelector("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderJobs();
});

document.querySelector("#addJob").addEventListener("click", () => openJobDialog());
document.querySelector("#addSource").addEventListener("click", () => openSourceDialog());
document.querySelector("#optimizeButton").addEventListener("click", buildBestChain);
document.querySelector("#clearPlan").addEventListener("click", () => {
  state.data.planIds = [];
  saveData();
  renderPlan();
});
document.querySelector("#addSuggestion").addEventListener("click", (event) => addJobToPlan(event.currentTarget.dataset.id));
document.querySelector("#deleteJob").addEventListener("click", () => {
  const id = document.querySelector("#jobId").value;
  if (!id) return;
  elements.jobDialog.close();
  deleteJob(id);
});
document.querySelector("#deleteSource").addEventListener("click", () => {
  const id = document.querySelector("#sourceId").value;
  if (!id) return;
  const before = state.data.sources.length;
  deleteSource(id);
  if (state.data.sources.length < before) elements.sourceDialog.close();
});

document.querySelector("#editHome").addEventListener("click", () => {
  document.querySelector("#homeInput").value = state.data.home;
  elements.homeDialog.showModal();
});

elements.homeForm.addEventListener("submit", (event) => {
  if (event.submitter?.value !== "save") return;
  state.data.home = document.querySelector("#homeInput").value.trim();
  saveData();
  renderAll();
  showToast("Home base saved");
});

elements.sourceForm.addEventListener("submit", (event) => {
  if (event.submitter?.value !== "save") return;
  const id = document.querySelector("#sourceId").value;
  const source = {
    id: id || makeId("source"),
    name: document.querySelector("#siteName").value.trim(),
    url: normalizeUrl(document.querySelector("#siteUrl").value.trim()),
    note: document.querySelector("#siteNotes").value.trim(),
  };
  const existing = state.data.sources.findIndex((item) => item.id === id);
  if (existing >= 0) state.data.sources[existing] = source;
  else state.data.sources.push(source);
  saveData();
  renderAll();
  showToast(id ? "Website updated" : "Website added");
});

elements.jobForm.addEventListener("submit", (event) => {
  if (event.submitter?.value !== "save") return;
  const id = document.querySelector("#jobId").value;
  const job = {
    id: id || makeId("job"),
    source: document.querySelector("#jobSource").value,
    vehicle: document.querySelector("#jobVehicle").value.trim(),
    from: document.querySelector("#jobFrom").value.trim(),
    to: document.querySelector("#jobTo").value.trim(),
    date: document.querySelector("#jobDate").value,
    time: document.querySelector("#jobTime").value,
    pay: Number(document.querySelector("#jobPay").value),
    miles: Number(document.querySelector("#jobMiles").value),
    gap: Number(document.querySelector("#jobGap").value),
    notes: document.querySelector("#jobNotes").value.trim(),
  };
  const existing = state.data.jobs.findIndex((item) => item.id === id);
  if (existing >= 0) state.data.jobs[existing] = job;
  else state.data.jobs.push(job);
  saveData();
  renderAll();
  showToast(id ? "Job updated" : "Job added");
});

document.querySelector("#exportData").addEventListener("click", exportData);
document.querySelector("#importData").addEventListener("click", () => document.querySelector("#importFile").click());
document.querySelector("#importFile").addEventListener("change", (event) => {
  if (event.target.files[0]) importData(event.target.files[0]);
  event.target.value = "";
});

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
    event.preventDefault();
    openJobDialog();
  }
});

renderAll();
