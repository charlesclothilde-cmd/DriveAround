const jobs = [
  {
    id: "mx-104",
    source: "movex",
    vehicle: "Audi A3",
    from: "Bristol",
    to: "Cheltenham",
    start: "08:20",
    pay: 74,
    miles: 44,
    gap: 5,
    tags: ["near home", "dealer handover"],
  },
  {
    id: "dl-221",
    source: "dealer",
    vehicle: "VW Golf",
    from: "Cheltenham",
    to: "Oxford",
    start: "10:35",
    pay: 92,
    miles: 41,
    gap: 3,
    tags: ["tight match", "fuel card"],
  },
  {
    id: "sh-552",
    source: "shiply",
    vehicle: "BMW 3 Series",
    from: "Oxford",
    to: "Reading",
    start: "12:20",
    pay: 68,
    miles: 27,
    gap: 7,
    tags: ["quick leg", "train backup"],
  },
  {
    id: "mx-118",
    source: "movex",
    vehicle: "Ford Puma",
    from: "Reading",
    to: "Bath",
    start: "14:10",
    pay: 122,
    miles: 78,
    gap: 11,
    tags: ["heads home", "good pay"],
  },
  {
    id: "dl-235",
    source: "dealer",
    vehicle: "Nissan Juke",
    from: "Bath",
    to: "Bristol",
    start: "16:25",
    pay: 56,
    miles: 13,
    gap: 2,
    tags: ["gets home", "simple finish"],
  },
  {
    id: "sh-570",
    source: "shiply",
    vehicle: "Mini Cooper",
    from: "Swindon",
    to: "Birmingham",
    start: "13:00",
    pay: 116,
    miles: 74,
    gap: 38,
    tags: ["higher gap", "watch"],
  },
];

const defaultSources = [
  {
    id: "all",
    name: "All jobs",
    source: "all",
    note: "18 new legs",
    url: "",
    icon: "A",
    tone: "",
    locked: true,
  },
  {
    id: "movex",
    name: "MoveX",
    source: "movex",
    note: "7 listed today",
    url: "https://www.movex.co.uk/",
    icon: "M",
    tone: "teal",
    locked: true,
  },
  {
    id: "shiply",
    name: "Shiply",
    source: "shiply",
    note: "5 suitable",
    url: "https://www.shiply.com/",
    icon: "S",
    tone: "lime",
    locked: true,
  },
  {
    id: "dealer",
    name: "Dealer portals",
    source: "dealer",
    note: "4 direct offers",
    url: "",
    icon: "D",
    tone: "coral",
    locked: true,
  },
  {
    id: "saved",
    name: "Favourites",
    source: "saved",
    note: "2 watched routes",
    url: "",
    icon: "F",
    tone: "gold",
    locked: true,
  },
];

const state = {
  selectedSource: "all",
  filter: "all",
  query: "",
  plan: [],
  sources: loadSources(),
};

const jobList = document.querySelector("#jobList");
const planList = document.querySelector("#planList");
const sourceList = document.querySelector("#sourceList");
const sourceDialog = document.querySelector("#sourceDialog");
const sourceForm = document.querySelector("#sourceForm");
const metrics = {
  earnings: document.querySelector("#metricEarnings"),
  paidMiles: document.querySelector("#metricPaidMiles"),
  gaps: document.querySelector("#metricGapMiles"),
  finish: document.querySelector("#metricFinish"),
};
const nextSuggestion = document.querySelector("#nextSuggestion");

function loadSources() {
  const saved = localStorage.getItem("drivearound-sources");
  if (!saved) return defaultSources;

  try {
    const customSources = JSON.parse(saved);
    return [...defaultSources, ...customSources];
  } catch {
    return defaultSources;
  }
}

function saveCustomSources() {
  const customSources = state.sources.filter((source) => !source.locked);
  localStorage.setItem("drivearound-sources", JSON.stringify(customSources));
}

function normalizeUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getSourceInitial(name) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

function getLastStop() {
  return state.plan.length ? state.plan[state.plan.length - 1].to : "Bristol";
}

function isCompatible(job) {
  return job.from === getLastStop() || state.plan.length === 0;
}

function getVisibleJobs() {
  return jobs.filter((job) => {
    const sourceMatch = state.selectedSource === "all" || job.source === state.selectedSource;
    const searchText = `${job.vehicle} ${job.from} ${job.to} ${job.source}`.toLowerCase();
    const queryMatch = searchText.includes(state.query.toLowerCase());
    const filterMatch =
      state.filter === "all" ||
      (state.filter === "near" && isCompatible(job)) ||
      (state.filter === "return" && (job.to === "Bristol" || job.tags.includes("heads home")));
    const notPlanned = !state.plan.some((planned) => planned.id === job.id);

    return sourceMatch && queryMatch && filterMatch && notPlanned;
  });
}

function formatSource(source) {
  return {
    movex: "MoveX",
    shiply: "Shiply",
    dealer: "Dealer",
  }[source] || "Custom site";
}

function renderSources() {
  sourceList.innerHTML = "";

  state.sources.forEach((source) => {
    const item = document.createElement("div");
    item.className = `source ${state.selectedSource === source.source ? "active" : ""}`;

    const main = document.createElement("button");
    main.className = "source-main";
    main.type = "button";
    main.dataset.source = source.source;

    const icon = document.createElement("span");
    icon.className = `source-icon ${source.tone || ""}`.trim();
    icon.textContent = source.icon;

    const text = document.createElement("span");
    const name = document.createElement("strong");
    const note = document.createElement("small");
    name.textContent = source.name;
    note.textContent = source.note;
    text.append(name, note);
    main.append(icon, text);

    const actions = document.createElement("span");
    actions.className = "source-actions";

    if (source.url) {
      const open = document.createElement("a");
      open.className = "source-open";
      open.href = source.url;
      open.target = "_blank";
      open.rel = "noreferrer";
      open.textContent = "Open";
      actions.append(open);
    }

    if (!source.locked) {
      const remove = document.createElement("button");
      remove.className = "source-remove";
      remove.type = "button";
      remove.dataset.removeSource = source.id;
      remove.setAttribute("aria-label", `Remove ${source.name}`);
      remove.textContent = "x";
      actions.append(remove);
    }

    item.append(main, actions);
    sourceList.append(item);
  });
}

function renderJobs() {
  const visibleJobs = getVisibleJobs();
  jobList.innerHTML = "";

  if (!visibleJobs.length) {
    jobList.innerHTML = '<div class="empty-state">No matching legs right now. Widen the filter or clear search.</div>';
    return;
  }

  visibleJobs.forEach((job) => {
    const card = document.createElement("article");
    card.className = `job-card ${isCompatible(job) ? "compatible" : ""}`;
    card.innerHTML = `
      <div>
        <h4>${job.from} to ${job.to} · ${job.vehicle}</h4>
        <div class="job-meta">
          <span>${formatSource(job.source)}</span>
          <span>${job.start}</span>
          <span>${job.miles} paid mi</span>
          <span>${job.gap} mi gap</span>
        </div>
        <div class="job-tags">
          ${job.tags.map((tag) => `<span class="${tag.includes("home") || tag.includes("match") ? "good" : ""}">${tag}</span>`).join("")}
        </div>
      </div>
      <div class="job-pay">
        <strong>£${job.pay}</strong>
        <button class="primary-button slim" type="button" data-add="${job.id}">Add leg</button>
      </div>
    `;
    jobList.append(card);
  });
}

function renderPlan() {
  planList.innerHTML = "";

  if (!state.plan.length) {
    planList.innerHTML = '<li class="empty-state">Add a paid leg to start building a chain from home.</li>';
  } else {
    state.plan.forEach((job, index) => {
      const item = document.createElement("li");
      item.className = "plan-item";
      item.innerHTML = `
        <span class="plan-number">${index + 1}</span>
        <div>
          <h4>${job.vehicle}: ${job.from} to ${job.to}</h4>
          <p>${job.start} · £${job.pay} · ${job.miles} paid miles · ${job.gap} unpaid gap</p>
        </div>
        <button class="remove-button" type="button" aria-label="Remove ${job.vehicle}" data-remove="${job.id}">×</button>
      `;
      planList.append(item);
    });
  }

  updateMetrics();
  updateSuggestion();
  renderJobs();
}

function updateMetrics() {
  const earnings = state.plan.reduce((sum, job) => sum + job.pay, 0);
  const paidMiles = state.plan.reduce((sum, job) => sum + job.miles, 0);
  const gaps = state.plan.reduce((sum, job) => sum + job.gap, 0);
  const lastStop = getLastStop();

  metrics.earnings.textContent = `£${earnings}`;
  metrics.paidMiles.textContent = `${paidMiles}`;
  metrics.gaps.textContent = `${gaps} mi`;
  metrics.finish.textContent = lastStop === "Bristol" ? "Home" : lastStop;
}

function getBestNextJob() {
  const lastStop = getLastStop();
  const candidates = jobs.filter((job) => {
    const unused = !state.plan.some((planned) => planned.id === job.id);
    return unused && (job.from === lastStop || state.plan.length === 0);
  });

  return candidates.sort((a, b) => b.pay / Math.max(b.gap, 1) - a.pay / Math.max(a.gap, 1))[0];
}

function updateSuggestion() {
  const suggestion = getBestNextJob();
  const button = document.querySelector("#addSuggestion");

  if (!suggestion) {
    nextSuggestion.textContent = "No direct next leg. Check the websites for a short reposition.";
    button.disabled = true;
    return;
  }

  nextSuggestion.textContent = `${suggestion.from} to ${suggestion.to} in the ${suggestion.vehicle} for £${suggestion.pay}.`;
  button.disabled = false;
  button.dataset.id = suggestion.id;
}

function addJob(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job || state.plan.some((item) => item.id === id)) return;
  state.plan.push(job);
  renderPlan();
}

function removeJob(id) {
  state.plan = state.plan.filter((job) => job.id !== id);
  renderPlan();
}

jobList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addJob(button.dataset.add);
});

planList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (button) removeJob(button.dataset.remove);
});

sourceList.addEventListener("click", (event) => {
  const sourceButton = event.target.closest("[data-source]");
  const removeButton = event.target.closest("[data-remove-source]");

  if (sourceButton) {
    state.selectedSource = sourceButton.dataset.source;
    renderSources();
    renderJobs();
  }

  if (removeButton) {
    state.sources = state.sources.filter((source) => source.id !== removeButton.dataset.removeSource);
    saveCustomSources();
    renderSources();
  }
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

document.querySelector("#optimizeButton").addEventListener("click", () => {
  state.plan = ["mx-104", "dl-221", "sh-552", "mx-118", "dl-235"].map((id) =>
    jobs.find((job) => job.id === id),
  );
  renderPlan();
});

document.querySelector("#clearPlan").addEventListener("click", () => {
  state.plan = [];
  renderPlan();
});

document.querySelector("#addSuggestion").addEventListener("click", (event) => {
  addJob(event.currentTarget.dataset.id);
});

document.querySelector("#addSource").addEventListener("click", () => {
  sourceForm.reset();
  sourceDialog.showModal();
});

sourceForm.addEventListener("submit", (event) => {
  if (sourceForm.returnValue === "cancel" || event.submitter?.value === "cancel") return;

  const name = document.querySelector("#siteName").value.trim();
  const url = normalizeUrl(document.querySelector("#siteUrl").value.trim());
  const note = document.querySelector("#siteNotes").value.trim() || "Login shortcut";
  if (!name || !url) return;

  state.sources.push({
    id: `custom-${Date.now()}`,
    name,
    source: `custom-${Date.now()}`,
    note,
    url,
    icon: getSourceInitial(name),
    tone: "",
    locked: false,
  });
  saveCustomSources();
  renderSources();
});

renderSources();
renderPlan();
